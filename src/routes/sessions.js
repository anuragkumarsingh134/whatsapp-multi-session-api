const express = require('express');
const router = express.Router();
const { createSession: dbCreateSession, getSession: dbGetSession, getAllSessions, setApiKey, deleteSession: dbDeleteSession } = require('../db/database');
const sessionManager = require('../services/sessionManager');
const crypto = require('crypto');

// List all sessions
router.get('/', (req, res) => {
    try {
        const sessions = getAllSessions();
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

// Create new session
router.post('/', async (req, res) => {
    try {
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({ success: false, error: 'deviceId is required' });
        }

        // Check if session already exists
        const existing = dbGetSession(deviceId);
        if (existing) {
            return res.status(409).json({ success: false, error: 'Session already exists' });
        }

        // Create in database
        dbCreateSession(deviceId);

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

// Get session details
router.get('/:deviceId', (req, res) => {
    try {
        const { deviceId } = req.params;
        const session = dbGetSession(deviceId);

        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        res.json({
            success: true,
            session: {
                deviceId: session.device_id,
                connectionState: session.connection_state,
                hasApiKey: !!session.api_key,
                apiKeyMasked: session.api_key ? `${session.api_key.substring(0, 8)}...` : null,
                phoneNumber: session.phone_number,
                createdAt: session.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get QR code
router.get('/:deviceId/qr', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const qrData = await sessionManager.getQRCode(deviceId);
        res.json({ success: true, ...qrData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Set/Update API key
router.put('/:deviceId/api-key', (req, res) => {
    try {
        const { deviceId } = req.params;
        let { apiKey } = req.body;

        const session = dbGetSession(deviceId);
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

// Delete session
router.delete('/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;

        // Logout from WhatsApp
        await sessionManager.deleteSession(deviceId);

        // Delete from database
        dbDeleteSession(deviceId);

        res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
