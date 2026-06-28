// Do'kon sozlamalari kontrolleri / Store settings controller
const StoreSettings = require('../models/StoreSettings');
const msg = require('../utils/msg');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

const DEFAULTS = {
  phone:      process.env.STORE_PHONE || '',
  whatsapp:   process.env.STORE_WHATSAPP || '',
  instagram:  process.env.STORE_INSTAGRAM || '',
  telegram:   process.env.STORE_TELEGRAM || '',
  address_ru: process.env.STORE_ADDRESS || '',
  address_ky: process.env.STORE_ADDRESS || '',
  hours_ru:   process.env.STORE_HOURS || '',
  hours_ky:   process.env.STORE_HOURS || '',
};

// ─── Do'kon ma'lumotlarini olish (ommaviy) / Get store settings (public) ─────
exports.getSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) settings = await StoreSettings.create(DEFAULTS);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Admin: Do'kon ma'lumotlarini yangilash / Update store settings ─────────
exports.updateSettings = async (req, res) => {
  try {
    const fields = ['phone', 'whatsapp', 'instagram', 'telegram', 'address_ru', 'address_ky', 'hours_ru', 'hours_ky', 'paymentCard', 'paymentName', 'paymentQR', 'paymentName2', 'paymentCard2', 'paymentQR2', 'paymentLink', 'paymentLink2'];
    let settings = await StoreSettings.findOne();
    if (!settings) settings = new StoreSettings(DEFAULTS);
    fields.forEach((f) => {
      if (req.body[f] !== undefined) settings[f] = req.body[f];
    });
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления настроек', 'Созгуларды жаңыртууда ката') });
  }
};

// ─── Admin: QR rasm yuklash / Upload QR image (Mbank) ────────────────────────
exports.uploadQRImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Файл не выбран' });
    const url = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'settings');
    let settings = await StoreSettings.findOne();
    if (!settings) settings = new StoreSettings(DEFAULTS);
    settings.paymentQR = url;
    await settings.save();
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка загрузки', 'Жүктөөдө ката') });
  }
};

// ─── Admin: O!Business QR yuklash / Upload QR image 2 ───────────────────────
exports.uploadQRImage2 = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Файл не выбран' });
    const url = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'settings');
    let settings = await StoreSettings.findOne();
    if (!settings) settings = new StoreSettings(DEFAULTS);
    settings.paymentQR2 = url;
    await settings.save();
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка загрузки', 'Жүктөөдө ката') });
  }
};
