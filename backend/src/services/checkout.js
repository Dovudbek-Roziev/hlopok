const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const { BonusSettings, BonusTransaction } = require('../models/Bonus');

const fail = (statusCode, ru, ky) => Object.assign(new Error(ru), { statusCode, ru, ky });

function normalizeCheckout(body = {}) {
  const { clientRequestId, contactName, contactPhone } = body;
  if (typeof clientRequestId !== 'string' || !/^[a-zA-Z0-9_-]{16,64}$/.test(clientRequestId)) {
    throw fail(400, 'Обновите приложение и повторите заказ', 'Колдонмону жаңылап, буйрутманы кайталаңыз');
  }
  if (typeof contactName !== 'string' || !contactName.trim() || contactName.length > 150 ||
      typeof contactPhone !== 'string' || !/^\+?[\d ()-]{10,24}$/.test(contactPhone) || contactPhone.replace(/\D/g, '').length < 10) {
    throw fail(400, 'Проверьте имя и номер телефона', 'Атыңызды жана телефон номерин текшериңиз');
  }
  const deliveryType = body.deliveryMethod ?? 'pickup';
  const paymentMethod = body.paymentMethod ?? 'cash';
  if (!['pickup', 'delivery'].includes(deliveryType) || !['cash', 'online'].includes(paymentMethod) ||
      (body.note != null && (typeof body.note !== 'string' || body.note.length > 100)) ||
      (body.deliveryAddress != null && (typeof body.deliveryAddress !== 'string' || body.deliveryAddress.length > 500)) ||
      (deliveryType === 'delivery' && !body.deliveryAddress?.trim())) {
    throw fail(400, 'Проверьте доставку, оплату и примечание', 'Жеткирүүнү, төлөмдү жана эскертүүнү текшериңиз');
  }
  const bonusUsed = body.bonusUsed == null || body.bonusUsed === '' ? 0 : Number(body.bonusUsed);
  if (!Number.isSafeInteger(bonusUsed) || bonusUsed < 0) throw fail(400, 'Некорректная сумма бонусов', 'Бонустун суммасы туура эмес');
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) throw fail(400, 'Проверьте корзину', 'Себетти текшериңиз');
  const grouped = new Map();
  for (const raw of body.items) {
    if (!raw || typeof raw.productId !== 'string' || !/^[a-f\d]{24}$/i.test(raw.productId) ||
        (raw.promotionId && (typeof raw.promotionId !== 'string' || !/^[a-f\d]{24}$/i.test(raw.promotionId))) ||
        typeof raw.size !== 'string' || !raw.size.trim() || raw.size.length > 30 ||
        (raw.color != null && (typeof raw.color !== 'string' || raw.color.length > 40)) ||
        !Number.isInteger(raw.qty) || raw.qty < 1 || raw.qty > 99) {
      throw fail(400, 'Проверьте товары и количество', 'Товарларды жана санын текшериңиз');
    }
    const item = { productId: raw.productId.toLowerCase(), promotionId: raw.promotionId?.toLowerCase() || '', size: raw.size.trim(), color: raw.color || '', qty: raw.qty };
    const key = JSON.stringify([item.productId, item.size, item.color, item.promotionId]);
    if (grouped.has(key)) grouped.get(key).qty += item.qty;
    else grouped.set(key, item);
    if (grouped.get(key).qty > 99) throw fail(400, 'Слишком большое количество', 'Товардын саны өтө көп');
  }
  const data = { items: [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, item]) => item), contactName: contactName.trim(), contactPhone: contactPhone.trim(), deliveryType, deliveryAddress: deliveryType === 'delivery' ? body.deliveryAddress.trim() : '', paymentMethod, note: body.note?.trim() || '', bonusUsed };
  return { ...data, clientRequestId, requestHash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex') };
}

function verifyReplay(order, data) {
  if (order.status === 'cancelled') throw fail(409, 'Предыдущий заказ отменён. Оформите новый заказ', 'Мурунку буйрутма жокко чыгарылган. Жаңысын түзүңүз');
  if (order.requestHash && order.requestHash !== data.requestHash) throw fail(409, 'Заказ изменился. Оформите его заново', 'Буйрутма өзгөрдү. Кайра түзүңүз');
  return order;
}

async function checkout(userId, body) {
  const data = normalizeCheckout(body);
  const session = await mongoose.startSession();
  let result;
  let created = false;
  try {
    await session.withTransaction(async () => {
      created = false;
      const existing = await Order.findOne({ user: userId, clientRequestId: data.clientRequestId }).session(session);
      if (existing) { result = verifyReplay(existing, data); return; }
      // Serialize checkout, account deletion and all balance-changing transactions.
      const buyer = await User.findOneAndUpdate({ _id: userId, isActive: true }, { $inc: { checkoutVersion: 1 } }, { new: true, session });
      if (!buyer) throw fail(403, 'Аккаунт недоступен', 'Аккаунт жеткиликсиз');
      const settings = await BonusSettings.findOne().session(session);
      const expiresAt = buyer.bonusExpiresAt || new Date(buyer.createdAt.getTime() + (settings?.expiryDays ?? 90) * 86400000);
      const bonusOpen = expiresAt > new Date() && !buyer.bonusExpiryProcessedAt;
      const items = [];
      let subtotal = 0;
      for (const item of data.items) {
        const product = await Product.findOne({ _id: item.productId, isActive: true }).session(session);
        const variants = product?.variants.filter(v => v.size === item.size && (v.color || '') === item.color);
        if (!product || !Number.isFinite(product.price) || product.price <= 0 || variants.length !== 1 || variants[0].stock < item.qty) throw fail(409, 'Остатки изменились. Обновите корзину', 'Калдык өзгөрдү. Себетти жаңылаңыз');
        let discount = 0;
        if (item.promotionId) {
          const now = new Date();
          const promo = await Promotion.findOne({ _id: item.promotionId, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }).session(session);
          const entries = promo?.products.filter(p => String(p.product) === item.productId);
          const entry = entries?.[0];
          if (!promo || entries.length !== 1 || !Number.isFinite(promo.discountPercent) || promo.discountPercent < 0 || promo.discountPercent > 100 || (entry.limit != null && (!Number.isInteger(entry.limit) || entry.limit < item.qty))) {
            throw fail(409, 'Акция изменилась. Обновите корзину', 'Акция өзгөрдү. Себетти жаңылаңыз');
          }
          const update = { $inc: { __v: 1 } };
          if (entry.limit != null) update.$inc['products.$[p].limit'] = -item.qty;
          const reserved = await Promotion.updateOne({ _id: promo._id, updatedAt: promo.updatedAt }, update, { session, ...(entry.limit != null ? { arrayFilters: [{ 'p.product': product._id }] } : {}) });
          if (reserved.modifiedCount !== 1) throw fail(409, 'Акция изменилась', 'Акция өзгөрдү');
          discount = promo.discountPercent;
        }
        const stock = await Product.updateOne({ _id: product._id, updatedAt: product.updatedAt, isActive: true, variants: { $elemMatch: { size: item.size, color: item.color, stock: { $gte: item.qty } } } }, { $inc: { 'variants.$[v].stock': -item.qty, totalSold: item.qty, __v: 1 } }, { session, arrayFilters: [{ 'v.size': item.size, 'v.color': item.color }] });
        if (stock.modifiedCount !== 1) throw fail(409, 'Остатки изменились', 'Калдык өзгөрдү');
        const price = discount ? Math.round(product.price * (1 - discount / 100)) : product.price;
        if (!Number.isFinite(price) || price < 0) throw fail(409, 'Цена товара недоступна', 'Товардын баасы жеткиликсиз');
        subtotal += price * item.qty;
        items.push({ product: product._id, name_ru: product.name_ru, name_ky: product.name_ky, image: product.images?.[0] || '', price, size: item.size, color: item.color, qty: item.qty, promotionId: item.promotionId || undefined });
      }
      if (data.bonusUsed > subtotal || (data.bonusUsed > 0 && (!bonusOpen || buyer.bonusBalance < data.bonusUsed))) throw fail(409, 'Недостаточно бонусов. Обновите баланс', 'Бонустар жетишсиз. Балансты жаңылаңыз');
      const total = subtotal - data.bonusUsed;
      const percent = settings?.bonusPercent ?? 5;
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw fail(503, 'Бонусная программа временно недоступна', 'Бонус программасы убактылуу жеткиликсиз');
      [result] = await Order.create([{ user: userId, clientRequestId: data.clientRequestId, requestHash: data.requestHash, items, contactName: data.contactName, contactPhone: data.contactPhone, deliveryType: data.deliveryType, deliveryAddress: data.deliveryAddress, paymentMethod: data.paymentMethod, note: data.note, subtotal, bonusUsed: data.bonusUsed, bonusEarned: bonusOpen ? Math.floor(subtotal * percent / 100) : 0, total, paymentConfirmed: total === 0 }], { session });
      if (data.bonusUsed > 0) {
        buyer.bonusBalance -= data.bonusUsed;
        buyer.totalSaved += data.bonusUsed;
        await buyer.save({ session });
        await BonusTransaction.create([{ user: userId, type: 'used', amount: data.bonusUsed, order: result._id, description_ru: `Использовано при заказе ${result.orderNumber}`, description_ky: `${result.orderNumber} буйрутмасында колдонулду` }], { session });
      }
      created = true;
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await Order.findOne({ user: userId, clientRequestId: data.clientRequestId });
      if (existing) return { order: verifyReplay(existing, data), created: false };
    }
    throw error;
  } finally { await session.endSession(); }
  return { order: result, created };
}

module.exports = { checkout, normalizeCheckout, verifyReplay, fail };
