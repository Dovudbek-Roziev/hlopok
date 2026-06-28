// Buyurtma kontrolleri / Order controller
const Order = require('../models/Order');
const Review = require('../models/Review');
const msg = require('../utils/msg');
const Product = require('../models/Product');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const { BonusTransaction, BonusSettings } = require('../models/Bonus');
const { sendOrderStatusPush } = require('../utils/pushNotification');

// Mahsulot uchun aksiya chegirmasini xavfsiz tekshirish / Securely verify a promotion discount for a product
// Mijoz yuborgan promotionId'ga ishonmaymiz — aksiyani bazadan tekshirib, faqat haqiqatan
// faol va shu mahsulotga tegishli bo'lsa chegirmani qo'llaymiz.
// We never trust the client price — we verify the promotion is active and actually
// contains this product before applying any discount.
const getVerifiedDiscountPercent = async (promotionId, productId) => {
  if (!promotionId) return 0;
  const now = new Date();
  const promo = await Promotion.findOne({
    _id: promotionId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
  if (!promo) return 0;
  const prodEntry = promo.products.find(p => p.product.toString() === productId.toString());
  if (!prodEntry) return 0;
  // limit null/undefined = cheksiz; limit 0 = tugagan
  if (prodEntry.limit !== null && prodEntry.limit !== undefined && prodEntry.limit <= 0) return 0;
  return promo.discountPercent || 0;
};

// ─── Buyurtma yaratish / Create order ────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { items, contactName, contactPhone, bonusUsed, note, deliveryMethod, deliveryAddress, paymentMethod } = req.body;

    if (!contactName || !contactName.trim()) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите ваше имя', 'Атыңызды киргизиңиз') });
    }
    if (!contactPhone || contactPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите правильный номер телефона', 'Туура телефон номерин киргизиңиз') });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: msg(req, 'Корзина пуста', 'Себет бош') });
    }

    // Narxlarni tekshirish va inventarni kamaytirish
    // Verify prices and decrement inventory
    let subtotal = 0;
    const orderItems = [];
    const decremented = []; // rollback uchun

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        // Rollback: avval kamaytirganlarni qaytarish
        for (const d of decremented) {
          await Product.updateOne(
            { _id: d.productId },
            { $inc: { 'variants.$[v].stock': d.qty, totalSold: -d.qty } },
            { arrayFilters: [{ 'v.size': d.size, 'v.color': d.color }] }
          );
        }
        return res.status(400).json({ success: false, message: msg(req, `Товар не найден: ${item.productId}`, `Товар табылган жок: ${item.productId}`) });
      }

      const itemColor = item.color || '';
      const variant = product.variants.find(v => v.size === item.size && v.color === itemColor);
      if (!variant || variant.stock < item.qty) {
        const name = req.lang === 'ky' ? product.name_ky : product.name_ru;
        // Rollback
        for (const d of decremented) {
          await Product.updateOne(
            { _id: d.productId },
            { $inc: { 'variants.$[v].stock': d.qty, totalSold: -d.qty } },
            { arrayFilters: [{ 'v.size': d.size, 'v.color': d.color }] }
          );
        }
        return res.status(400).json({
          success: false,
          message: msg(req, `"${product.name_ru}" — размер "${item.size}" нет в наличии`, `"${name}" — "${item.size}" өлчөмү жок`),
        });
      }

      // Atomik inventar kamaytirish — race condition oldini olish
      // Concurrent orders uchun stock manfiy ketmasligi uchun $elemMatch ishlatiladi
      const stockResult = await Product.updateOne(
        {
          _id: product._id,
          variants: { $elemMatch: { size: item.size, color: itemColor, stock: { $gte: item.qty } } },
        },
        {
          $inc: { 'variants.$[v].stock': -item.qty, totalSold: item.qty },
        },
        { arrayFilters: [{ 'v.size': item.size, 'v.color': itemColor }] }
      );

      if (stockResult.modifiedCount === 0) {
        const name = req.lang === 'ky' ? product.name_ky : product.name_ru;
        // Rollback
        for (const d of decremented) {
          await Product.updateOne(
            { _id: d.productId },
            { $inc: { 'variants.$[v].stock': d.qty, totalSold: -d.qty } },
            { arrayFilters: [{ 'v.size': d.size, 'v.color': d.color }] }
          );
        }
        return res.status(400).json({
          success: false,
          message: msg(req, `"${product.name_ru}" — размер "${item.size}" закончился`, `"${name}" — "${item.size}" өлчөмү бүтүп калды`),
        });
      }
      decremented.push({ productId: product._id, size: item.size, color: itemColor, qty: item.qty });

      // Aksiya limitini kamaytirish (faqat limit belgilangan bo'lsa)
      // Decrement promotion limit only if limit is set (not null/unlimited)
      if (item.promotionId) {
        await Promotion.updateOne(
          { _id: item.promotionId, 'products.product': product._id, 'products.limit': { $gt: 0 } },
          { $inc: { 'products.$.limit': -item.qty } }
        );
      }

      // Aksiya chegirmasini xavfsiz tekshirish va narxni hisoblash
      // Verify the promotion server-side and compute the real price
      const discountPercent = await getVerifiedDiscountPercent(item.promotionId, product._id);
      const itemPrice = discountPercent > 0
        ? Math.round(product.price * (1 - discountPercent / 100))
        : product.price;

      subtotal += itemPrice * item.qty;
      orderItems.push({
        product: product._id,
        name_ru: product.name_ru,
        name_ky: product.name_ky,
        image: product.images?.[0] || '',
        price: itemPrice,
        size: item.size,
        color: item.color || '',
        qty: item.qty,
        promotionId: item.promotionId || undefined,
      });
    }

    // Bonus tekshirish / Check bonus
    const usedBonus = Math.max(0, Number(bonusUsed) || 0);
    if (usedBonus > 0) {
      const user = await User.findById(req.user._id);
      if (!user || user.bonusBalance < usedBonus) {
        return res.status(400).json({ success: false, message: msg(req, 'Недостаточно бонусов', 'Бонустар жетишсиз') });
      }
    }

    const total = Math.max(0, subtotal - usedBonus);

    // Bonus sozlamalari / Bonus settings
    const settings = await BonusSettings.findOne() || { bonusPercent: 5, expiryDays: 90 };
    // Bonus to'liq summadan (subtotal) hisoblanadi, bonus chegirmasi hisobga olinmaydi
    const bonusEarned = Math.floor(subtotal * settings.bonusPercent / 100);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      deliveryType: deliveryMethod === 'delivery' ? 'delivery' : 'pickup',
      contactName,
      contactPhone,
      deliveryAddress: deliveryMethod === 'delivery' ? (deliveryAddress || '') : '',
      paymentMethod: paymentMethod === 'online' ? 'online' : 'cash',
      paymentConfirmed: paymentMethod !== 'online',
      subtotal,
      bonusUsed: usedBonus,
      bonusEarned,
      total,
      note: note || '',
    });

    // Bonus balansini yangilash — atomik: manfiy ketmasligi uchun $gte tekshirish
    if (usedBonus > 0) {
      const bonusResult = await User.updateOne(
        { _id: req.user._id, bonusBalance: { $gte: usedBonus } },
        { $inc: { bonusBalance: -usedBonus, totalSaved: usedBonus } }
      );
      if (bonusResult.modifiedCount === 0) {
        await Order.findByIdAndDelete(order._id);
        // Restore all decremented stock (bonus check failed after inventory was already decremented)
        for (const d of decremented) {
          await Product.updateOne(
            { _id: d.productId },
            { $inc: { 'variants.$[v].stock': d.qty, totalSold: -d.qty } },
            { arrayFilters: [{ 'v.size': d.size, 'v.color': d.color }] }
          );
        }
        return res.status(400).json({ success: false, message: msg(req, 'Недостаточно бонусов', 'Бонустар жетишсиз') });
      }
      await BonusTransaction.create({
        user: req.user._id, type: 'used', amount: usedBonus, order: order._id,
        description_ru: `Использовано при заказе ${order.orderNumber}`,
        description_ky: `${order.orderNumber} буйрутмасында колдонулду`,
      });
    }

    // Admin ga Socket.io orqali xabar / Notify admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('new_order', {
        _id: order._id,
        orderNumber: order.orderNumber,
        contactName,
        total,
        createdAt: order.createdAt,
      });
    }

    await order.populate('user', 'email firstName lastName');
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка создания заказа', 'Буйрутма кошуудо ката') });
  }
};

// ─── Mening buyurtmalarim / My orders ────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Bitta buyurtma / Single order ───────────────────────────────
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: msg(req, 'Заказ не найден', 'Буйрутма табылган жок') });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Admin: Barcha buyurtmalar / Admin: All orders ────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 500);
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { orderNumber:  { $regex: safe, $options: 'i' } },
        { contactPhone: { $regex: safe } },
        { contactName:  { $regex: safe, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * safeLimit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true, orders,
      pagination: { page: Number(page), limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Admin: Holat o'zgartirish / Admin: Update status ────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, comment, cancelReason } = req.body;

    const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'cancelled'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: msg(req, 'Неверный статус', 'Статус туура эмес') });
    }

    const order = await Order.findById(req.params.id).populate('user');
    if (!order) return res.status(404).json({ success: false, message: msg(req, 'Заказ не найден', 'Буйрутма табылган жок') });

    const prevStatus = order.status;
    if (prevStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: msg(req, 'Заказ уже отменён', 'Буйрутма мурунтан жокко чыгарылган') });
    }

    // Only forward transitions allowed (except cancelled which is always terminal)
    const TRANSITIONS = {
      pending:    ['confirmed', 'cancelled'],
      confirmed:  ['preparing', 'cancelled'],
      preparing:  ['ready', 'cancelled'],
      ready:      ['cancelled'],
    };
    if (status !== prevStatus && !(TRANSITIONS[prevStatus] || []).includes(status)) {
      return res.status(400).json({ success: false, message: msg(req, `Нельзя перевести из "${prevStatus}" в "${status}"`, `"${prevStatus}" дан "${status}" га өткөрүүгө болбойт`) });
    }

    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date(), comment: comment || '' });
    if (status === 'cancelled' && cancelReason) order.cancelReason = cancelReason;

    // ── Cancel: stock qaytarish + bonus qaytarish ──
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      // Stock qaytarish — $elemMatch + arrayFilters: to'g'ri variantni topish uchun
      for (const item of order.items) {
        const itemColor = item.color ?? '';
        await Product.updateOne(
          { _id: item.product, variants: { $elemMatch: { size: item.size, color: itemColor } } },
          { $inc: { 'variants.$[v].stock': item.qty, totalSold: -item.qty } },
          { arrayFilters: [{ 'v.size': item.size, 'v.color': itemColor }] }
        );
        // Aksiya limitini qaytarish (faqat limit belgilangan bo'lsa)
        if (item.promotionId) {
          await Promotion.updateOne(
            { _id: item.promotionId, 'products.product': item.product, 'products.limit': { $ne: null } },
            { $inc: { 'products.$.limit': item.qty } }
          );
        }
      }

      // Bonus qaytarish: bonusUsed + agar ready bo'lgan bo'lsa bonusEarned ham qaytarib olish
      const earnedTx = await BonusTransaction.findOne({ order: order._id, type: 'earned' });

      if (order.bonusUsed > 0 || earnedTx) {
        const user = await User.findById(order.user._id);

        if (order.bonusUsed > 0) {
          user.bonusBalance += order.bonusUsed;
          user.totalSaved = Math.max(0, user.totalSaved - order.bonusUsed);
          await BonusTransaction.create({
            user: user._id, type: 'refund', amount: order.bonusUsed, order: order._id,
            description_ru: `Возврат бонусов за отменённый заказ ${order.orderNumber}`,
            description_ky: `${order.orderNumber} жокко чыгарылган буйрутма үчүн бонус кайтарылды`,
          });
        }

        if (earnedTx) {
          user.bonusBalance = Math.max(0, user.bonusBalance - earnedTx.amount);
          await BonusTransaction.create({
            user: user._id, type: 'expired', amount: earnedTx.amount, order: order._id,
            description_ru: `Начисленные бонусы отменены (заказ ${order.orderNumber} отменён)`,
            description_ky: `${order.orderNumber} буйрутмасы жокко чыгарылгандыктан бонус алынды`,
          });
        }

        await user.save();
      }
    }

    // ── Ready: bonusEarned beriladi (faqat bir marta) ──
    if (status === 'ready' && prevStatus !== 'ready' && order.bonusEarned > 0) {
      const alreadyGranted = await BonusTransaction.findOne({ order: order._id, type: 'earned' });
      if (!alreadyGranted) {
        const user = await User.findById(order.user._id);
        const settings = await BonusSettings.findOne() || { expiryDays: 90 };
        const expiresAt = new Date(Date.now() + settings.expiryDays * 24 * 60 * 60 * 1000);
        user.bonusBalance += order.bonusEarned;
        await user.save();
        await BonusTransaction.create({
          user: user._id, type: 'earned', amount: order.bonusEarned, order: order._id, expiresAt,
          description_ru: `Бонус за заказ ${order.orderNumber}`,
          description_ky: `${order.orderNumber} буйрутмасы үчүн бонус`,
        });
      }
    }

    await order.save();

    // Socket.io + Push notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.user._id}`).emit('order_status_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status,
        comment: comment || '',
      });
    }

    const orderUser = await User.findById(order.user._id).select('pushToken language');
    if (orderUser?.pushToken) {
      await sendOrderStatusPush({
        pushToken:   orderUser.pushToken,
        userLang:    orderUser.language || 'ru',
        status,
        orderNumber: order.orderNumber,
        orderId:     order._id.toString(),
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления статуса', 'Статусту жаңыртууда ката') });
  }
};

// ─── Foydalanuvchi: o'z buyurtmasini bekor qilish ────────────────
exports.cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: msg(req, 'Заказ не найден', 'Буйрутма табылган жок') });
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: msg(req, 'Можно отменить только новый заказ', 'Жаңы буйрутманы гана жокко чыгарса болот') });
    }

    // Stock + aksiya limitini qaytarish
    for (const item of order.items) {
      const itemColor = item.color ?? '';
      await Product.updateOne(
        { _id: item.product, variants: { $elemMatch: { size: item.size, color: itemColor } } },
        { $inc: { 'variants.$[v].stock': item.qty, totalSold: -item.qty } },
        { arrayFilters: [{ 'v.size': item.size, 'v.color': itemColor }] }
      );
      if (item.promotionId) {
        await Promotion.updateOne(
          { _id: item.promotionId, 'products.product': item.product, 'products.limit': { $ne: null } },
          { $inc: { 'products.$.limit': item.qty } }
        );
      }
    }

    // bonusUsed qaytarish
    if (order.bonusUsed > 0) {
      const user = await User.findById(req.user._id);
      user.bonusBalance += order.bonusUsed;
      user.totalSaved = Math.max(0, user.totalSaved - order.bonusUsed);
      await user.save();
      await BonusTransaction.create({
        user: user._id, type: 'refund', amount: order.bonusUsed, order: order._id,
        description_ru: `Возврат бонусов за отменённый заказ ${order.orderNumber}`,
        description_ky: `${order.orderNumber} жокко чыгарылган буйрутма үчүн бонус кайтарылды`,
      });
    }

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || '';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), comment: req.body.reason || '' });
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('cancelMyOrder error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка отмены заказа', 'Буйрутманы жокко чыгарууда ката') });
  }
};

// ─── Foydalanuvchi: baholanmagan tayyor buyurtmalar ──────────────
exports.getPendingRatings = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, status: 'ready' })
      .select('orderNumber items')
      .lean();

    // Barcha noyob mahsulot IDlarini yig'amiz
    const allProductIds = [];
    const seenForBatch = new Set();
    for (const order of orders) {
      for (const item of order.items) {
        const pid = item.product.toString();
        if (!seenForBatch.has(pid)) {
          seenForBatch.add(pid);
          allProductIds.push(item.product);
        }
      }
    }

    // Barcha baholangan mahsulotlarni BITTA so'rovda olamiz (N+1 yo'q)
    const reviewedDocs = await Review.find({
      user: req.user._id,
      product: { $in: allProductIds },
    }).select('product').lean();
    const reviewedSet = new Set(reviewedDocs.map(r => r.product.toString()));

    const seenProducts = new Set();
    const pending = [];
    for (const order of orders) {
      for (const item of order.items) {
        const pid = item.product.toString();
        if (seenProducts.has(pid) || reviewedSet.has(pid)) continue;
        seenProducts.add(pid);
        pending.push({
          orderId:     order._id,
          orderNumber: order.orderNumber,
          productId:   item.product,
          name_ru:     item.name_ru,
          name_ky:     item.name_ky || item.name_ru,
          image:       item.image || null,
          size:        item.size,
        });
      }
    }

    res.json({ success: true, pending });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};

// ─── Admin: Onlayn to'lovni tasdiqlash / Confirm online payment ───
exports.confirmPayment = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentConfirmed: true },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: msg(req, 'Заказ не найден', 'Буйрутма табылган жок') });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Admin: Barcha test ma'lumotlarni tozalash ────────────────────
exports.clearOrders = async (req, res) => {
  try {
    await Order.deleteMany({});
    res.json({ success: true, message: msg(req, 'Все заказы удалены', 'Бардык буйрутмалар өчүрүлдү') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.clearAllStats = async (req, res) => {
  try {
    await Order.deleteMany({});
    await BonusTransaction.deleteMany({});

    // Barcha foydalanuvchilar bonusini nolga tushirish
    await User.updateMany({}, { bonusBalance: 0, totalSaved: 0 });

    res.json({ success: true, message: msg(req, 'Вся статистика очищена', 'Бардык статистика тазаланды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};


// ─── Admin: Dashboard statistika / Admin: Dashboard stats ─────────
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayOrders,
      todayRevenue,
      totalOrders,
      pendingOrders,
      thisMonthData,
      lastMonthData,
      topProducts,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonthStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.find({ isActive: true })
        .sort({ totalSold: -1 })
        .limit(5)
        .select('name_ru name_ky images totalSold price'),
    ]);

    // Haftalik buyurtmalar / Weekly orders
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = await Order.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 6 oylik daromad / Last 6 months revenue
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const [monthlyData, statusCounts] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const thisMonth = thisMonthData[0]?.total || 0;
    const lastMonth = lastMonthData[0]?.total || 0;
    const monthGrowth = lastMonth === 0
      ? (thisMonth > 0 ? 100 : 0)
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

    res.json({
      success: true,
      stats: {
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        totalOrders,
        pendingOrders,
        weeklyData,
        thisMonthRevenue: thisMonth,
        lastMonthRevenue: lastMonth,
        monthGrowth,
        topProducts,
        monthlyData,
        statusCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};
