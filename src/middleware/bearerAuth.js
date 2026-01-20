const { validateApiKey, getSession } = require('../db/database');

const bearerAuth = (req, res, next) => {
    let apiKey = null;

    // 1. Check Authorization header (Bearer)
    const authHeader = req.headers.authorization;
    if (authHeader) {
        if (authHeader.toLowerCase().startsWith('bearer ')) {
            apiKey = authHeader.substring(7).trim();
        } else {
            // Provide fallback even if not strictly "Bearer "
            // Some clients might send just the token
            apiKey = authHeader.trim();
        }
    }

    // 2. Check x-api-key or api-key headers if no Bearer token found
    if (!apiKey) {
        apiKey = req.headers['x-api-key'] || req.headers['api-key'];
    }

    // 3. Fallback to query param (optional, mostly for GET requests but good for robustness)
    if (!apiKey && req.query.apiKey) {
        apiKey = req.query.apiKey;
    }

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'Missing API key. Please provide Authorization: Bearer <key> or x-api-key header.'
        });
    }

    const deviceId = req.params.deviceId || req.query.deviceId || (req.body && req.body.deviceId);

    if (!deviceId) {
        return res.status(400).json({
            success: false,
            error: 'deviceId is required'
        });
    }

    if (!validateApiKey(deviceId, apiKey)) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API key for this device'
        });
    }

    // Get session to find user_id
    const session = getSession(deviceId);
    if (session && session.user_id) {
        const { getUserById } = require('../db/database');
        const user = getUserById(session.user_id);
        if (user) {
            req.user = {
                userId: user.id,
                username: user.username,
                role: user.role
            };
        }
    }

    req.deviceId = deviceId;
    req.apiKey = apiKey;
    next();
};

module.exports = bearerAuth;
