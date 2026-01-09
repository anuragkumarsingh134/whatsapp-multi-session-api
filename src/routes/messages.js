const express = require('express');
const router = express.Router();
const bearerAuth = require('../middleware/bearerAuth');
const sessionManager = require('../services/sessionManager');

// Send message (requires Bearer auth)
router.post('/send', bearerAuth, async (req, res) => {
    try {
        const { deviceId } = req;
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json({
                success: false,
                error: 'number and message are required'
            });
        }

        const result = await sessionManager.sendMessage(deviceId, number, message);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send message via GET (requires Bearer auth in query or header)
router.get('/send', async (req, res) => {
    try {
        const { deviceId, number, message, apiKey } = req.query;

        // Check for API key in query or header
        const authKey = apiKey || req.headers.authorization?.replace('Bearer ', '');

        if (!authKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required. Use ?apiKey=YOUR_KEY or Authorization header'
            });
        }

        if (!deviceId || !number || !message) {
            return res.status(400).json({
                success: false,
                error: 'deviceId, number, and message are required'
            });
        }

        // Validate API key
        const { validateApiKey } = require('../db/database');
        if (!validateApiKey(deviceId, authKey)) {
            return res.status(403).json({
                success: false,
                error: 'Invalid API key for this device'
            });
        }

        const result = await sessionManager.sendMessage(deviceId, number, message);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
