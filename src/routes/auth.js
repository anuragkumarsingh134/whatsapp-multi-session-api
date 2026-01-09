const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByUsername } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123';

/**
 * Register a new user
 */
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password are required' });
        }

        const existingUser = getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        createUser(username, hashedPassword);

        res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password are required' });
        }

        const user = getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
