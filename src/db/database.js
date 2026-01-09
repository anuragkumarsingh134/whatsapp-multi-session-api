const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../whatsapp.db');
const db = new Database(DB_PATH);

// Initialize database schema
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        device_id TEXT UNIQUE NOT NULL,
        connection_state TEXT DEFAULT 'disconnected' CHECK(connection_state IN ('disconnected', 'waiting_qr', 'connected')),
        api_key TEXT,
        phone_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auth_state (
        device_id TEXT NOT NULL,
        key_name TEXT NOT NULL,
        key_value TEXT NOT NULL,
        PRIMARY KEY (device_id, key_name),
        FOREIGN KEY (device_id) REFERENCES sessions(device_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_auth_state_device ON auth_state(device_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_state ON sessions(connection_state);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

// Migration: Add user_id to sessions if it doesn't exist
try {
    db.exec('ALTER TABLE sessions ADD COLUMN user_id INTEGER');
} catch (e) {
    // Column already exists or other error
}

// Helper functions
const helpers = {
    // User functions
    createUser: (username, hPassword) => {
        return db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hPassword);
    },

    getUserByUsername: (username) => {
        return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    },

    getUserById: (id) => {
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    },

    // Session functions
    createSession: (deviceId, userId) => {
        return db.prepare('INSERT INTO sessions (device_id, user_id) VALUES (?, ?)').run(deviceId, userId);
    },

    getSession: (deviceId, userId) => {
        if (userId) {
            return db.prepare('SELECT * FROM sessions WHERE device_id = ? AND user_id = ?').get(deviceId, userId);
        }
        return db.prepare('SELECT * FROM sessions WHERE device_id = ?').get(deviceId);
    },

    getAllSessions: (userId) => {
        if (userId) {
            return db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        }
        return db.prepare('SELECT * FROM sessions ORDER BY created_at DESC').all();
    },

    updateSessionState: (deviceId, state) => {
        return db.prepare('UPDATE sessions SET connection_state = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?')
            .run(state, deviceId);
    },

    updateSessionPhone: (deviceId, phoneNumber) => {
        return db.prepare('UPDATE sessions SET phone_number = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?')
            .run(phoneNumber, deviceId);
    },

    setApiKey: (deviceId, apiKey) => {
        return db.prepare('UPDATE sessions SET api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?')
            .run(apiKey, deviceId);
    },

    deleteSession: (deviceId, userId) => {
        if (userId) {
            const session = db.prepare('SELECT id FROM sessions WHERE device_id = ? AND user_id = ?').get(deviceId, userId);
            if (!session) return { changes: 0 };
        }
        // Delete auth state
        db.prepare('DELETE FROM auth_state WHERE device_id = ?').run(deviceId);
        return db.prepare('DELETE FROM sessions WHERE device_id = ?').run(deviceId);
    },

    validateApiKey: (deviceId, apiKey) => {
        const session = db.prepare('SELECT * FROM sessions WHERE device_id = ? AND api_key = ?')
            .get(deviceId, apiKey);
        return session !== undefined;
    }
};

module.exports = { db, ...helpers };
