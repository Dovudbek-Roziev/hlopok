const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone:     { type: String, required: true },
  code:      { type: String, required: true },
  expiresAt: { type: Date,   required: true },
  used:      { type: Boolean, default: false },
}, { timestamps: true });

// MongoDB avtomatik o'chiradi (TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
