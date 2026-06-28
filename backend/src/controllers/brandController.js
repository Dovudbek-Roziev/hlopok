// Brend kontrolleri / Brand controller
const Brand = require('../models/Brand');
const msg = require('../utils/msg');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ order: 1 });
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const { name, description, isActive, order } = req.body;
    if (!name) return res.status(400).json({ success: false, message: msg(req, 'Название обязательно', 'Аталышы керек') });
    const logo = req.file ? await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'hlopok/brands') : '';
    const brand = await Brand.create({ name, description: description || '', logo, isActive: isActive !== false, order: order || 0 });
    res.status(201).json({ success: true, brand });
  } catch (error) {
    console.error('createBrand error:', error.message);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка создания бренда', 'Бренд кошуудо ката') });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { name, description, isActive, order } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;
    if (order !== undefined) updates.order = order;
    if (req.file) updates.logo = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'hlopok/brands');
    const brand = await Brand.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!brand) return res.status(404).json({ success: false, message: msg(req, 'Бренд не найден', 'Бренд табылган жок') });
    res.json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления бренда', 'Брендди жаңыртууда ката') });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: msg(req, 'Бренд удалён', 'Бренд жок кылынды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка удаления бренда', 'Брендди жок кылууда ката') });
  }
};
