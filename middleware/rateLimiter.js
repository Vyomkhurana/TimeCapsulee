const requestCounts = new Map();
const rateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, 
        max = 100, 
        message = 'Too many requests, please try again later.',
        skipSuccessfulRequests = false
    } = options;
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        for (const [key, value] of requestCounts.entries()) {
            if (now - value.timestamp > windowMs) {
                requestCounts.delete(key);
            }
        }
        const userRequests = requestCounts.get(ip);
        if (!userRequests) {
            requestCounts.set(ip, { count: 1, timestamp: now });
            return next();
        }
        if (now - userRequests.timestamp > windowMs) {
            requestCounts.set(ip, { count: 1, timestamp: now });
            return next();
        }
        if (userRequests.count >= max) {
            return res.status(429).json({
                error: message,
                retryAfter: Math.ceil((userRequests.timestamp + windowMs - now) / 1000)
            });
        }
        userRequests.count++;
        next();
    };
};
module.exports = { rateLimiter };
