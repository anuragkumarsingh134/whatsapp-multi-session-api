const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../whatsapp.db');
const db = new Database(DB_PATH);

// Initialize database schema
db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT UNIQUE NOT NULL,
        connection_state TEXT DEFAULT 'disconnected' CHECK(connection_state IN ('disconnected', 'waiting_qr', 'connected')),
        api_key TEXT,
        phone_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
`);

// Helper functions
const sessionHelpers = {
    createSession: (deviceId) => {
        return db.prepare('INSERT INTO sessions (device_id) VALUES (?)').run(deviceId);
    },

    getSession: (deviceId) => {
        return db.prepare('SELECT * FROM sessions WHERE device_id = ?').get(deviceId);
    },

    getAllSessions: () => {
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

    deleteSession: (deviceId) => {
        // Delete auth state (cascade should handle this, but explicit is better)
        db.prepare('DELETE FROM auth_state WHERE device_id = ?').run(deviceId);
        return db.prepare('DELETE FROM sessions WHERE device_id = ?').run(deviceId);
    },

    validateApiKey: (deviceId, apiKey) => {
        const session = db.prepare('SELECT * FROM sessions WHERE device_id = ? AND api_key = ?')
            .get(deviceId, apiKey);
        return session !== undefined;
    }
};

module.exports = { db, ...sessionHelpers };
