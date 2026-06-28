// Aksiya modeli / Promotion model
const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  image:          { type: String, required: true }, // Cloudinary URL
  title_ru:       { type: String, required: true },
  title_ky:       { type: String, required: true },
  description_ru: { type: String, default: '' },
  description_ky: { type: String, default: '' },
  startDate:      { type: Date, required: true },
  endDate:        { type: Date, required: true },
  isActive:       { type: Boolean, default: true },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },

  // Aksiyaga biriktirilgan mahsulotlar, har biriga ixtiyoriy chegirma miqdori chegarasi
  // Products attached to the promotion, each with an optional quantity limit "at this price"
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    limit:   { type: Number, default: null, min: 0 }, // null = chegarasiz / unlimited
    _id: false,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Promotion', PromotionSchema);
