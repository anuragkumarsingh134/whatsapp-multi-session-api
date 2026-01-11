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
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            const wasWaitingForQR = sessionData.status === 'waiting_qr';
            const isRestart = statusCode === DisconnectReason.restartRequired;

            // Block reconnect ONLY if waiting for QR and NOT a restart
            const blockReconnect = wasWaitingForQR && !isRestart;

            console.log(`[${deviceId}] Connection closed (Status: ${statusCode}). Reconnecting: ${shouldReconnect && !blockReconnect}`);

            if (blockReconnect) {
                // Stop strategy
                sessionData.status = 'disconnected';
                sessionData.qrCode = null;
                updateSessionState(deviceId, 'disconnected');
                activeSessions.delete(deviceId);
            } else if (shouldReconnect) {
                // Reconnect strategy
                activeSessions.delete(deviceId);
                setTimeout(() => createSession(deviceId), isRestart ? 100 : 3000);
            } else {
                // Logout strategy
                sessionData.status = 'disconnected';
                sessionData.qrCode = null;
                updateSessionState(deviceId, 'disconnected');
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
 * Get profile picture for connected session
 */
const getProfilePicture = async (deviceId) => {
    const session = activeSessions.get(deviceId);
    if (!session) {
        throw new Error('Session not found');
    }

    if (session.status !== 'connected') {
        throw new Error('Session not connected');
    }

    try {
        // Get the user's own JID (WhatsApp ID)
        const userJid = session.sock.user?.id;
        if (!userJid) {
            return { profilePicUrl: null };
        }

        // Fetch profile picture URL
        const profilePicUrl = await session.sock.profilePictureUrl(userJid, 'image');
        return { profilePicUrl };
    } catch (error) {
        console.log(`[${deviceId}] No profile picture available:`, error.message);
        return { profilePicUrl: null };
    }
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
 * Send document via session
 */
const sendDocument = async (deviceId, phone, url, fileName, mimetype) => {
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

    await session.sock.sendMessage(jid, {
        document: { url: url },
        mimetype: mimetype || 'application/pdf',
        fileName: fileName || 'document.pdf'
    });

    return { status: 'sent', to: jid, fileName };
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
            if (session.connection_state !== 'connected') {
                console.log(`Skipping restoration for session ${session.device_id} (State: ${session.connection_state})`);
                // Reset stale waiting_qr state to disconnected so user can regenerate
                if (session.connection_state === 'waiting_qr') {
                    updateSessionState(session.device_id, 'disconnected');
                }
                continue;
            }

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
    getProfilePicture,
    sendMessage,
    sendDocument,
    deleteSession,
    listSessions,
    initializeSessions
};
