const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, maxlength: 500, default: '' },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ review: 1, reporter: 1 }, { unique: true });
module.exports = mongoose.model('ReviewReport', schema);
