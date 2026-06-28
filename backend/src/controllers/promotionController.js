// Aksiya kontrolleri / Promotion controller
const Promotion = require('../models/Promotion');
const msg = require('../utils/msg');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

exports.getPromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });
    res.json({ success: true, promotions });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate({ path: 'products.product', select: 'name_ru name_ky images price isActive' })
      .sort({ createdAt: -1 });
    res.json({ success: true, promotions });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Bitta aksiya (mahsulotlari bilan) / Single promotion (with products) ──
exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate({ path: 'products.product', match: { isActive: true } });
    if (!promotion) return res.status(404).json({ success: false, message: msg(req, 'Акция не найдена', 'Акция табылган жок') });

    // Mahsuloti o'chirilgan/aktiv bo'lmagan yozuvlarni chiqarib tashlash
    // Drop entries whose product was deleted/deactivated
    const result = promotion.toObject();
    result.products = result.products.filter(p => p.product);

    res.json({ success: true, promotion: result });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const image = req.file ? await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'hlopok/promotions') : '';
    if (!image) return res.status(400).json({ success: false, message: msg(req, 'Загрузите изображение акции', 'Акция сүрөтүн жүктөңүз') });
    const { title_ru, title_ky, description_ru, description_ky, startDate, endDate, isActive, discountPercent, products } = req.body;
    if (!title_ru || !title_ky || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: msg(req, 'Заполните обязательные поля', 'Милдеттүү талааларды толтуруңуз') });
    }
    const parsedProducts = products ? (typeof products === 'string' ? JSON.parse(products) : products) : [];
    const promotion = await Promotion.create({
      image, title_ru, title_ky,
      description_ru: description_ru || '',
      description_ky: description_ky || '',
      startDate, endDate,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      discountPercent: discountPercent ? Number(discountPercent) : 0,
      products: parsedProducts,
    });
    res.status(201).json({ success: true, promotion });
  } catch (error) {
    console.error('createPromotion error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка создания акции', 'Акция кошуудо ката') });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const { title_ru, title_ky, description_ru, description_ky, startDate, endDate, isActive, discountPercent, products } = req.body;
    const updates = {};
    if (title_ru !== undefined) updates.title_ru = title_ru;
    if (title_ky !== undefined) updates.title_ky = title_ky;
    if (description_ru !== undefined) updates.description_ru = description_ru;
    if (description_ky !== undefined) updates.description_ky = description_ky;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;
    if (discountPercent !== undefined) updates.discountPercent = discountPercent ? Number(discountPercent) : 0;
    if (products !== undefined) updates.products = typeof products === 'string' ? JSON.parse(products) : products;
    if (req.file) updates.image = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'hlopok/promotions');
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!promotion) return res.status(404).json({ success: false, message: msg(req, 'Акция не найдена', 'Акция табылган жок') });
    res.json({ success: true, promotion });
  } catch (error) {
    console.error('updatePromotion error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления акции', 'Акцияны жаңыртууда ката') });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const deleted = await Promotion.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: msg(req, 'Акция не найдена', 'Акция табылган жок') });
    res.json({ success: true, message: msg(req, 'Акция удалена', 'Акция жок кылынды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка удаления акции', 'Акцияны жок кылууда ката') });
  }
};
