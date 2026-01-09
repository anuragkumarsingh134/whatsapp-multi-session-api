const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const { useSQLiteAuthState } = require('../db/authState');
const { updateSessionState, updateSessionPhone } = require('../db/database');

// Map to store active sessions: deviceId -> { sock, qrCode, status }
const activeSessions = new Map();

/**
 * Create and initialize a WhatsApp session
 */
const createSession = async (deviceId) => {
    if (activeSessions.has(deviceId)) {
        throw new Error('Session already exists');
    }

    const { state, saveCreds } = await useSQLiteAuthState(deviceId);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
    });

    const sessionData = {
        sock,
        qrCode: null,
        status: 'disconnected'
    };

    activeSessions.set(deviceId, sessionData);

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            sessionData.qrCode = qr;
            sessionData.status = 'waiting_qr';
            updateSessionState(deviceId, 'waiting_qr');
            console.log(`[${deviceId}] QR Code generated`);
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[${deviceId}] Connection closed, reconnecting: ${shouldReconnect}`);

            sessionData.status = 'disconnected';
            sessionData.qrCode = null;
            updateSessionState(deviceId, 'disconnected');

            if (shouldReconnect) {
                // Remove from map before reconnecting to avoid "already exists" error
                activeSessions.delete(deviceId);
                // Reconnect after delay
                setTimeout(() => createSession(deviceId), 3000);
            } else {
                activeSessions.delete(deviceId);
            }
        } else if (connection === 'open') {
            console.log(`[${deviceId}] Connection opened`);
            sessionData.status = 'connected';
            sessionData.qrCode = null;
            updateSessionState(deviceId, 'connected');

            // Get phone number
            const phoneNumber = sock.user?.id?.split(':')[0];
            if (phoneNumber) {
                updateSessionPhone(deviceId, phoneNumber);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    return sessionData;
};

/**
 * Get existing session
 */
const getSession = (deviceId) => {
    return activeSessions.get(deviceId);
};

/**
 * Get QR code for a session
 */
const getQRCode = async (deviceId) => {
    const session = activeSessions.get(deviceId);
    if (!session) {
        throw new Error('Session not found');
    }

    if (session.status === 'connected') {
        return { message: 'Already connected' };
    }

    if (!session.qrCode) {
        return { message: 'QR Code not generated yet' };
    }

    const qrImage = await QRCode.toDataURL(session.qrCode);
    return { qrCode: session.qrCode, qrImage };
};

/**
 * Send message via session
 */
const sendMessage = async (deviceId, phone, message) => {
    const session = activeSessions.get(deviceId);
    if (!session) {
        throw new Error('Session not found');
    }

    if (session.status !== 'connected') {
        throw new Error('Session not connected');
    }

    let jid = phone;
    if (!jid.includes('@s.whatsapp.net')) {
        jid = `${phone}@s.whatsapp.net`;
    }

    await session.sock.sendMessage(jid, { text: message });
    return { status: 'sent', to: jid, message };
};

/**
 * Logout and delete session
 */
const deleteSession = async (deviceId) => {
    const session = activeSessions.get(deviceId);
    if (session && session.sock) {
        try {
            await session.sock.logout();
        } catch (e) {
            console.error(`[${deviceId}] Logout error:`, e);
        }
    }
    activeSessions.delete(deviceId);
};

/**
 * List all active sessions
 */
const listSessions = () => {
    const sessions = [];
    for (const [deviceId, data] of activeSessions.entries()) {
        sessions.push({
            deviceId,
            status: data.status,
            hasQR: !!data.qrCode
        });
    }
    return sessions;
};

/**
 * Initialize sessions from database on startup
 */
const initializeSessions = async () => {
    const { getAllSessions } = require('../db/database');
    const sessions = getAllSessions();

    console.log(`Found ${sessions.length} session(s) in database`);

    for (const session of sessions) {
        try {
            console.log(`Restoring session: ${session.device_id}`);
            await createSession(session.device_id);
        } catch (error) {
            console.error(`Failed to restore session ${session.device_id}:`, error.message);
        }
    }
};

module.exports = {
    createSession,
    getSession,
    getQRCode,
    sendMessage,
    deleteSession,
    listSessions,
    initializeSessions
};
