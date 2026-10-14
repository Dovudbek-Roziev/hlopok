// Bonus kontrolleri / Bonus controller
const User = require('../models/User');
const mongoose = require('mongoose');
const { BonusTransaction, BonusSettings } = require('../models/Bonus');
const msg = require('../utils/msg');

// ─── Bonus tarixi / Bonus history ────────────────────────────────
exports.getMyBonusHistory = async (req, res) => {
  try {
    const transactions = await BonusTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Bonus sozlamalari olish / Get bonus settings ─────────────────
exports.getSettings = async (req, res) => {
  try {
    const settings = await BonusSettings.findOne() || { bonusPercent: 5, expiryDays: 90, warningDays: 7 };
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Admin: Bonus sozlamalarini yangilash / Update settings ───────
exports.updateSettings = async (req, res) => {
  try {
    const { bonusPercent, expiryDays, warningDays } = req.body;

    if (bonusPercent !== undefined) {
      const pct = Number(bonusPercent);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ success: false, message: msg(req, 'Процент от 0 до 100', 'Пайыз 0 ден 100 ге чейин') });
      }
    }
    if (expiryDays !== undefined) {
      const days = Number(expiryDays);
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        return res.status(400).json({ success: false, message: msg(req, 'Срок от 1 до 3650 дней', 'Мөөнөт 1 ден 3650 күнгө чейин') });
      }
    }

    let settings = await BonusSettings.findOne();
    if (!settings) settings = new BonusSettings();
    if (bonusPercent !== undefined) settings.bonusPercent = Number(bonusPercent);
    if (expiryDays !== undefined) settings.expiryDays = Number(expiryDays);
    if (warningDays !== undefined || expiryDays !== undefined) {
      const days = warningDays === undefined ? settings.warningDays : Number(warningDays);
      const maxWarningDays = expiryDays === undefined ? settings.expiryDays : Number(expiryDays);
      if (!Number.isInteger(days) || days < 0 || days > maxWarningDays) {
        return res.status(400).json({ success: false, message: msg(req, 'Проверьте срок предупреждения', 'Эскертүү мөөнөтүн текшериңиз') });
      }
      settings.warningDays = days;
    }
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления настроек', 'Жөндөөлөрдү жаңыртууда ката') });
  }
};

// ─── Admin: Bonus qo'shish / Add bonus (accepts userId or emailOrQr) ─
exports.addBonusManual = async (req, res) => {
  try {
    const { userId, emailOrQr, amount, note, description_ru, description_ky } = req.body;

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (emailOrQr) {
      // QR matnni tekshirish (hlopok:bonus:uuid) / Check QR text
      if (emailOrQr.startsWith('hlopok:bonus:')) {
        user = await User.findOne({ qrData: emailOrQr });
      } else {
        user = await User.findOne({ email: emailOrQr.toLowerCase() });
      }
    }
    if (!user) return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0 || isNaN(parsedAmount)) {
      return res.status(400).json({ success: false, message: msg(req, 'Неверная сумма', 'Сумма туура эмес') });
    }

    const settings = await BonusSettings.findOne() || { expiryDays: 90 };
    const expiresAt = user.bonusExpiresAt || new Date(user.createdAt.getTime() + settings.expiryDays * 24 * 60 * 60 * 1000);
    if (expiresAt <= new Date() || user.bonusExpiryProcessedAt) {
      return res.status(400).json({ success: false, message: msg(req, 'Срок бонусного периода истёк', 'Бонус мөөнөтү бүттү') });
    }

    user.bonusBalance += parsedAmount;
    await user.save();

    await BonusTransaction.create({
      user: user._id,
      type: 'admin_add',
      amount: parsedAmount,
      expiresAt,
      description_ru: description_ru || note || 'Бонус добавлен администратором',
      description_ky: description_ky || note || 'Бонус администратор тарабынан кошулду',
    });

    res.json({ success: true, message: msg(req, 'Бонус добавлен', 'Бонус кошулду'), user: { email: user.email, bonusBalance: user.bonusBalance } });
  } catch (error) {
    console.error('addBonusManual error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка добавления бонуса', 'Бонус кошуудо ката') });
  }
};

// ─── Admin: QR kod bo'yicha foydalanuvchi topish / Find user by QR ─
exports.findByQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData || !qrData.startsWith('hlopok:bonus:')) {
      return res.status(400).json({ success: false, message: msg(req, 'Неверный QR-код', 'Ката QR-код') });
    }
    const user = await User.findOne({ qrData }).select('_id email firstName lastName bonusBalance');
    if (!user) return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Admin: Muddatni uzaytirish / Extend expiry ───────────────────
exports.extendExpiry = async (req, res) => {
  const { userId, days } = req.body;
  const parsedDays = Number(days);
  if (!mongoose.Types.ObjectId.isValid(userId) || !Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 3650) {
    return res.status(400).json({ success: false, message: msg(req, 'Укажите целое число дней от 1 до 3650', '1ден 3650гө чейинки бүтүн күн санын көрсөтүңүз') });
  }

  const session = await mongoose.startSession();
  try {
    let newExpiry;
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
      const settings = await BonusSettings.findOne().session(session);
      const currentExpiry = user.bonusExpiresAt || new Date(user.createdAt.getTime() + (settings?.expiryDays ?? 90) * 86400000);
      const now = new Date();
      if (user.bonusExpiryProcessedAt || currentExpiry <= now) {
        throw Object.assign(new Error('Bonus period expired'), { statusCode: 400 });
      }
      newExpiry = new Date(currentExpiry.getTime() + parsedDays * 86400000);
      user.bonusExpiresAt = newExpiry;
      user.bonusExpiryWarningSentAt = undefined;
      await user.save({ session });
      await BonusTransaction.updateMany(
        { user: userId, type: { $in: ['earned', 'admin_add'] }, $or: [{ expiresAt: { $gt: now } }, { expiresAt: { $exists: false } }] },
        { $set: { expiresAt: newExpiry } }, { session }
      );
    });
    res.json({ success: true, expiresAt: newExpiry, message: msg(req, 'Срок бонусов продлён', 'Бонустун мөөнөтү узартылды') });
  } catch (error) {
    if (error.statusCode === 404) return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    if (error.statusCode === 400) return res.status(400).json({ success: false, message: msg(req, 'Срок бонусов уже истёк', 'Бонустун мөөнөтү бүтүп калган') });
    console.error('extendExpiry error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка продления срока', 'Мөөнөттү узартууда ката') });
  } finally {
    await session.endSession();
  }
};

// ─── Admin: Barcha tranzaksiyalar / All transactions ──────────────
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const safeLimit = Math.min(Number(limit) || 30, 500);
    const skip = (Number(page) - 1) * safeLimit;

    const [transactions, total] = await Promise.all([
      BonusTransaction.find()
        .populate('user', 'email firstName lastName')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      BonusTransaction.countDocuments(),
    ]);

    res.json({
      success: true, transactions,
      pagination: { page: Number(page), limit: safeLimit, total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

exports.getTransactionStats = async (req, res) => {
  try {
    const settings = await BonusSettings.findOne();
    const now = new Date();
    const expiryDays = settings?.expiryDays ?? 90;
    const legacyCutoff = new Date(now.getTime() - expiryDays * 86400000);
    const [totals, usersWithBonus] = await Promise.all([
      BonusTransaction.aggregate([
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      User.countDocuments({
        bonusBalance: { $gt: 0 },
        bonusExpiryProcessedAt: { $exists: false },
        $or: [
          { bonusExpiresAt: { $gt: now } },
          { bonusExpiresAt: { $exists: false }, createdAt: { $gt: legacyCutoff } },
        ],
      }),
    ]);
    const byType = Object.fromEntries(totals.map(row => [row._id, row.total]));
    res.json({
      success: true,
      stats: {
        totalGiven: (byType.earned || 0) + (byType.admin_add || 0),
        totalUsed: Math.max(0, (byType.used || 0) - (byType.refund || 0)),
        usersWithBonus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};
