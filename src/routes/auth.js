const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userAuth = require('../middleware/userAuth');

// Register a new user
router.post('/signup', authController.signup);

// Login user
router.post('/login', authController.login);

// Update Profile
router.put('/update-profile', userAuth, authController.updateProfile);

module.exports = router;
