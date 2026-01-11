const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const userAuth = require('../middleware/userAuth');

// Apply userAuth to all routes
router.use(userAuth);

// List all sessions for current user
router.get('/', sessionController.listSessions);

// Create new session for current user
router.post('/', sessionController.createSession);

// Start session manually
router.post('/:deviceId/start', sessionController.startSession);

// Get session details for current user
router.get('/:deviceId', sessionController.getSessionDetails);

// Get QR code for current user session
router.get('/:deviceId/qr', sessionController.getQRCode);

// Get profile picture for current user session
router.get('/:deviceId/profile-picture', sessionController.getProfilePicture);

// Set/Update API key for current user session
router.put('/:deviceId/api-key', sessionController.updateApiKey);

// Delete current user session
router.delete('/:deviceId', sessionController.deleteSession);

module.exports = router;
