// Kategoriya kontrolleri / Category controller
const Category = require('../models/Category');
const msg = require('../utils/msg');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name_ru, name_ky, icon, order, isActive } = req.body;
    if (!name_ru?.trim() || !name_ky?.trim()) {
      return res.status(400).json({ success: false, message: msg(req, 'Название обязательно', 'Аталышы милдеттүү') });
    }
    const category = await Category.create({ name_ru, name_ky, icon, order: order || 0, isActive: isActive !== false });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка создания категории', 'Категория кошуудо ката') });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name_ru, name_ky, icon, order, isActive } = req.body;
    const update = {};
    if (name_ru !== undefined) update.name_ru = name_ru;
    if (name_ky !== undefined) update.name_ky = name_ky;
    if (icon    !== undefined) update.icon    = icon;
    if (order   !== undefined) update.order   = order;
    if (isActive !== undefined) update.isActive = isActive;
    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true, runValidators: true,
    });
    if (!category) return res.status(404).json({ success: false, message: msg(req, 'Категория не найдена', 'Категория табылган жок') });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления категории', 'Категорияны жаңыртууда ката') });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const Product = require('../models/Product');
    const count = await Product.countDocuments({ category: req.params.id });
    if (count > 0) {
      return res.status(400).json({ success: false, message: msg(req, `Нельзя удалить: ${count} товаров в этой категории`, `${count} товар бар, өчүрүүгө болбойт`) });
    }
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: msg(req, 'Категория не найдена', 'Категория табылган жок') });
    res.json({ success: true, message: msg(req, 'Категория удалена', 'Категория жок кылынды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка удаления категории', 'Категорияны жок кылууда ката') });
  }
};
