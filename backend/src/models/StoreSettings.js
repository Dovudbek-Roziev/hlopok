// Do'kon sozlamalari / Store settings (faqat bitta yozuv / only one record)
const mongoose = require('mongoose');

const StoreSettingsSchema = new mongoose.Schema({
  phone:        { type: String, default: '' },
  whatsapp:     { type: String, default: '' },
  instagram:    { type: String, default: '' },
  telegram:     { type: String, default: '' },
  address_ru:   { type: String, default: '' },
  address_ky:   { type: String, default: '' },
  hours_ru:     { type: String, default: '' },
  hours_ky:     { type: String, default: '' },
  paymentCard:  { type: String, default: '' },
  paymentName:  { type: String, default: '' },
  paymentQR:    { type: String, default: '' },
  paymentName2: { type: String, default: '' },
  paymentCard2: { type: String, default: '' },
  paymentQR2:   { type: String, default: '' },
  paymentLink:  { type: String, default: '' },
  paymentLink2: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', StoreSettingsSchema);
