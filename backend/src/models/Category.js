// Kategoriya modeli / Category model
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name_ru:  { type: String, required: true, trim: true },
  name_ky:  { type: String, required: true, trim: true },
  icon:     { type: String, default: '' },
  order:    { type: Number, default: 0 },     // Tartib / Display order
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
