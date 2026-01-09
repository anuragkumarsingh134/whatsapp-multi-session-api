const express = require('express');
const router = express.Router();
const { createSession: dbCreateSession, getSession: dbGetSession, getAllSessions, setApiKey, deleteSession: dbDeleteSession } = require('../db/database');
const sessionManager = require('../services/sessionManager');
const userAuth = require('../middleware/userAuth');
const crypto = require('crypto');

// Apply userAuth to all routes
router.use(userAuth);

// List all sessions for current user
router.get('/', (req, res) => {
    try {
        const { userId } = req.user;
        const sessions = getAllSessions(userId);
        const activeSessions = sessionManager.listSessions();

        // Merge database and active session data
        const merged = sessions.map(s => {
            const active = activeSessions.find(a => a.deviceId === s.device_id);
            return {
                deviceId: s.device_id,
                connectionState: s.connection_state,
                hasApiKey: !!s.api_key,
                phoneNumber: s.phone_number,
                createdAt: s.created_at,
                isActive: !!active
            };
        });

        res.json({ success: true, sessions: merged });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new session for current user
router.post('/', async (req, res) => {
    try {
        const { userId } = req.user;
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({ success: false, error: 'deviceId is required' });
        }

        // Check if session already exists for this device (even for other users, deviceId must be unique globally for Baileys)
        const existing = dbGetSession(deviceId);
        if (existing) {
            return res.status(409).json({ success: false, error: 'Session already exists' });
        }

        // Create in database
        dbCreateSession(deviceId, userId);

        // Initialize WhatsApp session
        await sessionManager.createSession(deviceId);

        res.json({
            success: true,
            message: 'Session created',
            deviceId
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get session details for current user
router.get('/:deviceId', (req, res) => {
    try {
        const { userId } = req.user;
        const { deviceId } = req.params;

        // Try getting by userId first, then fallback to global (for legacy sessions)
        let session = dbGetSession(deviceId, userId);
        if (!session) {
            session = dbGetSession(deviceId);
            // If it's a legacy session (user_id is null), allow access and maybe claim it?
            if (session && session.user_id !== null) {
                return res.status(403).json({ success: false, error: 'Unauthorized access' });
            }
        }

        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        console.log(`[SessionDetail] Fetching details for ${deviceId}, keyed: ${!!session.api_key}`);

        res.json({
            success: true,
            session: {
                deviceId: session.device_id,
                connectionState: session.connection_state,
                hasApiKey: !!session.api_key,
                apiKey: session.api_key,
                api_key: session.api_key, // Fallback for any legacy frontend code
                phoneNumber: session.phone_number,
                createdAt: session.created_at
            }
        });
    } catch (error) {
        console.error('Error in GET /:deviceId:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get QR code for current user session
router.get('/:deviceId/qr', async (req, res) => {
    try {
        const { userId } = req.user;
        const { deviceId } = req.params;

        const session = dbGetSession(deviceId, userId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        const qrData = await sessionManager.getQRCode(deviceId);
        res.json({ success: true, ...qrData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Set/Update API key for current user session
router.put('/:deviceId/api-key', (req, res) => {
    try {
        const { userId } = req.user;
        const { deviceId } = req.params;
        let { apiKey } = req.body;

        const session = dbGetSession(deviceId, userId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        // Generate API key if not provided
        if (!apiKey) {
            apiKey = crypto.randomBytes(32).toString('hex');
        }

        setApiKey(deviceId, apiKey);

        res.json({
            success: true,
            message: 'API key updated',
            apiKey // Return unmasked only on creation/update
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete current user session
router.delete('/:deviceId', async (req, res) => {
    try {
        const { userId } = req.user;
        const { deviceId } = req.params;

        const session = dbGetSession(deviceId, userId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        // Logout from WhatsApp
        await sessionManager.deleteSession(deviceId);

        // Delete from database
        dbDeleteSession(deviceId, userId);

        res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
