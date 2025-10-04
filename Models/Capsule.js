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

// Virtual for time until delivery
capsuleSchema.virtual('timeUntilDelivery').get(function() {
    return this.scheduleDate - Date.now();
});

// Method to check if capsule is ready for delivery
capsuleSchema.methods.isReadyForDelivery = function() {
    return this.status === 'pending' && this.scheduleDate <= Date.now();
};

// Static method to find capsules ready for delivery
capsuleSchema.statics.findReadyForDelivery = function() {
    return this.find({
        status: 'pending',
        scheduleDate: { $lte: new Date() }
    });
};

module.exports = mongoose.model('Capsule', capsuleSchema);