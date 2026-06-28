// Bonus kontrolleri / Bonus controller
const User = require('../models/User');
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
    let settings = await BonusSettings.findOne();
    if (!settings) settings = await BonusSettings.create({});
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
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ success: false, message: msg(req, 'Процент от 0 до 100', 'Пайыз 0 ден 100 ге чейин') });
      }
    }
    if (expiryDays !== undefined) {
      const days = Number(expiryDays);
      if (isNaN(days) || days < 1 || days > 3650) {
        return res.status(400).json({ success: false, message: msg(req, 'Срок от 1 до 3650 дней', 'Мөөнөт 1 ден 3650 күнгө чейин') });
      }
    }

    let settings = await BonusSettings.findOne();
    if (!settings) settings = new BonusSettings();
    if (bonusPercent !== undefined) settings.bonusPercent = Number(bonusPercent);
    if (expiryDays !== undefined) settings.expiryDays = Number(expiryDays);
    if (warningDays !== undefined) settings.warningDays = Number(warningDays);
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
    const expiresAt = new Date(Date.now() + settings.expiryDays * 24 * 60 * 60 * 1000);

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
  try {
    const { userId, days } = req.body;
    const parsedDays = Number(days);
    if (!parsedDays || parsedDays <= 0 || isNaN(parsedDays)) {
      return res.status(400).json({ success: false, message: msg(req, 'Неверное количество дней', 'Күндөр саны туура эмес') });
    }
    const newExpiry = new Date(Date.now() + parsedDays * 24 * 60 * 60 * 1000);

    await BonusTransaction.updateMany(
      { user: userId, type: { $in: ['earned', 'admin_add'] } },
      { expiresAt: newExpiry }
    );

    res.json({ success: true, message: msg(req, 'Срок бонусов продлён', 'Бонус мөөнөтү узартылды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
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
