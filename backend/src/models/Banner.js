// Banner modeli / Banner model
const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  // 'slider' — bosh sahifa slayder, 'promo' — reklama banner
  // 'slider' — home slider, 'promo' — promo banner
  type:  { type: String, enum: ['slider', 'promo'], required: true },
  image: { type: String, required: true }, // Cloudinary URL

  // Slayder uchun / For slider
  title_ru:    { type: String, default: '' },
  title_ky:    { type: String, default: '' },
  linkUrl:     { type: String, default: '' }, // Havola / Link

  // Reklama banner uchun / For promo banner
  whatsappUrl: { type: String, default: '' },
  telegramUrl: { type: String, default: '' },

  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);
