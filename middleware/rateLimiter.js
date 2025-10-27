// Simple rate limiting middleware (in-memory)
const requestCounts = new Map();

const rateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100, // limit each IP to 100 requests per windowMs
        message = 'Too many requests, please try again later.'
    } = options;

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        // Clean up old entries
        for (const [key, value] of requestCounts.entries()) {
            if (now - value.timestamp > windowMs) {
                requestCounts.delete(key);
            }
        }

        // Check current request count
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
