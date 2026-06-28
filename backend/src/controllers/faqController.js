const FAQ = require('../models/FAQ');
const msg = require('../utils/msg');

exports.getAll = async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, faqs });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.getAll_admin = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, faqs });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.create = async (req, res) => {
  try {
    const { q_ru, a_ru, q_ky, a_ky, order, isActive } = req.body;
    if (!q_ru || !a_ru || !q_ky || !a_ky) {
      return res.status(400).json({ success: false, message: msg(req, 'Заполните все поля', 'Бардык талааларды толтуруңуз') });
    }
    const faq = await FAQ.create({ q_ru, a_ru, q_ky, a_ky, order: order || 0, isActive: isActive !== false });
    res.status(201).json({ success: true, faq });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.update = async (req, res) => {
  try {
    const { q_ru, a_ru, q_ky, a_ky, order, isActive } = req.body;
    const updates = {};
    if (q_ru !== undefined) updates.q_ru = q_ru;
    if (a_ru !== undefined) updates.a_ru = a_ru;
    if (q_ky !== undefined) updates.q_ky = q_ky;
    if (a_ky !== undefined) updates.a_ky = a_ky;
    if (order !== undefined) updates.order = order;
    if (isActive !== undefined) updates.isActive = isActive;
    const faq = await FAQ.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!faq) return res.status(404).json({ success: false, message: msg(req, 'Не найдено', 'Табылган жок') });
    res.json({ success: true, faq });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.remove = async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};
