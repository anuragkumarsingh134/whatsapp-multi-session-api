const { validateApiKey, getSession } = require('../db/database');

const bearerAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid Authorization header. Expected: Bearer <api_key>'
        });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '
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
