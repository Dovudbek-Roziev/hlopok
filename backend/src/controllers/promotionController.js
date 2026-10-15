// Aksiya kontrolleri / Promotion controller
const Promotion = require('../models/Promotion');
const msg = require('../utils/msg');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const mongoose = require('mongoose');

function parsePromotionFields(body, existing = {}) {
  const discountPercent = body.discountPercent !== undefined
    ? Number(body.discountPercent)
    : (existing.discountPercent ?? 0);
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error('INVALID_DISCOUNT');
  }

  let products = existing.products || [];
  if (body.products !== undefined) {
    products = typeof body.products === 'string' ? JSON.parse(body.products) : body.products;
    if (!Array.isArray(products)) throw new Error('INVALID_PRODUCTS');
  }
  const seen = new Set();
  products = products.map(entry => {
    const product = typeof entry.product === 'object' ? entry.product?._id : entry.product;
    const limit = entry.limit === '' || entry.limit === undefined ? null : entry.limit;
    if (!mongoose.Types.ObjectId.isValid(product) || seen.has(String(product))) throw new Error('INVALID_PRODUCTS');
    seen.add(String(product));
    if (limit !== null && (!Number.isInteger(Number(limit)) || Number(limit) < 0)) throw new Error('INVALID_PRODUCTS');
    return { product, limit: limit === null ? null : Number(limit) };
  });

  const startDate = body.startDate !== undefined ? new Date(body.startDate) : new Date(existing.startDate);
  if (typeof body.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) startDate.setTime(startDate.getTime() - 6 * 3600000);
  const endDate = body.endDate !== undefined ? new Date(body.endDate) : new Date(existing.endDate);
  if (typeof body.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.endDate)) {
    endDate.setUTCHours(17, 59, 59, 999); // End of calendar day in Asia/Bishkek (UTC+6).
  }
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    throw new Error('INVALID_DATES');
  }
  return { discountPercent, products, startDate, endDate };
}

function invalidPromotionResponse(res, error, req) {
  const message = error.message === 'INVALID_DISCOUNT'
    ? msg(req, 'Скидка должна быть от 0 до 100%', 'Жеңилдик 0дөн 100%га чейин болушу керек')
    : error.message === 'INVALID_DATES'
      ? msg(req, 'Проверьте даты акции', 'Акциянын күндөрүн текшериңиз')
      : msg(req, 'Проверьте товары и ограничения', 'Товарларды жана чектөөлөрдү текшериңиз');
  return res.status(400).json({ success: false, message });
}

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
    const parsed = parsePromotionFields({ startDate, endDate, discountPercent, products });
    const promotion = await Promotion.create({
      image, title_ru, title_ky,
      description_ru: description_ru || '',
      description_ky: description_ky || '',
      startDate: parsed.startDate, endDate: parsed.endDate,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      discountPercent: parsed.discountPercent,
      products: parsed.products,
    });
    res.status(201).json({ success: true, promotion });
  } catch (error) {
    if (['INVALID_DISCOUNT', 'INVALID_DATES', 'INVALID_PRODUCTS'].includes(error.message) || error instanceof SyntaxError) return invalidPromotionResponse(res, error.message === 'INVALID_DISCOUNT' || error.message === 'INVALID_DATES' ? error : new Error('INVALID_PRODUCTS'), req);
    console.error('createPromotion error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка создания акции', 'Акция кошуудо ката') });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const { title_ru, title_ky, description_ru, description_ky, startDate, endDate, isActive, discountPercent, products } = req.body;
    const expectedUpdatedAt = new Date(req.body.expectedUpdatedAt);
    if (!Number.isFinite(expectedUpdatedAt.getTime())) return res.status(409).json({ success: false, message: msg(req, 'Обновите акцию и повторите', 'Акцияны жаңылап, кайталаңыз') });
    const current = await Promotion.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: msg(req, 'Акция не найдена', 'Акция табылган жок') });
    const parsed = parsePromotionFields({ startDate, endDate, discountPercent, products }, current);
    const updates = { startDate: parsed.startDate, endDate: parsed.endDate, discountPercent: parsed.discountPercent, products: parsed.products };
    if (title_ru !== undefined) updates.title_ru = title_ru;
    if (title_ky !== undefined) updates.title_ky = title_ky;
    if (description_ru !== undefined) updates.description_ru = description_ru;
    if (description_ky !== undefined) updates.description_ky = description_ky;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;
    if (req.file) updates.image = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'hlopok/promotions');
    const promotion = await Promotion.findOneAndUpdate({ _id: req.params.id, updatedAt: expectedUpdatedAt }, { $set: updates, $inc: { __v: 1 } }, { new: true, runValidators: true });
    if (!promotion) return res.status(409).json({ success: false, message: msg(req, 'Акция изменилась. Откройте форму заново', 'Акция өзгөрдү. Форманы кайра ачыңыз') });
    res.json({ success: true, promotion });
  } catch (error) {
    if (['INVALID_DISCOUNT', 'INVALID_DATES', 'INVALID_PRODUCTS'].includes(error.message) || error instanceof SyntaxError) return invalidPromotionResponse(res, error.message === 'INVALID_DISCOUNT' || error.message === 'INVALID_DATES' ? error : new Error('INVALID_PRODUCTS'), req);
    console.error('updatePromotion error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления акции', 'Акцияны жаңыртууда ката') });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const deleted = await Promotion.findByIdAndUpdate(req.params.id, { $set: { isActive: false }, $inc: { __v: 1 } }, { new: true });
    if (!deleted) return res.status(404).json({ success: false, message: msg(req, 'Акция не найдена', 'Акция табылган жок') });
    res.json({ success: true, message: msg(req, 'Акция удалена', 'Акция жок кылынды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка удаления акции', 'Акцияны жок кылууда ката') });
  }
};
