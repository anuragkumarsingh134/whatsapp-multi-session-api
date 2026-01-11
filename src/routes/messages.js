const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const bearerAuth = require('../middleware/bearerAuth');

// Send message (requires Bearer auth)
router.post('/send', bearerAuth, messageController.sendMessage);

// Send message via GET (requires Bearer auth in query or header)
router.get('/send', messageController.sendMessageViaGet);

// Send document (requires Bearer auth)
router.post('/send-file', bearerAuth, messageController.sendDocument);

// Send document via GET (requires Bearer auth in query or header)
router.get('/send-file', messageController.sendDocumentViaGet);

module.exports = router;
