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

module.exports = router;
