// Mahsulot modeli / Product model
const mongoose = require('mongoose');

// Har bir o'lcham+rang kombinatsiyasi uchun alohida ombor soni
// Separate stock count for every size+color combination
// color: '' — mahsulotda rang tanlovi yo'q bo'lsa ishlatiladi / used when the product has no color options
const VariantSchema = new mongoose.Schema({
  size:  { type: String, required: true }, // '80', '86', '92', '98', '104', '110', '116'
  color: { type: String, default: '' },
  stock: { type: Number, default: 0, min: 0 },
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  // Nom ikki tilda / Name in two languages
  name_ru: { type: String, required: true, trim: true },
  name_ky: { type: String, required: true, trim: true },

  // Tavsif ikki tilda / Description in two languages
  description_ru: { type: String, default: '' },
  description_ky:  { type: String, default: '' },

  // Narx (KGZ som) / Price — skladdan belgilanadi
  price: { type: Number, default: 0, min: 0 },

  // Rasmlar (Cloudinary URL) / Images
  images: [{ type: String }],

  // Kategoriya / Category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },

  // Brend / Brand
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
  },

  // O'lcham+rang bo'yicha ombor / Stock per size+color combination
  variants: [VariantSchema],

  // Holat / Status
  isActive:     { type: Boolean, default: true },
  isNew:        { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },

  // Jami sotilgan / Total sold
  totalSold: { type: Number, default: 0 },

}, { timestamps: true, suppressReservedKeysWarning: true });

// Qidirish indeksi / Search index
ProductSchema.index({ name_ru: 'text', name_ky: 'text', description_ru: 'text', description_ky: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
