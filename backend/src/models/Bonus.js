// Bonus modeli / Bonus model
const mongoose = require('mongoose');

// Bonus tranzaksiyasi / Bonus transaction
const BonusTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // 'earned' — bonus oldi, 'used' — sarflandi, 'refund' — qaytarildi, 'admin_add' — admin qo'shdi, 'expired' — muddati o'tdi
  type: {
    type: String,
    enum: ['earned', 'used', 'refund', 'admin_add', 'expired'],
    required: true,
  },
  amount: { type: Number, required: true },
  order:  { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  // Muddat tugash sanasi / Expiry date (ro'yxatdan o'tgan kundan 3 oy / 3 months from registration)
  expiresAt: { type: Date },

  description_ru: { type: String, default: '' },
  description_ky: { type: String, default: '' },
}, { timestamps: true });

// Bonus sozlamalari / Bonus settings (faqat bitta yozuv / only one record)
const BonusSettingsSchema = new mongoose.Schema({
  bonusPercent: { type: Number, default: 5 },       // 5%
  expiryDays:   { type: Number, default: 90 },      // 3 oy / 3 months
  warningDays:  { type: Number, default: 7 },       // 7 kun oldin ogohlantirish / Warning 7 days before
}, { timestamps: true });

module.exports = {
  BonusTransaction: mongoose.model('BonusTransaction', BonusTransactionSchema),
  BonusSettings:    mongoose.model('BonusSettings', BonusSettingsSchema),
};
