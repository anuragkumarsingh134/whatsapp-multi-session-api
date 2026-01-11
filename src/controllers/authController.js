const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByUsername, updateUser, getUserById } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123';

const authController = {
    // Register a new user
    signup: async (req, res) => {
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
            // Default: role=client, isVerified=0 (requires admin approval)
            createUser(username, hashedPassword, 'client', 0);

            res.json({ success: true, message: 'Account created. Please wait for admin verification.' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Login user
    login: async (req, res) => {
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

            if (user.is_verified === 0) {
                return res.status(403).json({ success: false, error: 'Account pending verification' });
            }

            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Update Profile
    updateProfile: async (req, res) => {
        try {
            const { userId } = req.user;
            const { name, email, username, password } = req.body;

            const updates = {};
            if (name !== undefined) updates.name = name;
            if (email !== undefined) updates.email = email;
            if (username !== undefined) {
                // Check uniqueness if changing username
                const existing = getUserByUsername(username);
                if (existing && existing.id !== userId) {
                    return res.status(400).json({ success: false, error: 'Username already taken' });
                }
                updates.username = username;
            }
            if (password) {
                updates.password = await bcrypt.hash(password, 10);
            }

            updateUser(userId, updates);

            // Return updated user info (without password)
            const updatedUser = getUserById(userId);

            res.json({
                success: true,
                message: 'Profile updated',
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    role: updatedUser.role,
                    name: updatedUser.name,
                    email: updatedUser.email
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = authController;
