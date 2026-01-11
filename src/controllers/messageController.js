const sessionManager = require('../services/sessionManager');
const { validateApiKey } = require('../db/database');

const messageController = {
    // Send message (requires Bearer auth)
    sendMessage: async (req, res) => {
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
    },

    // Send message via GET (requires Bearer auth in query or header)
    sendMessageViaGet: async (req, res) => {
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
    },

    // Send document (requires Bearer auth)
    sendDocument: async (req, res) => {
        try {
            const { deviceId } = req;
            const { number, url, fileName, mimetype } = req.body;

            if (!number || !url) {
                return res.status(400).json({
                    success: false,
                    error: 'number and url are required'
                });
            }

            const result = await sessionManager.sendDocument(deviceId, number, url, fileName, mimetype);

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
    },

    // Send document via GET (requires Bearer auth in query or header)
    sendDocumentViaGet: async (req, res) => {
        try {
            const { deviceId, number, url, fileName, mimetype, apiKey } = req.query;

            // Check for API key in query or header
            const authKey = apiKey || req.headers.authorization?.replace('Bearer ', '');

            if (!authKey) {
                return res.status(401).json({
                    success: false,
                    error: 'API key required. Use ?apiKey=YOUR_KEY or Authorization header'
                });
            }

            if (!deviceId || !number || !url) {
                return res.status(400).json({
                    success: false,
                    error: 'deviceId, number, and url are required'
                });
            }

            // Validate API key
            if (!validateApiKey(deviceId, authKey)) {
                return res.status(403).json({
                    success: false,
                    error: 'Invalid API key for this device'
                });
            }

            const result = await sessionManager.sendDocument(deviceId, number, url, fileName, mimetype);

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
    }
};

module.exports = messageController;
