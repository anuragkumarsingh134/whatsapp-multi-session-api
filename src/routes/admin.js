const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const os = require('os');

// Helper to get system metrics
const getSystemMetrics = () => {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();

    // CPU Usage (rough estimate)
    // In a real app we'd compare two snapshots, but for now just returning core counts/models

    return {
        cpuCount: cpus.length,
        cpuModel: cpus[0].model,
        totalMemory: totalMem,
        usedMemory: usedMem,
        freeMemory: freeMem,
        uptime: uptime,
        platform: os.platform(),
        processMemory: process.memoryUsage()
    };
};

/**
 * Get all users
 */
router.get('/users', (req, res) => {
    try {
        const users = db.prepare('SELECT id, username, role, is_verified, created_at FROM users ORDER BY created_at DESC').all();
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Toggle user verification
 */
router.post('/users/:id/verify', (req, res) => {
    try {
        const { id } = req.params;
        const { is_verified } = req.body;

        db.prepare('UPDATE users SET is_verified = ? WHERE id = ?').run(is_verified ? 1 : 0, id);

        res.json({ success: true, message: `User ${is_verified ? 'verified' : 'unverified'}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Delete user
 */
router.delete('/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        // Prevent deleting self (if needed, but simple for now)
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get user sessions
 */
router.get('/users/:id/sessions', (req, res) => {
    try {
        const { id } = req.params;
        const { getAllSessions } = require('../db/database');
        const sessions = getAllSessions(id);
        res.json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get System Metrics
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = getSystemMetrics();
        // Also get some app stats
        const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

        res.json({
            success: true,
            metrics: {
                ...metrics,
                appStats: {
                    sessions: sessionCount,
                    users: userCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
