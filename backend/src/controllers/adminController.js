// Admin kontrolleri / Admin controller
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Banner = require('../models/Banner');
const Promotion = require('../models/Promotion');
const { BonusTransaction, BonusSettings } = require('../models/Bonus');
const Review = require('../models/Review');
const FAQ = require('../models/FAQ');
const OTP = require('../models/OTP');
const msg  = require('../utils/msg');
const { sendPushNotification } = require('../utils/pushNotification');

// ─── Foydalanuvchilar ro'yxati / Get all users ────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const safeLimit = Math.max(1, Math.min(Math.floor(Number(limit)) || 20, 500));
    const filter = { role: 'user' };
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { phone: { $regex: safe, $options: 'i' } },
        { firstName: { $regex: safe, $options: 'i' } },
        { lastName: { $regex: safe, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, Math.min(100000, Math.floor(Number(page)) || 1)) - 1) * safeLimit;
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -qrCode -avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true, users,
      pagination: { page: Math.max(1, Math.min(100000, Math.floor(Number(page)) || 1)), limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Bitta foydalanuvchi / Single user ───────────────────────────
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -avatar');
    if (!user) return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });

    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, user, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Push broadcast / Barcha foydalanuvchilarga xabar ────────────
exports.pushBroadcast = async (req, res) => {
  try {
    const { title_ru, title_ky, body_ru, body_ky, target } = req.body;

    if (!title_ru || !title_ky || !body_ru || !body_ky) {
      return res.status(400).json({ success: false, message: msg(req, 'Заполните все поля', 'Бардык талааларды толтуруңуз') });
    }

    let query = { marketingPush: true, $or: [{ pushToken: { $exists: true, $nin: [null, ''] } }, { 'pushTokens.0': { $exists: true } }], isActive: true };

    if (target === 'active') {
      const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const activeIds = await Order.distinct('user', { createdAt: { $gte: since } });
      query._id = { $in: activeIds };
    } else if (target === 'bonus') {
      query.bonusBalance = { $gt: 0 };
    }

    const users = await User.find(query).select('pushToken pushTokens language').lean();

    // Expo batch API: 100 ta message gacha bitta so'rovda yuborish
    const BATCH = 100;
    let sent = 0;
    const messages = users.flatMap(u => {
      const isKy = u.language === 'ky';
      const tokens = [...new Set([...(u.pushTokens || []), u.pushToken].filter(t => /^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/.test(t || '')))];
      return tokens.map(token => ({ to: token, title: isKy ? title_ky : title_ru, body: isKy ? body_ky : body_ru, data: { screen: 'HomeTab' }, sound: 'default', priority: 'high', channelId: 'orders' }));
    });

    for (let i = 0; i < messages.length; i += BATCH) {
      const batch = messages.slice(i, i + BATCH);
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(batch),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(result?.data)) {
          console.error('pushBroadcast rejected batch:', response.status, result);
          continue;
        }
        sent += result.data.filter(ticket => ticket.status === 'ok').length;
      } catch (err) {
        console.error('pushBroadcast batch error:', err.message);
      }
    }

    res.json({ success: true, sent });
  } catch (error) {
    console.error('pushBroadcast error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка рассылки', 'Жөнөтүүдө ката') });
  }
};

// ─── Parolni tiklash / Reset user password ───────────────────────
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: msg(req, 'Минимум 8 символов', 'Кеминде 8 белги') });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.pushToken = '';
    user.pushTokens = [];
    await user.save();

    res.json({ success: true, message: msg(req, 'Пароль изменён', 'Сырсөз өзгөртүлдү') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};

// ─── Barcha test ma'lumotlarini tozalash / Clear all data (keep admin) ───────
exports.clearAllData = async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hlopok.com';
    await Promise.all([
      User.deleteMany({ role: { $ne: 'admin' } }),
      Order.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Banner.deleteMany({}),
      Promotion.deleteMany({}),
      BonusTransaction.deleteMany({}),
      Review.deleteMany({}),
      FAQ.deleteMany({}),
      OTP.deleteMany({}),
    ]);
    res.json({ success: true, message: msg(req, 'Все данные очищены. Остался только аккаунт администратора.', 'Бардык маалыматтар тазаланды. Администратор аккаунту гана калды.') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка очистки', 'Тазалоодо ката') });
  }
};

// ─── Bloklash / Block user ────────────────────────────────────────
exports.toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });

    user.isActive = !user.isActive;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    if (!user.isActive) { user.pushToken = ''; user.pushTokens = []; }
    await user.save();
    if (!user.isActive) req.app.get('io')?.in(`user_${user._id}`).disconnectSockets(true);

    res.json({
      success: true,
      message: user.isActive
        ? msg(req, 'Пользователь активирован', 'Колдонуучу жандырылды')
        : msg(req, 'Пользователь заблокирован', 'Колдонуучу бөгөттөлдү'),
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};
