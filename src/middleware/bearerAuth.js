const { validateApiKey } = require('../db/database');

const bearerAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid Authorization header. Expected: Bearer <api_key>'
        });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '
    const deviceId = req.body.deviceId || req.query.deviceId;

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

    req.deviceId = deviceId;
    req.apiKey = apiKey;
    next();
};

module.exports = bearerAuth;
