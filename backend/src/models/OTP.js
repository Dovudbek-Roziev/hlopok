const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone:     { type: String, required: true },
  purpose:   { type: String, enum: ['registration', 'password_reset'], default: 'registration' },
  codeHash:  { type: String, required: true },
  verificationTokenHash: { type: String, default: undefined },
  expiresAt: { type: Date,   required: true },
  used:      { type: Boolean, default: false },
  attempts:  { type: Number,  default: 0 },
}, { timestamps: true });

// MongoDB avtomatik o'chiradi (TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
