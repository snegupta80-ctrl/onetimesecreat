const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  secretId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secret',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  action: {
    type: String,
    enum: ['created', 'viewed', 'expired', 'deleted'],
    required: true
  },
  ip: {
    type: String
  },
  location: {
    city: String,
    country: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

accessLogSchema.index({ secretId: 1 });
accessLogSchema.index({ userId: 1 });
accessLogSchema.index({ teamId: 1 });
accessLogSchema.index({ action: 1 });
accessLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
