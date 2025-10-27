const mongoose = require('mongoose');

const capsuleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        maxlength: [5000, 'Message cannot be more than 5000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['personal', 'special', 'academic', 'mental', 'business', 'legacy', 'social'],
            message: '{VALUE} is not a valid category'
        }
    },
    // NEW: Tags for better organization
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    // NEW: Priority level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // NEW: Shared with other users
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permissions: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // NEW: Archive status
    archived: {
        type: Boolean,
        default: false,
        index: true
    },
    // NEW: Reminder settings
    reminder: {
        enabled: {
            type: Boolean,
            default: false
        },
        daysBeforeDelivery: {
            type: Number,
            default: 1,
            min: 1,
            max: 365
        },
        sent: {
            type: Boolean,
            default: false
        }
    },
    // NEW: View count
    views: {
        type: Number,
        default: 0
    },
    // NEW: Last viewed date
    lastViewed: {
        type: Date
    },
    // NEW: Favorite/starred
    starred: {
        type: Boolean,
        default: false
    },
    files: [{
        filename: String,
        path: String,
        mimetype: String
    }],
    scheduleDate: {
        type: Date,
        required: [true, 'Schedule date is required'],
        validate: {
            validator: function(value) {
                return value > Date.now();
            },
            message: 'Schedule date must be in the future'
        }
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Add index for faster queries
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'failed'],
        default: 'pending',
        index: true // Add index for status queries
    },
    error: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // Add index for sorting
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Compound index for efficient queries by creator and status
capsuleSchema.index({ creator: 1, status: 1 });

// Index for scheduled delivery queries
capsuleSchema.index({ scheduleDate: 1, status: 1 });

// Index for category-based queries
capsuleSchema.index({ creator: 1, category: 1 });

// NEW: Index for tags
capsuleSchema.index({ tags: 1 });

// NEW: Index for starred capsules
capsuleSchema.index({ creator: 1, starred: 1 });

// NEW: Compound index for archived capsules
capsuleSchema.index({ creator: 1, archived: 1 });

// NEW: Text index for search
capsuleSchema.index({ title: 'text', message: 'text', tags: 'text' });

// Virtual for time until delivery
capsuleSchema.virtual('timeUntilDelivery').get(function() {
    return this.scheduleDate - Date.now();
});

// Method to check if capsule is ready for delivery
capsuleSchema.methods.isReadyForDelivery = function() {
    return this.status === 'pending' && this.scheduleDate <= Date.now();
};

// NEW: Method to check if reminder should be sent
capsuleSchema.methods.shouldSendReminder = function() {
    if (!this.reminder.enabled || this.reminder.sent || this.status !== 'pending') {
        return false;
    }
    const daysUntilDelivery = (this.scheduleDate - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDelivery <= this.reminder.daysBeforeDelivery && daysUntilDelivery > 0;
};

// NEW: Method to increment view count
capsuleSchema.methods.incrementViews = function() {
    this.views += 1;
    this.lastViewed = new Date();
    return this.save();
};

// Static method to find capsules ready for delivery
capsuleSchema.statics.findReadyForDelivery = function() {
    return this.find({
        status: 'pending',
        scheduleDate: { $lte: new Date() }
    });
};

// NEW: Static method to find capsules needing reminders
capsuleSchema.statics.findNeedingReminders = function() {
    const now = new Date();
    return this.find({
        status: 'pending',
        'reminder.enabled': true,
        'reminder.sent': false,
        scheduleDate: { $gt: now }
    }).populate('creator');
};

module.exports = mongoose.model('Capsule', capsuleSchema);