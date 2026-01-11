const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Get all users
router.get('/users', adminController.getAllUsers);

// Toggle user verification
router.post('/users/:id/verify', adminController.verifyUser);

// Delete user
router.delete('/users/:id', adminController.deleteUser);

// Get user sessions
router.get('/users/:id/sessions', adminController.getUserSessions);

// Get System Metrics
router.get('/metrics', adminController.getMetrics);

module.exports = router;
