const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  secretId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secret',
    required: true
  },
  accessedAt: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String
  }
}, {
  timestamps: true
});

accessLogSchema.index({ secretId: 1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
