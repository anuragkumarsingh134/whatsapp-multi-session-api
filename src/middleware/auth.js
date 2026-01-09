const db = require('../db/database');

const authMiddleware = (req, res, next) => {
    // Check Headers first, then Query Params
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    const deviceId = req.headers['x-device-id'] || req.query.device_id;

    if (!apiKey) {
        return res.status(401).json({ error: 'Missing API Key' });
    }

    // Query database for valid credential
    const validCred = db.prepare('SELECT * FROM credentials WHERE api_key = ?').get(apiKey);

    if (!validCred) {
        return res.status(403).json({ error: 'Invalid API Key' });
    }

    if (deviceId && validCred.device_id !== deviceId) {
        return res.status(403).json({ error: 'Invalid Device ID' });
    }

    // Attach verified device info
    req.deviceId = validCred.device_id;
    req.apiKey = validCred.api_key;
    req.credentialId = validCred.id;

    next();
};

module.exports = authMiddleware;
