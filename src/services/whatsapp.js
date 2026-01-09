const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const { useSQLiteAuthState } = require('../db/authState');

let sock;
let qrCodeData = null;
let connectionStatus = 'disconnected';

const connectToWhatsApp = async () => {
    const { state, saveCreds } = await useSQLiteAuthState('default');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // Suppress internal logs
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeData = qr;
            connectionStatus = 'scanning_qr';
            console.log('New QR Code generated');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            connectionStatus = 'disconnected';
            qrCodeData = null; // Reset QR on close
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
            connectionStatus = 'connected';
            qrCodeData = null;
        }
    });

    sock.ev.on('creds.update', saveCreds);
};

const getStatus = () => {
    return { status: connectionStatus };
};

const getQR = async () => {
    if (connectionStatus === 'connected') {
        return { message: 'Already connected' };
    }
    if (!qrCodeData) {
        return { message: 'QR Code not generated yet or loading' };
    }
    try {
        const qrImage = await QRCode.toDataURL(qrCodeData);
        return { qrCode: qrCodeData, qrImage };
    } catch (err) {
        console.error('Error generating QR image', err);
        throw new Error('Failed to generate QR image');
    }
};

const sendMessage = async (phone, message) => {
    if (connectionStatus !== 'connected' || !sock) {
        throw new Error('WhatsApp not connected');
    }

    // Format phone number (basic handling, assumes international format without + or needs suffix)
    // Baileys typically expects [countrycode][number]@s.whatsapp.net
    let jid = phone;
    if (!jid.includes('@s.whatsapp.net')) {
        jid = `${phone}@s.whatsapp.net`;
    }

    await sock.sendMessage(jid, { text: message });
    return { status: 'sent', to: jid, message };
};

const logout = async () => {
    if (sock) {
        await sock.logout();
        sock = null;
        connectionStatus = 'disconnected';
        qrCodeData = null;

        // Re-initialize to allow new login
        connectToWhatsApp();
        return { message: 'Logged out successfully' };
    }
    return { message: 'No active session' };
}

// Initialize connection on startup
connectToWhatsApp();

module.exports = {
    getStatus,
    getQR,
    sendMessage,
    logout
};
