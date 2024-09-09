const mongoose = require('mongoose');

const pairSchema = new mongoose.Schema({
    instruction: {
        type: String,
        required: true
    },
    output: {
        type: String,
        required: true
    },
    creationMethod: {
        type: String,
        enum: ['manual', 'augmented:paraphrased', null],
        default: null
    },
    approvals: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

pairSchema.virtual('approvalCount').get(function() {
    return this.approvals.length;
});

pairSchema.methods.isApprovedBy = function(userId) {
    return userId && this.approvals.some(approval => approval.user.equals(userId));
};

const Pair = mongoose.model('Pair', pairSchema);

module.exports = Pair;
