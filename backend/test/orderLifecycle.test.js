const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Promotion = require('../src/models/Promotion');
const User = require('../src/models/User');
const { BonusTransaction, BonusSettings } = require('../src/models/Bonus');
const { grantReadyOrderBonus, cancelOrderAndRestore } = require('../src/services/orderLifecycle');

const query = value => ({ session: async () => value() });

async function withStore(initial, run) {
  let state = structuredClone(initial);
  const originals = [];
  const replace = (target, name, value) => {
    originals.push([target, name, target[name]]);
    target[name] = value;
  };
  const userDoc = () => ({
    ...state.user,
    save: async function () { state.user = { ...this }; delete state.user.save; },
  });

  replace(mongoose, 'startSession', async () => ({
    withTransaction: async fn => {
      const snapshot = structuredClone(state);
      try { await fn(); } catch (error) { state = snapshot; throw error; }
    },
    endSession: async () => {},
  }));
  replace(Order, 'findById', () => query(() => ({ ...state.order })));
  replace(Order, 'findOne', filter => query(() =>
    state.order._id === filter._id && state.order.status === filter.status && (!filter.user || filter.user === state.order.user)
      ? { ...state.order, items: structuredClone(state.order.items) } : null
  ));
  replace(Order, 'updateOne', (filter, update) => {
    if (state.order._id !== filter._id || (filter.status && state.order.status !== filter.status) ||
        (filter.bonusEarnedAt === null && state.order.bonusEarnedAt)) return { modifiedCount: 0 };
    Object.assign(state.order, update.$set);
    return { modifiedCount: 1 };
  });
  replace(Order, 'findOneAndUpdate', (filter, update) => {
    if (state.order._id !== filter._id || state.order.status !== filter.status ||
        (filter.user && state.order.user !== filter.user)) return null;
    Object.assign(state.order, update.$set);
    state.order.statusHistory.push(update.$push.statusHistory);
    return { ...state.order };
  });
  replace(User, 'findById', () => query(userDoc));
  replace(BonusSettings, 'findOne', () => query(() => ({ expiryDays: 90 })));
  replace(BonusTransaction, 'findOne', filter => query(() => state.transactions.find(tx => tx.order === filter.order && tx.type === filter.type) || null));
  replace(BonusTransaction, 'create', async docs => { state.transactions.push(...docs); });
  replace(Product, 'updateOne', () => {
    if (state.failStock) throw new Error('stock write failed');
    state.product.stock += state.order.items[0].qty;
    state.product.totalSold -= state.order.items[0].qty;
    return { modifiedCount: 1 };
  });
  replace(Promotion, 'updateOne', () => { state.promotionLimit += state.order.items[0].qty; return { modifiedCount: 1 }; });

  try { await run(() => state); } finally {
    for (const [target, name, original] of originals.reverse()) target[name] = original;
  }
}

const base = () => ({
  order: {
    _id: 'order-1', user: 'user-1', orderNumber: 'HLP-1', status: 'pending',
    paymentConfirmed: false, bonusEarned: 5, bonusUsed: 2, statusHistory: [],
    items: [{ product: 'product-1', size: 'M', color: '', qty: 2, promotionId: 'promo-1' }],
  },
  user: {
    _id: 'user-1', createdAt: new Date(), bonusExpiresAt: new Date(Date.now() + 86400000),
    bonusBalance: 4, totalSaved: 2,
  },
  product: { stock: 3, totalSold: 2 },
  promotionLimit: 5,
  transactions: [],
});

test('paid ready order earns bonus once across repeated confirmations', async () => {
  const initial = base();
  initial.order.status = 'ready';
  initial.order.paymentConfirmed = true;
  await withStore(initial, async get => {
    await grantReadyOrderBonus('order-1');
    await grantReadyOrderBonus('order-1');
    assert.equal(get().user.bonusBalance, 9);
    assert.equal(get().transactions.filter(tx => tx.type === 'earned').length, 1);
    assert.ok(get().order.bonusEarnedAt);
  });
});

test('cancellation restores stock, promotion and bonus once', async () => {
  await withStore(base(), async get => {
    await cancelOrderAndRestore({ orderId: 'order-1', expectedStatus: 'pending', userId: 'user-1' });
    await assert.rejects(
      cancelOrderAndRestore({ orderId: 'order-1', expectedStatus: 'pending', userId: 'user-1' }),
      { statusCode: 409 }
    );
    assert.equal(get().order.status, 'cancelled');
    assert.equal(get().product.stock, 5);
    assert.equal(get().promotionLimit, 7);
    assert.equal(get().user.bonusBalance, 6);
    assert.equal(get().transactions.filter(tx => tx.type === 'refund').length, 1);
  });
});

test('failed stock restore leaves cancellation unapplied', async () => {
  const initial = base();
  initial.failStock = true;
  await withStore(initial, async get => {
    await assert.rejects(cancelOrderAndRestore({ orderId: 'order-1', expectedStatus: 'pending' }), /stock write failed/);
    assert.equal(get().order.status, 'pending');
    assert.equal(get().user.bonusBalance, 4);
    assert.equal(get().transactions.length, 0);
  });
});

test('cancelling a rewarded order removes its earned bonus', async () => {
  const initial = base();
  initial.order.status = 'ready';
  initial.order.paymentConfirmed = true;
  initial.order.bonusEarnedAt = new Date();
  initial.user.bonusBalance = 9;
  initial.transactions.push({ order: 'order-1', type: 'earned', amount: 5 });
  await withStore(initial, async get => {
    await cancelOrderAndRestore({ orderId: 'order-1', expectedStatus: 'ready' });
    assert.equal(get().order.status, 'cancelled');
    assert.equal(get().user.bonusBalance, 6);
    assert.equal(get().transactions.filter(tx => tx.type === 'refund').length, 1);
    assert.equal(get().transactions.filter(tx => tx.type === 'expired').length, 1);
  });
});

test('spent cashback blocks automatic cancellation without changing stock or order', async () => {
  const initial = base();
  initial.order.status = 'ready'; initial.order.bonusUsed = 0;
  initial.user.bonusBalance = 0;
  initial.transactions.push({ order: 'order-1', type: 'earned', amount: 5 });
  await withStore(initial, async get => {
    await assert.rejects(cancelOrderAndRestore({ orderId: 'order-1', expectedStatus: 'ready' }), { statusCode: 409 });
    assert.equal(get().order.status, 'ready');
    assert.equal(get().product.stock, 3);
    assert.equal(get().user.bonusBalance, 0);
  });
});
