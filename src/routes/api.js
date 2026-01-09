const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/status', (req, res) => {
    const status = whatsappService.getStatus();
    res.json(status);
});

router.get('/qr', async (req, res) => {
    try {
        const qr = await whatsappService.getQR();
        res.json(qr);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/send-message', async (req, res) => {
    // Expected format: ?api_key=...&sender=...&number=...&message=...
    const { number, message, sender } = req.query;

    // Users might still use 'phone' from old docs, let's fallback or strictly follow new req?
    // User requested "the api should look something like this", implies strict structure.
    // But for backward compat with my own dashboard, I'll support both for a moment or update dashboard.
    // Let's stick to the new request: number.

    const targetNumber = number || req.query.phone;

    if (!targetNumber || !message) {
        return res.status(400).json({ error: 'Parameters number and message are required' });
    }

    // 'sender' param is received but Baileys sends from the connected account.
    // We can just log it or ignore it for now as we are single-session.
    if (sender) {
        console.log(`Request to send from sender: ${sender}`);
    }

    try {
        const result = await whatsappService.sendMessage(targetNumber, message);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/logout', async (req, res) => {
    try {
        const result = await whatsappService.logout();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
