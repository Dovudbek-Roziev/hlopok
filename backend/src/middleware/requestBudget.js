const crypto = require('crypto');
const Budget = require('../models/RequestBudget');
const msg = require('../utils/msg');

async function consumeBudget(key, maximum, windowMs) {
  const slot = Math.floor(Date.now() / windowMs);
  const id = crypto.createHash('sha256').update(`${key}:${slot}`).digest('hex');
  const budget = await Budget.findOneAndUpdate({ _id: id }, {
    $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((slot + 2) * windowMs) },
  }, { upsert: true, new: true });
  if (budget.count > maximum) throw Object.assign(new Error('Request limit'), { statusCode: 429 });
}

async function claimOtpSend(phone, purpose) {
  await consumeBudget(`otp-phone:${phone}`, 10, 3600000);
  const id = crypto.createHash('sha256').update(`otp-cooldown:${purpose}:${phone}`).digest('hex');
  try {
    await Budget.findOneAndUpdate({ _id: id, expiresAt: { $lte: new Date() } }, {
      $set: { expiresAt: new Date(Date.now() + 60000), count: 1 },
    }, { upsert: true, new: true });
  } catch (error) {
    if (error.code === 11000) throw Object.assign(new Error('OTP cooldown'), { statusCode: 429 });
    throw error;
  }
}

const requestBudget = (name, maximum, windowMs) => async (req, res, next) => {
  try { await consumeBudget(`${name}:${req.ip}`, maximum, windowMs); next(); }
  catch (error) { res.status(error.statusCode || 503).json({ success: false, message: msg(req, 'Повторите попытку позже', 'Кийинчерээк кайталаңыз') }); }
};
module.exports = { consumeBudget, requestBudget, claimOtpSend };
