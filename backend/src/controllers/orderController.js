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
const MAX_ORDER_ITEMS = 50;
const MAX_ITEM_QTY = 99;


const rollbackOrderSideEffects = async ({ decremented = [], promoDecremented = [] }) => {
  let rollbackError;
  const pendingStock = [];
  for (const d of decremented) {
    try {
      const result = await Product.updateOne(
        { _id: d.productId },
        { $inc: { 'variants.$[v].stock': d.qty, totalSold: -d.qty } },
        { arrayFilters: [{ 'v.size': d.size, 'v.color': d.color }] }
      );
      if (result.modifiedCount === 0) {
        pendingStock.push(d);
        rollbackError ||= new Error('Stock rollback did not match a product variant');
      }
    } catch (error) {
      pendingStock.push(d);
      rollbackError ||= error;
    }
  }
  decremented.splice(0, decremented.length, ...pendingStock);
  const pendingPromotions = [];
  for (const p of promoDecremented) {
    try {
      const result = await Promotion.updateOne(
        { _id: p.promotionId, 'products.product': p.productId },
        { $inc: { 'products.$.limit': p.qty } }
      );
      if (result.modifiedCount === 0) {
        pendingPromotions.push(p);
        rollbackError ||= new Error('Promotion rollback did not match a product');
      }
    } catch (error) {
      pendingPromotions.push(p);
      rollbackError ||= error;
    }
  }
  promoDecremented.splice(0, promoDecremented.length, ...pendingPromotions);
  if (rollbackError) throw rollbackError;
};

const normalizeOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'empty' };
  }
  if (items.length > MAX_ORDER_ITEMS) {
    return { error: 'too_many' };
  }

  const byKey = new Map();
  for (const raw of items) {
    const productId = String(raw?.productId || '').trim();
    const promotionId = raw?.promotionId ? String(raw.promotionId).trim() : '';
    const size = String(raw?.size || '').trim();
    const color = String(raw?.color || '').trim();
    const qty = Number(raw?.qty);

    if (!mongoose.Types.ObjectId.isValid(productId)) return { error: 'bad_item' };
    if (promotionId && !mongoose.Types.ObjectId.isValid(promotionId)) return { error: 'bad_item' };
    if (!size || size.length > 30 || color.length > 40) return { error: 'bad_item' };
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QTY) return { error: 'bad_qty' };

    const key = `${productId}:${size}:${color}:${promotionId}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.qty += qty;
      if (existing.qty > MAX_ITEM_QTY) return { error: 'bad_qty' };
    } else {
      byKey.set(key, { productId, size, color, qty, promotionId: promotionId || undefined });
    }
  }

  return { items: [...byKey.values()] };
};

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
  const decremented = [];
  const promoDecremented = [];
  let createdOrderId;
  let bonusDebitApplied = 0;
  let sideEffectsCommitted = false;
  const clientRequestId = req.body?.clientRequestId;
  try {
    const { items, contactName, contactPhone, bonusUsed, note, deliveryMethod, deliveryAddress, paymentMethod } = req.body;

    if (typeof clientRequestId !== 'string' || !/^[a-zA-Z0-9_-]{16,64}$/.test(clientRequestId)) {
      return res.status(400).json({ success: false, message: msg(req, 'Некорректный запрос заказа', 'Буйрутма сурамы туура эмес') });
    }
    const existingOrder = await Order.findOne({ user: req.user._id, clientRequestId });
    if (existingOrder) return res.json({ success: true, order: existingOrder });

    if (!contactName || !contactName.trim()) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите ваше имя', 'Атыңызды киргизиңиз') });
    }
    if (!contactPhone || contactPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите правильный номер телефона', 'Туура телефон номерин киргизиңиз') });
    }
    const normalized = normalizeOrderItems(items);
    if (normalized.error === 'empty') {
      return res.status(400).json({ success: false, message: msg(req, 'Корзина пуста', 'Себет бош') });
    }
    if (normalized.error) {
      return res.status(400).json({ success: false, message: msg(req, 'Проверьте товары и количество', 'Товарларды жана санын текшериңиз') });
    }

    // Narxlarni tekshirish va inventarni kamaytirish
    // Verify prices and decrement inventory
    let subtotal = 0;
    const orderItems = [];

    for (const item of normalized.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        // Rollback: avval kamaytirganlarni qaytarish
        await rollbackOrderSideEffects({ decremented, promoDecremented });
        return res.status(400).json({ success: false, message: msg(req, `Товар не найден: ${item.productId}`, `Товар табылган жок: ${item.productId}`) });
      }

      const itemColor = item.color || '';
      const variant = product.variants.find(v => v.size === item.size && v.color === itemColor);
      if (!variant || variant.stock < item.qty) {
        const name = req.lang === 'ky' ? product.name_ky : product.name_ru;
        // Rollback
        await rollbackOrderSideEffects({ decremented, promoDecremented });
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
        await rollbackOrderSideEffects({ decremented, promoDecremented });
        return res.status(400).json({
          success: false,
          message: msg(req, `"${product.name_ru}" — размер "${item.size}" закончился`, `"${name}" — "${item.size}" өлчөмү бүтүп калды`),
        });
      }
      decremented.push({ productId: product._id, size: item.size, color: itemColor, qty: item.qty });

      // Aksiya chegirmasini xavfsiz tekshirish va narxni hisoblash
      // Verify the promotion server-side and compute the real price
      const discountPercent = await getVerifiedDiscountPercent(item.promotionId, product._id);
      if (discountPercent > 0 && item.promotionId) {
        const now = new Date();
        const promoLimitResult = await Promotion.updateOne(
          {
            _id: item.promotionId,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            products: { $elemMatch: { product: product._id, limit: { $ne: null, $gte: item.qty } } },
          },
          { $inc: { 'products.$.limit': -item.qty } }
        );

        if (promoLimitResult.modifiedCount > 0) {
          promoDecremented.push({ promotionId: item.promotionId, productId: product._id, qty: item.qty });
        } else {
          const unlimitedPromo = await Promotion.exists({
            _id: item.promotionId,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            products: { $elemMatch: { product: product._id, limit: null } },
          });
          if (!unlimitedPromo) {
            await rollbackOrderSideEffects({ decremented, promoDecremented });
            return res.status(400).json({ success: false, message: msg(req, 'Лимит акции закончился', 'Акциянын лимити бүттү') });
          }
        }
      }
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
        promotionId: discountPercent > 0 ? item.promotionId : undefined,
      });
    }

    // Bonus tekshirish / Check bonus
    const rawBonus = bonusUsed === undefined || bonusUsed === null || bonusUsed === '' ? 0 : Number(bonusUsed);
    if (!Number.isFinite(rawBonus) || rawBonus < 0 || !Number.isInteger(rawBonus)) {
      await rollbackOrderSideEffects({ decremented, promoDecremented });
      return res.status(400).json({ success: false, message: msg(req, 'Проверьте сумму бонусов', 'Бонустардын суммасын текшериңиз') });
    }
    const usedBonus = rawBonus;
    if (usedBonus > subtotal) {
      await rollbackOrderSideEffects({ decremented, promoDecremented });
      return res.status(400).json({ success: false, message: msg(req, 'Бонусы не могут быть больше суммы заказа', 'Бонустар буйрутманын суммасынан көп болбошу керек') });
    }
    const settings = await BonusSettings.findOne() || { bonusPercent: 5, expiryDays: 90 };
    const buyer = await User.findById(req.user._id);
    const bonusExpiresAt = buyer?.bonusExpiresAt || (buyer?.createdAt
      ? new Date(buyer.createdAt.getTime() + settings.expiryDays * 24 * 60 * 60 * 1000)
      : null);
    const bonusWindowOpen = !!bonusExpiresAt && bonusExpiresAt > new Date();
    if (usedBonus > 0) {
      if (!buyer || !bonusWindowOpen || buyer.bonusBalance < usedBonus) {
        await rollbackOrderSideEffects({ decremented, promoDecremented });
        return res.status(400).json({ success: false, message: msg(req, 'Недостаточно бонусов', 'Бонустар жетишсиз') });
      }
    }

    const total = Math.max(0, subtotal - usedBonus);

    // Bonus sozlamalari / Bonus settings
    // Bonus to'liq summadan (subtotal) hisoblanadi, bonus chegirmasi hisobga olinmaydi
    const bonusEarned = bonusWindowOpen ? Math.floor(subtotal * settings.bonusPercent / 100) : 0;

    const order = await Order.create({
      user: req.user._id,
      clientRequestId,
      items: orderItems,
      deliveryType: deliveryMethod === 'delivery' ? 'delivery' : 'pickup',
      contactName,
      contactPhone,
      deliveryAddress: deliveryMethod === 'delivery' ? (deliveryAddress || '') : '',
      paymentMethod: paymentMethod === 'online' ? 'online' : 'cash',
      paymentConfirmed: false,
      subtotal,
      bonusUsed: usedBonus,
      bonusEarned,
      total,
      note: note || '',
    });
    createdOrderId = order._id;

    // Bonus balansini yangilash — atomik: manfiy ketmasligi uchun $gte tekshirish
    if (usedBonus > 0) {
      const bonusResult = await User.updateOne(
        { _id: req.user._id, bonusBalance: { $gte: usedBonus } },
        { $inc: { bonusBalance: -usedBonus, totalSaved: usedBonus } }
      );
      if (bonusResult.modifiedCount === 0) {
        await Order.findByIdAndDelete(order._id);
        // Restore all decremented stock (bonus check failed after inventory was already decremented)
        await rollbackOrderSideEffects({ decremented, promoDecremented });
        return res.status(400).json({ success: false, message: msg(req, 'Недостаточно бонусов', 'Бонустар жетишсиз') });
      }
      bonusDebitApplied = usedBonus;
      await BonusTransaction.create({
        user: req.user._id, type: 'used', amount: usedBonus, order: order._id,
        description_ru: `Использовано при заказе ${order.orderNumber}`,
        description_ky: `${order.orderNumber} буйрутмасында колдонулду`,
      });
    }

    sideEffectsCommitted = true;

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
    if (!sideEffectsCommitted) {
      const rollbackErrors = [];
      const attemptRollback = async action => {
        try { await action(); } catch (rollbackError) { rollbackErrors.push(rollbackError); }
      };
      if (bonusDebitApplied > 0) {
        await attemptRollback(async () =>
          await User.updateOne(
            { _id: req.user._id },
            { $inc: { bonusBalance: bonusDebitApplied, totalSaved: -bonusDebitApplied } }
          )
        );
      }
      if (createdOrderId) {
        await attemptRollback(() => BonusTransaction.deleteMany({ order: createdOrderId }));
        await attemptRollback(() => Order.findByIdAndDelete(createdOrderId));
      }
      await attemptRollback(() => rollbackOrderSideEffects({ decremented, promoDecremented }));
      if (rollbackErrors.length) {
        console.error('createOrder rollback failed:', rollbackErrors[0].name, rollbackErrors[0].code);
      }
    }
    if (error.code === 11000 && clientRequestId) {
      const existingOrder = await Order.findOne({ user: req.user._id, clientRequestId });
      if (existingOrder) return res.json({ success: true, order: existingOrder });
    }
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
      await sendOrderStatusPush({
        pushToken: tokens,
        userLang: orderUser.language || 'ru',
        status,
        orderNumber: current.orderNumber,
        orderId: current._id.toString(),
      });
    }
    res.json({ success: true, order });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: msg(req, 'Заказ уже изменён', 'Буйрутма өзгөртүлгөн') });
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
      return res.status(409).json({ success: false, message: msg(req, 'Заказ уже изменён', 'Буйрутма өзгөртүлгөн') });
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
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' }, paymentConfirmed: true } },
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
