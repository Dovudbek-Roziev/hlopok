const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const { BonusTransaction, BonusSettings } = require('../models/Bonus');

const conflict = () => Object.assign(new Error('Order changed'), { statusCode: 409 });

async function grantReadyOrderBonus(orderId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order || order.status !== 'ready' || !order.paymentConfirmed || order.bonusEarned <= 0 || order.bonusEarnedAt) return;

      const existing = await BonusTransaction.findOne({ order: order._id, type: 'earned' }).session(session);
      if (existing) {
        await Order.updateOne({ _id: order._id, bonusEarnedAt: null }, { $set: { bonusEarnedAt: existing.createdAt || new Date() } }, { session });
        return;
      }

      const user = await User.findById(order.user).session(session);
      if (!user || user.bonusExpiryProcessedAt) return;
      const settings = await BonusSettings.findOne().session(session);
      const expiresAt = user.bonusExpiresAt || new Date(user.createdAt.getTime() + (settings?.expiryDays ?? 90) * 86400000);
      if (expiresAt <= new Date()) return;

      const claimed = await Order.updateOne(
        { _id: order._id, status: 'ready', paymentConfirmed: true, bonusEarnedAt: null },
        { $set: { bonusEarnedAt: new Date() } }, { session }
      );
      if (claimed.modifiedCount !== 1) return;

      user.bonusBalance += order.bonusEarned;
      await user.save({ session });
      await BonusTransaction.create([{
        user: user._id, type: 'earned', amount: order.bonusEarned, order: order._id, expiresAt,
        description_ru: `Бонус за заказ ${order.orderNumber}`,
        description_ky: `${order.orderNumber} буйрутмасы үчүн бонус`,
      }], { session });
    });
  } finally {
    await session.endSession();
  }
}

async function cancelOrderAndRestore({ orderId, expectedStatus, userId, reason = '', comment = '' }) {
  const session = await mongoose.startSession();
  let cancelled;
  try {
    await session.withTransaction(async () => {
      const filter = { _id: orderId, status: expectedStatus };
      if (userId) filter.user = userId;
      const order = await Order.findOne(filter).session(session);
      if (!order || order.status === 'cancelled') throw conflict();

      cancelled = await Order.findOneAndUpdate(filter, {
        $set: { status: 'cancelled', cancelReason: reason },
        $push: { statusHistory: { status: 'cancelled', timestamp: new Date(), comment } },
      }, { new: true, session });
      if (!cancelled) throw conflict();

      for (const item of order.items) {
        const color = item.color ?? '';
        const stock = await Product.updateOne(
          { _id: item.product, variants: { $elemMatch: { size: item.size, color } } },
          { $inc: { 'variants.$[v].stock': item.qty, totalSold: -item.qty } },
          { arrayFilters: [{ 'v.size': item.size, 'v.color': color }], session }
        );
        if (stock.modifiedCount !== 1) throw new Error('Order stock variant missing during cancellation');

        if (item.promotionId) {
          await Promotion.updateOne(
            { _id: item.promotionId, products: { $elemMatch: { product: item.product, limit: { $type: 'number' } } } },
            { $inc: { 'products.$.limit': item.qty } }, { session }
          );
        }
      }

      const user = await User.findById(order.user).session(session);
      const earnedTx = await BonusTransaction.findOne({ order: order._id, type: 'earned' }).session(session);
      if (user) {
        if (order.bonusUsed > 0 && user.bonusExpiresAt > new Date() && !user.bonusExpiryProcessedAt) {
          user.bonusBalance += order.bonusUsed;
          user.totalSaved = Math.max(0, user.totalSaved - order.bonusUsed);
          await BonusTransaction.create([{
            user: user._id, type: 'refund', amount: order.bonusUsed, order: order._id,
            description_ru: `Возврат бонусов за отменённый заказ ${order.orderNumber}`,
            description_ky: `${order.orderNumber} жокко чыгарылды, бонус кайтарылды`,
          }], { session });
        }
        if (earnedTx) {
          const revoked = Math.min(user.bonusBalance, earnedTx.amount);
          user.bonusBalance -= revoked;
          if (revoked > 0) await BonusTransaction.create([{
            user: user._id, type: 'expired', amount: revoked, order: order._id,
            description_ru: `Бонус отменённого заказа ${order.orderNumber} списан`,
            description_ky: `${order.orderNumber} жокко чыгарылды, бонус алынды`,
          }], { session });
        }
        await user.save({ session });
      }
    });
    return cancelled;
  } finally {
    await session.endSession();
  }
}

module.exports = { grantReadyOrderBonus, cancelOrderAndRestore };
