const mongoose = require('mongoose');

const secretSchema = new mongoose.Schema({
  encryptedData: {
    type: String,
    required: function() {
      return this.type === 'text' || this.type === 'password';
    }
  },
  password: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['text', 'password', 'file'],
    default: 'text'
  },
  accessLimit: {
    type: Number,
    default: 1,
    enum: [1, 3, 5]
  },
  viewCount: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    enum: ['Work', 'Personal', 'Urgent'],
    default: []
  },
  fileData: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    path: String
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isViewed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required']
  },
  location: {
    ip: String,
    city: String,
    country: String
  }
}, {
  timestamps: true
});

// Index for faster queries
secretSchema.index({ expiresAt: 1 });
secretSchema.index({ createdBy: 1 });
secretSchema.index({ tags: 1 });
secretSchema.index({ teamId: 1 });

// Method to check if secret is expired
secretSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if access limit is reached
secretSchema.methods.isAccessLimitReached = function() {
  return this.viewCount >= this.accessLimit;
};

module.exports = mongoose.model('Secret', secretSchema);
