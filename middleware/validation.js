const validateCapsule = (req, res, next) => {
    const { title, message, scheduleDate, category } = req.body;
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        errors.push('Title is required and must be a non-empty string');
    } else if (title.length > 200) {
        errors.push('Title cannot exceed 200 characters');
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        errors.push('Message is required and must be a non-empty string');
    } else if (message.length > 5000) {
        errors.push('Message cannot exceed 5000 characters');
    }
    if (!scheduleDate) {
        errors.push('Schedule date is required');
    } else {
        const date = new Date(scheduleDate);
        if (isNaN(date.getTime())) {
            errors.push('Invalid schedule date format');
        } else if (date <= new Date()) {
            errors.push('Schedule date must be in the future');
        }
    }
    const validCategories = ['personal', 'special', 'academic', 'mental', 'business', 'legacy', 'social'];
    if (!category || !validCategories.includes(category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    next();
};
const sanitizeInput = (req, res, next) => {
    const sanitize = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/[<>]/g, '') 
            .replace(/javascript:/gi, '') 
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '')
            .replace(/vbscript:/gi, '')
            .trim();
    };
    
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitize(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        });
        return obj;
    };

    if (req.body) {
        sanitizeObject(req.body);
    }
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitize(req.query[key]);
            }
        });
    }
    next();
};
module.exports = { validateCapsule, sanitizeInput };
