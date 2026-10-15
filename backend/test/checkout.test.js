const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Promotion = require('../src/models/Promotion');
const User = require('../src/models/User');
const { BonusSettings, BonusTransaction } = require('../src/models/Bonus');
const { checkout, normalizeCheckout, verifyReplay } = require('../src/services/checkout');
const productId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439012';
const promoId = '507f1f77bcf86cd799439013';
const body = () => ({ clientRequestId: 'test-request-key-1234', contactName: 'Customer', contactPhone: '0700000000', items: [{ productId, size: 'M', color: '', qty: 1 }], bonusUsed: 10 });

test('checkout rejects invalid quantities, IDs, address and bonus before writes', () => {
  for (const qty of [-1, 0, 1.5, '2', null, Infinity, 100]) {
    const input = body(); input.items[0].qty = qty;
    assert.throws(() => normalizeCheckout(input), { statusCode: 400 });
  }
  for (const patch of [{ bonusUsed: -1 }, { contactName: {} }, { deliveryMethod: 'delivery' }, { paymentMethod: 'invented' }]) {
    assert.throws(() => normalizeCheckout({ ...body(), ...patch }), { statusCode: 400 });
  }
});

test('duplicates merge and canonical fingerprint detects changed checkout', () => {
  const input = body(); input.items.push({ ...input.items[0] });
  assert.equal(normalizeCheckout(input).items[0].qty, 2);
  const first = normalizeCheckout(body());
  assert.throws(() => verifyReplay({ requestHash: first.requestHash }, normalizeCheckout({ ...body(), contactName: 'Other' })), { statusCode: 409 });
});

test('model rejects duplicate variants and fractional stock', () => {
  const model = variants => new Product({ name_ru: 'Test', name_ky: 'Test', category: productId, price: 100, variants });
  assert.ok(model([{ size: 'M', stock: 1 }, { size: 'M', stock: 1 }]).validateSync());
  assert.ok(model([{ size: 'M', stock: 1.5 }]).validateSync());
  assert.equal(model([{ size: 'M', stock: 2 }]).validateSync(), undefined);
});

async function withStore(run, { failLedger = false, promotion = false } = {}) {
  let state = { user: { _id: userId, isActive: true, createdAt: new Date(), bonusExpiresAt: new Date(Date.now() + 86400000), bonusBalance: 20, totalSaved: 0 }, product: { _id: productId, isActive: true, updatedAt: new Date(), price: 100, name_ru: 'Test', name_ky: 'Test', variants: [{ size: 'M', color: '', stock: 1 }] }, promo: { _id: promoId, updatedAt: new Date(), discountPercent: 20, products: [{ product: productId, limit: 1 }] }, orders: [], ledger: [] };
  const original = [];
  const replace = (obj, key, fn) => { original.push([obj, key, obj[key]]); obj[key] = fn; };
  const session = { withTransaction: async fn => { const snapshot = structuredClone(state); try { await fn(); } catch (e) { state = snapshot; throw e; } }, endSession: async () => {} };
  const query = fn => ({ session: async actual => { assert.equal(actual, session); return fn(); } });
  const check = options => assert.equal(options.session, session, 'all writes must participate in transaction');
  replace(mongoose, 'startSession', async () => session);
  replace(Order, 'findOne', filter => query(() => state.orders.find(o => o.clientRequestId === filter.clientRequestId)));
  replace(User, 'findOneAndUpdate', async (filter, update, options) => {
    check(options);
    return { ...state.user, save: async function (opts) { check(opts); state.user.bonusBalance = this.bonusBalance; state.user.totalSaved = this.totalSaved; } };
  });
  replace(BonusSettings, 'findOne', () => query(() => ({ bonusPercent: 5, expiryDays: 90 })));
  replace(Product, 'findOne', () => query(() => structuredClone(state.product)));
  replace(Product, 'updateOne', async (filter, update, opts) => { check(opts); state.product.variants[0].stock += update.$inc['variants.$[v].stock']; return { modifiedCount: 1 }; });
  replace(Promotion, 'findOne', () => query(() => promotion ? structuredClone(state.promo) : null));
  replace(Promotion, 'updateOne', async (filter, update, opts) => { check(opts); state.promo.products[0].limit += update.$inc['products.$[p].limit'] || 0; return { modifiedCount: 1 }; });
  replace(Order, 'create', async (docs, opts) => { check(opts); const doc = { ...docs[0], _id: 'order-1', orderNumber: 'HLP-TEST' }; state.orders.push(doc); return [doc]; });
  replace(BonusTransaction, 'create', async (docs, opts) => { check(opts); if (failLedger) throw new Error('Ledger unavailable'); state.ledger.push(...docs); });
  try { await run(() => state); } finally { for (const [obj, key, fn] of original.reverse()) obj[key] = fn; }
}

test('successful checkout commits stock, bonus and order once; retry replays', async () => withStore(async get => {
  const first = await checkout(userId, body());
  const second = await checkout(userId, body());
  assert.equal(first.created, true); assert.equal(second.created, false);
  assert.equal(get().orders.length, 1); assert.equal(get().product.variants[0].stock, 0);
  assert.equal(get().user.bonusBalance, 10); assert.equal(get().ledger.length, 1);
  assert.equal(first.order.total, 90);
}));

test('failure after order creation rolls back stock, bonus, order and ledger', async () => withStore(async get => {
  await assert.rejects(checkout(userId, body()), /Ledger unavailable/);
  assert.equal(get().orders.length, 0); assert.equal(get().product.variants[0].stock, 1);
  assert.equal(get().user.bonusBalance, 20); assert.equal(get().ledger.length, 0);
}, { failLedger: true }));

test('last promotional item retains discount before limit reaches zero', async () => withStore(async get => {
  const input = body(); input.items[0].promotionId = promoId;
  const result = await checkout(userId, input);
  assert.equal(result.order.subtotal, 80); assert.equal(result.order.total, 70);
  assert.equal(get().promo.products[0].limit, 0);
}, { promotion: true }));

test('invalid promotion rolls back the entire checkout', async () => withStore(async get => {
  const input = body(); input.items[0].promotionId = promoId;
  await assert.rejects(checkout(userId, input), { statusCode: 409 });
  assert.equal(get().orders.length, 0); assert.equal(get().product.variants[0].stock, 1);
}));
