const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  q_ru: { type: String, required: true },
  a_ru: { type: String, required: true },
  q_ky: { type: String, required: true },
  a_ky: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqSchema);
