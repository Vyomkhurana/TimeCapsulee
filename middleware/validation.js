const validateCapsule = (req, res, next) => {
    const { title, message, scheduleDate, category, tags, priority } = req.body;
    const errors = [];
    
    // Sanitize inputs to prevent XSS
    if (title) req.body.title = title.trim();
    if (message) req.body.message = message.trim();
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        errors.push({ field: 'title', message: 'Title is required and must be a non-empty string' });
    } else if (title.trim().length < 3) {
        errors.push({ field: 'title', message: 'Title must be at least 3 characters long' });
    } else if (title.length > 200) {
        errors.push({ field: 'title', message: 'Title cannot exceed 200 characters' });
    }
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        errors.push({ field: 'message', message: 'Message is required and must be a non-empty string' });
    } else if (message.trim().length < 10) {
        errors.push({ field: 'message', message: 'Message must be at least 10 characters long' });
    } else if (message.length > 5000) {
        errors.push({ field: 'message', message: 'Message cannot exceed 5000 characters' });
    }
    
    if (!scheduleDate) {
        errors.push({ field: 'scheduleDate', message: 'Schedule date is required' });
    } else {
        const date = new Date(scheduleDate);
        const now = new Date();
        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 50);
        
        if (isNaN(date.getTime())) {
            errors.push({ field: 'scheduleDate', message: 'Invalid schedule date format. Use ISO 8601 format' });
        } else if (date <= now) {
            errors.push({ field: 'scheduleDate', message: 'Schedule date must be in the future' });
        } else if (date > maxFutureDate) {
            errors.push({ field: 'scheduleDate', message: 'Schedule date cannot be more than 50 years in the future' });
        }
    }
    
    const validCategories = ['personal', 'special', 'academic', 'mental', 'business', 'legacy', 'social'];
    if (!category || !validCategories.includes(category)) {
        errors.push({ field: 'category', message: `Category must be one of: ${validCategories.join(', ')}` });
    }
    
    if (tags && Array.isArray(tags)) {
        if (tags.length > 10) {
            errors.push({ field: 'tags', message: 'Cannot have more than 10 tags' });
        }
        tags.forEach((tag, index) => {
            if (typeof tag !== 'string' || tag.trim().length === 0) {
                errors.push({ field: 'tags', message: `Tag at index ${index} is invalid` });
            } else if (tag.length > 30) {
                errors.push({ field: 'tags', message: `Tag "${tag}" exceeds 30 characters` });
            }
        });
    }
    
    if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
        errors.push({ field: 'priority', message: 'Priority must be: low, medium, high, or urgent' });
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false, 
            errors,
            message: 'Validation failed',
            count: errors.length 
        });
    }
    next();
};
const sanitizeInput = (req, res, next) => {
    const sanitize = (str) => {
        if (typeof str !== 'string') return str;
        
        return str
            .replace(/[<>"'`]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/\$where/gi, '')
            .replace(/\$ne/gi, '')
            .replace(/\$gt/gi, '')
            .replace(/\$lt/gi, '')
            .replace(/\$regex/gi, '')
            .replace(/eval\(/gi, '')
            .replace(/function\s*\(/gi, '')
            .trim();
    };
    
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const dangerousKeys = ['$where', '$ne', '$gt', '$lt', '$regex', 'constructor', 'prototype', '__proto__'];
        
        Object.keys(obj).forEach(key => {
            if (dangerousKeys.some(dk => key.toLowerCase().includes(dk))) {
                delete obj[key];
                return;
            }
            
            if (typeof obj[key] === 'string') {
                obj[key] = sanitize(obj[key]);
            } else if (Array.isArray(obj[key])) {
                obj[key] = obj[key].map(item => 
                    typeof item === 'string' ? sanitize(item) : 
                    typeof item === 'object' ? sanitizeObject(item) : item
                );
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
        sanitizeObject(req.query);
    }
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            if (typeof req.params[key] === 'string') {
                req.params[key] = sanitize(req.params[key]);
            }
        });
    }
    
    next();
};
module.exports = { validateCapsule, sanitizeInput };
