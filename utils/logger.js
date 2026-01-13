const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

const LOG_DIR = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getLogFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    return path.join(LOG_DIR, `app-${date}.log`);
};

const formatLog = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaStr}\n`;
};

const writeLog = (level, message, meta = {}) => {
    const logEntry = formatLog(level, message, meta);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(logEntry.trim());
    }
    
    try {
        fs.appendFileSync(getLogFileName(), logEntry);
    } catch (err) {
        console.error('Failed to write log:', err.message);
    }
};

const logger = {
    error: (message, meta) => writeLog(LOG_LEVELS.ERROR, message, meta),
    warn: (message, meta) => writeLog(LOG_LEVELS.WARN, message, meta),
    info: (message, meta) => writeLog(LOG_LEVELS.INFO, message, meta),
    debug: (message, meta) => {
        if (process.env.NODE_ENV === 'development') {
            writeLog(LOG_LEVELS.DEBUG, message, meta);
        }
    },
    
    request: (req, res, responseTime) => {
        const logData = {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?._id
        };
        
        const level = res.statusCode >= 500 ? LOG_LEVELS.ERROR 
            : res.statusCode >= 400 ? LOG_LEVELS.WARN 
            : LOG_LEVELS.INFO;
            
        writeLog(level, 'HTTP Request', logData);
    },
    
    cleanup: (daysToKeep = 7) => {
        try {
            const files = fs.readdirSync(LOG_DIR);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
            
            files.forEach(file => {
                const filePath = path.join(LOG_DIR, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    logger.info(`Deleted old log file: ${file}`);
                }
            });
        } catch (err) {
            console.error('Log cleanup error:', err.message);
        }
    }
};

setInterval(() => logger.cleanup(7), 24 * 60 * 60 * 1000);

module.exports = logger;
