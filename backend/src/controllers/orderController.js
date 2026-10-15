// Buyurtma kontrolleri / Order controller
const Order = require('../models/Order');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const msg = require('../utils/msg');
const Product = require('../models/Product');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const { BonusTransaction, BonusSettings } = require('../models/Bonus');
const { sendOrderStatusPush } = require('../utils/pushNotification');
const { grantReadyOrderBonus, cancelOrderAndRestore } = require('../services/orderLifecycle');
const { checkout } = require('../services/checkout');

exports.createOrder = async (req, res) => {
  try {
    const { order, created } = await checkout(req.user._id, req.body);
    if (created) req.app.get('io')?.to('admin').emit('new_order', {
      _id: order._id, orderNumber: order.orderNumber, contactName: order.contactName,
      total: order.total, createdAt: order.createdAt,
    });
    return res.status(created ? 201 : 200).json({ success: true, order });
  } catch (error) {
    console.error('createOrder error:', error.name, error.code);
    return res.status(error.statusCode || 500).json({ success: false,
      message: msg(req, error.ru || 'Не удалось создать заказ. Повторите запрос', error.ky || 'Буйрутма түзүлгөн жок. Кайра аракет кылыңыз') });
  }
};

// ─── Mening buyurtmalarim / My orders ────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const page = Math.max(1, Math.min(100000, Math.floor(Number(req.query.page)) || 1));
    const limit = 30;
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);
    res.json({ success: true, orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
    const safeLimit = Math.max(1, Math.min(Math.floor(Number(limit)) || 20, 500));
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

    const skip = (Math.max(1, Math.min(100000, Math.floor(Number(page)) || 1)) - 1) * safeLimit;
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
      pagination: { page: Math.max(1, Math.min(100000, Math.floor(Number(page)) || 1)), limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Admin: Holat o'zgartirish / Admin: Update status ────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, comment, cancelReason } = req.body;
    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['cancelled'],
    };
    if (!['pending', 'confirmed', 'preparing', 'ready', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: msg(req, 'Неверный статус', 'Статус туура эмес') });
    }

    const current = await Order.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: msg(req, 'Заказ не найден', 'Буйрутма табылган жок') });
    if (current.status === 'cancelled') {
      return res.status(400).json({ success: false, message: msg(req, 'Заказ уже отменён', 'Буйрутма мурунтан жокко чыгарылган') });
    }
    if (status !== current.status && !transitions[current.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: msg(req, 'Недопустимый переход статуса', 'Статусту мындай өзгөртүүгө болбойт') });
    }

    if (status === current.status) {
      if (status === 'ready') await grantReadyOrderBonus(current._id);
      const order = await Order.findById(current._id).populate('user');
      return res.json({ success: true, order });
    }

    let order;
    if (status === 'cancelled') {
      await cancelOrderAndRestore({
        orderId: current._id,
        expectedStatus: current.status,
        reason: cancelReason || '',
        comment: comment || '',
      });
      order = await Order.findById(current._id).populate('user');
    } else {
      const result = await Order.updateOne(
        { _id: current._id, status: current.status },
        { $set: { status }, $push: { statusHistory: { status, timestamp: new Date(), comment: comment || '' } } }
      );
      if (result.modifiedCount !== 1) {
        return res.status(409).json({ success: false, message: msg(req, 'Заказ уже изменён', 'Буйрутма өзгөртүлгөн') });
      }
      if (status === 'ready') await grantReadyOrderBonus(current._id);
      order = await Order.findById(current._id).populate('user');
    }

    const io = req.app.get('io');
    io?.to(`user_${current.user}`).emit('order_status_updated', {
      orderId: current._id,
      orderNumber: current.orderNumber,
      status,
      comment: comment || '',
    });

    const orderUser = await User.findById(current.user).select('pushToken pushTokens language');
    const tokens = [...new Set([...(orderUser?.pushTokens || []), orderUser?.pushToken].filter(Boolean))];
    if (tokens.length) {
      void sendOrderStatusPush({
        pushToken: tokens,
        userLang: orderUser.language || 'ru',
        status,
        orderNumber: current.orderNumber,
        orderId: current._id.toString(),
      }).catch(error => console.error('Order notification failed:', error.name));
    }
    res.json({ success: true, order });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: msg(req, error.ru || 'Заказ уже изменён', error.ky || 'Буйрутма өзгөртүлгөн') });
    }
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления заказа', 'Буйрутманы өзгөртүүдө ката') });
  }
};

// ─── Foydalanuvchi: o'z buyurtmasini bekor qilish ────────────────
exports.cancelMyOrder = async (req, res) => {
  try {
    const current = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!current) return res.status(404).json({ success: false, message: msg(req, 'Заказ не найден', 'Буйрутма табылган жок') });
    if (current.status !== 'pending') {
      return res.status(400).json({ success: false, message: msg(req, 'Можно отменить только новый заказ', 'Жаңы буйрутманы гана жокко чыгарса болот') });
    }
    const order = await cancelOrderAndRestore({
      orderId: current._id,
      expectedStatus: 'pending',
      userId: req.user._id,
      reason: req.body?.reason || '',
      comment: req.body?.reason || '',
    });
    req.app.get('io')?.to('admin').emit('order_status_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: 'cancelled',
    });
    res.json({ success: true, order });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: msg(req, error.ru || 'Заказ уже изменён', error.ky || 'Буйрутма өзгөртүлгөн') });
    }
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
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'cancelled' } },
      { $set: { paymentConfirmed: true } },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: msg(req, 'Заказ не найден', 'Буйрутма табылган жок') });
    await grantReadyOrderBonus(order._id);
    res.json({ success: true, order });
  } catch (error) {
    console.error('confirmPayment error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка подтверждения оплаты', 'Төлөмдү ырастоодо ката') });
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
    // Stock qaytarish: bekor qilinmagan buyurtmalardan sotilgan miqdorni qaytaramiz
    const activeOrders = await Order.find({ status: { $ne: 'cancelled' } });
    for (const order of activeOrders) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'variants.size': item.size, 'variants.color': item.color ?? '' },
          { $inc: { 'variants.$[v].stock': item.qty, totalSold: -item.qty } },
          { arrayFilters: [{ 'v.size': item.size, 'v.color': item.color ?? '' }] }
        );
      }
    }

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
    const localNow = new Date(Date.now() + 6 * 3600000);
    const year = localNow.getUTCFullYear(), month = localNow.getUTCMonth(), day = localNow.getUTCDate();
    const today = new Date(Date.UTC(year, month, day) - 6 * 3600000);
    const tomorrow = new Date(+today + 86400000);

    const thisMonthStart = new Date(Date.UTC(year, month, 1) - 6 * 3600000);
    const lastMonthStart = new Date(Date.UTC(year, month - 1, 1) - 6 * 3600000);
    const lastMonthEnd   = new Date(Date.UTC(year, month, 1) - 6 * 3600000);

    const [
      todayOrders,
      todayRevenue,
      totalOrders,
      cancelledCount,
      pendingOrders,
      thisMonthData,
      lastMonthData,
      topProducts,
      bonusIssuedData,
      bonusUsedData,
      newUsersThisMonth,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' }, paymentConfirmed: true } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: { $ne: 'cancelled' } }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonthStart }, status: { $ne: 'cancelled' }, paymentConfirmed: true } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }, status: { $ne: 'cancelled' }, paymentConfirmed: true } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, paymentConfirmed: true } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.qty' } } },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $match: { 'product.isActive': true } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        { $project: {
          _id: '$product._id',
          name_ru: '$product.name_ru',
          name_ky: '$product.name_ky',
          images: '$product.images',
          price: '$product.price',
          totalSold: 1,
        } },
      ]),
      BonusTransaction.aggregate([
        { $match: { type: { $in: ['earned', 'admin_add'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      BonusTransaction.aggregate([
        { $match: { type: { $in: ['used', 'refund'] } } },
        { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$type', 'used'] }, '$amount', { $multiply: ['$amount', -1] }] } } } },
      ]),
      User.countDocuments({ createdAt: { $gte: thisMonthStart }, role: { $ne: 'admin' } }),
    ]);

    // Haftalik buyurtmalar / Weekly orders
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = await Order.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: { $ne: 'cancelled' }, paymentConfirmed: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Bishkek' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 6 oylik daromad / Last 6 months revenue
    const sixMonthsAgo = new Date(Date.UTC(year, month - 5, 1) - 6 * 3600000);
    const [monthlyData, statusCounts] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' }, paymentConfirmed: true } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Bishkek' } },
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

    const thisMonth    = thisMonthData[0]?.total || 0;
    const lastMonth    = lastMonthData[0]?.total || 0;
    const monthGrowth  = lastMonth === 0
      ? (thisMonth > 0 ? 100 : 0)
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

    const totalAll   = totalOrders + cancelledCount;
    const cancelRate = totalAll === 0 ? 0 : Math.round((cancelledCount / totalAll) * 100);

    // Jami daromad (barcha vaqt uchun o'rtacha chek) / All-time revenue for avg order value
    const allTimeRevenueData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, paymentConfirmed: true } },
      { $group: { _id: null, total: { $sum: '$total' }, orderCount: { $sum: 1 } } },
    ]);
    const paidOrderCount = allTimeRevenueData[0]?.orderCount || 0;
    const avgOrder = paidOrderCount === 0 ? 0 : Math.round(allTimeRevenueData[0].total / paidOrderCount);

    res.json({
      success: true,
      stats: {
        todayOrders,
        todayRevenue:    todayRevenue[0]?.total || 0,
        totalOrders,
        cancelledCount,
        cancelRate,
        pendingOrders,
        weeklyData,
        thisMonthRevenue: thisMonth,
        lastMonthRevenue: lastMonth,
        monthGrowth,
        topProducts,
        monthlyData,
        statusCounts,
        bonusIssued:     bonusIssuedData[0]?.total || 0,
        bonusUsed:       bonusUsedData[0]?.total   || 0,
        avgOrder,
        newUsersThisMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};
