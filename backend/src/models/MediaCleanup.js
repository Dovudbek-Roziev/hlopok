const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  publicId: { type: String, required: true, unique: true },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('MediaCleanup', schema);
