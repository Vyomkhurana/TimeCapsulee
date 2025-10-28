const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['personal', 'special', 'academic', 'mental', 'business', 'legacy', 'social']
    },
    messageTemplate: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
templateSchema.index({ creator: 1, category: 1 });
templateSchema.index({ isPublic: 1, usageCount: -1 });

module.exports = mongoose.model('Template', templateSchema);
