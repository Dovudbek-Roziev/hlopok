const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const { protect } = require('../src/middleware/auth');
const { logout } = require('../src/controllers/authController');
const Budget = require('../src/models/RequestBudget');
const { claimOtpSend } = require('../src/middleware/requestBudget');
const { uploadToCloudinary } = require('../src/utils/cloudinaryUpload');

const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const secret = 'test-only-secret-not-a-production-credential';

test('expired and revoked tokens are rejected; DB failure returns 503', async () => {
  const oldSecret = process.env.JWT_SECRET;
  const original = User.findById;
  process.env.JWT_SECRET = secret;
  const request = token => ({ headers: { authorization: `Bearer ${token}` } });
  try {
    let next = false;
    User.findById = async () => ({ isActive: true, tokenVersion: 2 });
    const revoked = response();
    await protect(request(jwt.sign({ id: 'user', tokenVersion: 1 }, secret)), revoked, () => { next = true; });
    assert.equal(revoked.code, 401); assert.equal(next, false);
    const expired = response();
    await protect(request(jwt.sign({ id: 'user' }, secret, { expiresIn: -1 })), expired, () => { next = true; });
    assert.equal(expired.code, 401);
    User.findById = async () => { throw new Error('Database unavailable'); };
    const unavailable = response();
    await protect(request(jwt.sign({ id: 'user' }, secret)), unavailable, () => { next = true; });
    assert.equal(unavailable.code, 503);
  } finally { User.findById = original; if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret; }
});

test('logout revokes sessions and clears notification tokens even without a push token', async () => {
  const original = User.updateOne;
  let update;
  try {
    User.updateOne = async (_, value) => { update = value; return { modifiedCount: 1 }; };
    await logout({ user: { _id: 'user' }, body: {} }, response());
    assert.equal(update.$inc.tokenVersion, 1);
    assert.deepEqual(update.$set.pushTokens, []);
    assert.equal(update.$set.pushToken, '');
  } finally { User.updateOne = original; }
});

test('parallel OTP cooldown claim cannot create another send', async () => {
  const original = Budget.findOneAndUpdate;
  let leases = 0;
  try {
    Budget.findOneAndUpdate = async (_, update) => {
      if (update.$inc) return { count: 1 };
      if (leases++) throw Object.assign(new Error('Duplicate cooldown key'), { code: 11000 });
      return { count: 1 };
    };
    const result = await Promise.allSettled([claimOtpSend('0700000000', 'registration'), claimOtpSend('0700000000', 'registration')]);
    assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(result.find(r => r.status === 'rejected').reason.statusCode, 429);
  } finally { Budget.findOneAndUpdate = original; }
});

test('fake PNG and SVG fail before any Cloudinary request', async () => {
  await assert.rejects(uploadToCloudinary(Buffer.from('<svg>untrusted</svg>'), 'image/svg+xml', 'test'), { statusCode: 400 });
  const fake = Buffer.alloc(20); Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(fake);
  await assert.rejects(uploadToCloudinary(fake, 'image/png', 'test'), { statusCode: 400 });
});
