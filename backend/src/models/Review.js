const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 300, trim: true },
}, { timestamps: true });

// Bir foydalanuvchi bir mahsulotga faqat bir marta
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });
ReviewSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);
