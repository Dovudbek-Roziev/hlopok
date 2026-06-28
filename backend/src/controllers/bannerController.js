// Banner kontrolleri / Banner controller
const Banner = require('../models/Banner');
const msg = require('../utils/msg');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

exports.getBanners = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    const banners = await Banner.find(filter).sort({ order: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ type: 1, order: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const image = req.file ? await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'hlopok/banners') : '';
    if (!image) return res.status(400).json({ success: false, message: msg(req, 'Загрузите изображение баннера', 'Баннер сүрөтүн жүктөңүз') });
    const { type, title_ru, title_ky, linkUrl, whatsappUrl, telegramUrl, order, isActive } = req.body;
    if (!type || !['slider', 'promo'].includes(type)) {
      return res.status(400).json({ success: false, message: msg(req, 'Укажите тип баннера (slider или promo)', 'Баннер түрүн көрсөтүңүз') });
    }
    const banner = await Banner.create({ type, title_ru, title_ky, linkUrl, whatsappUrl, telegramUrl, order, isActive, image });
    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка создания баннера', 'Баннер кошуудо ката') });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { type, title_ru, title_ky, linkUrl, whatsappUrl, telegramUrl, order, isActive } = req.body;
    const updates = {};
    if (type !== undefined) updates.type = type;
    if (title_ru !== undefined) updates.title_ru = title_ru;
    if (title_ky !== undefined) updates.title_ky = title_ky;
    if (linkUrl !== undefined) updates.linkUrl = linkUrl;
    if (whatsappUrl !== undefined) updates.whatsappUrl = whatsappUrl;
    if (telegramUrl !== undefined) updates.telegramUrl = telegramUrl;
    if (order !== undefined) updates.order = order;
    if (isActive !== undefined) updates.isActive = isActive;
    if (req.file) updates.image = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'hlopok/banners');
    const banner = await Banner.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: msg(req, 'Баннер не найден', 'Баннер табылган жок') });
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления баннера', 'Баннерди жаңыртууда ката') });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: msg(req, 'Баннер удалён', 'Баннер жок кылынды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка удаления баннера', 'Баннерди жок кылууда ката') });
  }
};
