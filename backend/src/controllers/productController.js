// Mahsulot kontrolleri / Product controller
const Product = require('../models/Product');
const Review  = require('../models/Review');
const msg = require('../utils/msg');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// ─── Mahsulotlar ro'yxati / Get products ─────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const {
      category, brand, minPrice, maxPrice, colors, sizes,
      isNew, isBestseller, search, isActive,
      sort = '-createdAt', page = 1, limit = 20,
    } = req.query;

    const safeLimit = Math.min(Number(limit) || 20, 500);

    // isActive=all — faqat admin uchun, barcha mahsulotlar
    const isAdminMode = isActive === 'all' && req.user?.role === 'admin';
    const filter = isAdminMode ? {} : { isActive: true, price: { $gt: 0 } };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = filter.price || {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (colors) filter['variants.color'] = { $in: colors.split(',') };
    if (sizes) filter['variants.size'] = { $in: sizes.split(',') };
    if (isNew === 'true') filter.isNew = true;
    if (isBestseller === 'true') filter.isBestseller = true;
    if (search) filter.$text = { $search: search };

    const sortMap = {
      '-createdAt': { createdAt: -1 },
      'price_asc':  { price: 1 },
      'price_desc': { price: -1 },
      'popular':    { totalSold: -1 },
    };

    const skip = (Number(page) - 1) * safeLimit;

    // Top rated — reviewlar bo'yicha saralash (0 review bo'lsa ham ko'rinadi)
    if (sort === 'top_rated') {
      const pipeline = [
        { $match: filter },
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product', as: '_reviews' } },
        { $addFields: { avgRating: { $ifNull: [{ $avg: '$_reviews.rating' }, 0] }, reviewCount: { $size: '$_reviews' } } },
        { $sort: { avgRating: -1, reviewCount: -1, createdAt: -1 } },
      ];
      const [countResult, products] = await Promise.all([
        Product.aggregate([...pipeline, { $count: 'total' }]),
        Product.aggregate([
          ...pipeline,
          { $skip: skip },
          { $limit: safeLimit },
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
          { $lookup: { from: 'brands',    localField: 'brand',    foreignField: '_id', as: 'brand'    } },
          { $addFields: { category: { $arrayElemAt: ['$category', 0] }, brand: { $arrayElemAt: ['$brand', 0] } } },
          { $project: { _reviews: 0 } },
        ]),
      ]);
      const total = countResult[0]?.total || 0;
      return res.json({ success: true, products, pagination: { page: Number(page), limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
    }

    const sortObj = sortMap[sort] || { createdAt: -1 };
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name_ru name_ky')
        .populate('brand', 'name logo')
        .sort(sortObj)
        .skip(skip)
        .limit(safeLimit),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: Number(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Bitta mahsulot / Get single product ─────────────────────────
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name_ru name_ky')
      .populate('brand', 'name logo');

    if (!product || (!product.isActive && req.user?.role !== 'admin')) {
      return res.status(404).json({ success: false, message: msg(req, 'Товар не найден', 'Товар табылган жок') });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Mahsulot qo'shish (Admin) / Create product ──────────────────
exports.createProduct = async (req, res) => {
  try {
    const {
      name_ru, name_ky, description_ru, description_ky,
      price, category, brand, variants,
      isNew, isBestseller, isActive,
    } = req.body;

    if (!name_ru || !name_ky || !category) {
      return res.status(400).json({ success: false, message: msg(req, 'Заполните обязательные поля', 'Милдеттүү талааларды толтуруңуз') });
    }
    if (!price || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: msg(req, 'Укажите цену товара', 'Товар баасын киргизиңиз') });
    }

    const images = req.files && req.files.length > 0
      ? await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer, f.mimetype, 'hlopok/products')))
      : [];

    const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : (variants || []);

    const product = await Product.create({
      name_ru, name_ky,
      description_ru: description_ru || '',
      description_ky: description_ky || '',
      price: price ? Number(price) : 0,
      category: category || undefined,
      brand: brand || undefined,
      variants: parsedVariants,
      images,
      isActive: isActive === 'true' || isActive === true,
      isNew: isNew === 'true' || isNew === true,
      isBestseller: isBestseller === 'true' || isBestseller === true,
    });

    await product.populate(['category', 'brand']);
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('createProduct error:', error);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: msg(req, 'Ошибка данных: ' + error.message, 'Маалымат катасы') });
    }
    res.status(500).json({ success: false, message: msg(req, 'Ошибка создания товара', 'Товар кошуудо ката') });
  }
};

// ─── Mahsulot tahrirlash (Admin) / Update product ────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { name_ru, name_ky, description_ru, description_ky, category, brand,
            isNew, isBestseller, isActive, variants, price } = req.body;
    const updates = {};
    if (name_ru       !== undefined) updates.name_ru       = name_ru;
    if (name_ky       !== undefined) updates.name_ky       = name_ky;
    if (description_ru !== undefined) updates.description_ru = description_ru;
    if (description_ky !== undefined) updates.description_ky = description_ky;
    if (category      !== undefined) updates.category      = category || undefined;
    if (brand         !== undefined) updates.brand         = brand || undefined;
    if (isNew         !== undefined) updates.isNew         = isNew === 'true' || isNew === true;
    if (isBestseller  !== undefined) updates.isBestseller  = isBestseller === 'true' || isBestseller === true;
    if (isActive      !== undefined) updates.isActive      = isActive === 'true' || isActive === true;
    if (price         !== undefined) updates.price         = Number(price);
    if (variants      !== undefined) updates.variants      = typeof variants === 'string' ? JSON.parse(variants) : variants;

    if (req.files && req.files.length > 0) {
      updates.images = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer, f.mimetype, 'hlopok/products')));
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate(['category', 'brand']);

    if (!product) return res.status(404).json({ success: false, message: msg(req, 'Товар не найден', 'Товар табылган жок') });
    res.json({ success: true, product });
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления товара', 'Товарды жаңыртууда ката') });
  }
};

// ─── Mahsulot o'chirish (Admin) / Delete product ────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: msg(req, 'Товар не найден', 'Товар табылган жок') });
    res.json({ success: true, message: msg(req, 'Товар удалён', 'Товар жок кылынды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка удаления товара', 'Товарды жок кылууда ката') });
  }
};

// ─── Inventar yangilash (Admin) / Update stock + price ──────────
exports.updateStock = async (req, res) => {
  try {
    const { variants, price } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: msg(req, 'Товар не найден', 'Товар табылган жок') });

    if (Array.isArray(variants)) {
      product.variants = variants.map(({ size, color, stock }) => ({
        size, color: color || '', stock: Number(stock) || 0,
      }));
    }
    if (price !== undefined && Number(price) >= 0) {
      product.price = Number(price);
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления склада', 'Кампарды жаңыртууда ката') });
  }
};

// ─── Kam qolgan mahsulotlar (Admin) / Low stock products ─────────
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 3;
    const products = await Product.find({
      isActive: true,
      variants: { $elemMatch: { stock: { $lt: threshold, $gte: 0 } } },
    }).populate('category', 'name_ru');

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};
