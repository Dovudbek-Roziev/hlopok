// Autentifikatsiya kontrolleri / Authentication controller
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const uuidv4 = crypto.randomUUID;
const QRCode = require('qrcode');
const User = require('../models/User');
const OTP  = require('../models/OTP');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { BonusTransaction, BonusSettings } = require('../models/Bonus');
const { deleteImage, getPublicId } = require('../services/cloudinaryService');
const { sendSMS } = require('../utils/sms');
const msg = require('../utils/msg');
const mongoose = require('mongoose');
const MediaCleanup = require('../models/MediaCleanup');
const { claimOtpSend } = require('../middleware/requestBudget');
const MAX_OTP_ATTEMPTS = 5;

const normalizePhone = value => typeof value === 'string' ? value.replace(/\D/g, '') : '';
const hashVerificationToken = value => crypto.createHash('sha256').update(value).digest('hex');
const otpDeliveryErrorMessage = req => msg(req, 'Не удалось отправить код. Попробуйте позже или обратитесь в магазин', 'Код жөнөтүлгөн жок. Кийинчерээк аракет кылыңыз же дүкөнгө кайрылыңыз');

const generateToken = (userId, tokenVersion = 0, role = 'user') =>
  jwt.sign({ id: userId, tokenVersion }, process.env.JWT_SECRET, { expiresIn: role === 'admin' ? '1h' : (process.env.JWT_EXPIRE || '30d') });

const userPayload = (user) => {
  const bonusExpiresAt = user.bonusExpiresAt || (user.createdAt
    ? new Date(user.createdAt.getTime() + 90 * 24 * 60 * 60 * 1000)
    : null);
  return ({
  _id: user._id,
  phone: user.phone || '',
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  gender: user.gender,
  birthDate: user.birthDate,
  language: user.language,
  role: user.role,
   marketingPush: !!user.marketingPush,
   blockedUsers: (user.blockedUsers || []).map(String),
  bonusBalance: bonusExpiresAt && bonusExpiresAt <= new Date() ? 0 : user.bonusBalance,
  bonusExpiresAt,
  totalSaved: user.totalSaved,
  qrCode: user.qrCode,
  // Always return string IDs (favorites may be populated objects from getMe)
  favorites: (user.favorites || []).map(f => (f._id ? f._id.toString() : f.toString())),
  addresses: user.addresses,
  });
};


// тФАтФАтФА Ro'yxatdan o'tish / Register тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.register = async (req, res) => {
  try {
    const { phone, verificationToken, password, firstName, lastName, gender, language } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите номер в формате 0XXXXXXXXX', 'Номерди 0XXXXXXXXX форматында киргизиңиз') });
    }
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: msg(req, 'Пароль должен содержать от 8 до 72 байт', 'Сырсөз 8ден 72 байтка чейин болушу керек') });
    }
    if (typeof firstName !== 'string' || !firstName.trim() || firstName.length > 100 || typeof lastName !== 'string' || !lastName.trim() || lastName.length > 100 || !['male', 'female'].includes(gender)) {
      return res.status(400).json({ success: false, message: msg(req, 'Заполните обязательные поля', 'Милдеттүү талааларды толтуруңуз') });
    }
    if (typeof verificationToken !== 'string' || !/^[a-f0-9]{64}$/i.test(verificationToken)) {
      return res.status(400).json({ success: false, message: msg(req, 'Сначала подтвердите номер телефона', 'Алгач телефон номерин ырастаңыз') });
    }

    const autoEmail = `${cleanPhone}@hlopok.kg`;
    const existing = await User.findOne({ $or: [{ phone: cleanPhone }, { email: autoEmail }] });
    if (existing) {
      return res.status(400).json({ success: false, message: msg(req, 'Этот номер уже зарегистрирован', 'Бул номер мурда катталган') });
    }

    const tokenHash = hashVerificationToken(verificationToken);
    const qrData = `hlopok:bonus:${uuidv4()}`;
    const qrCode = await QRCode.toDataURL(qrData);
    let user, bonusSettings;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const verifiedOtp = await OTP.findOneAndUpdate({
          phone: cleanPhone, purpose: 'registration', used: true,
          verificationTokenHash: tokenHash, expiresAt: { $gt: new Date() },
        }, { $unset: { verificationTokenHash: 1 } }, { new: true, session });
        if (!verifiedOtp) throw Object.assign(new Error('Phone verification required'), { statusCode: 400 });
        bonusSettings = await BonusSettings.findOne().session(session) || { expiryDays: 90 };
        [user] = await User.create([{
          phone: cleanPhone, email: autoEmail, password, firstName: firstName.trim(),
          lastName: lastName.trim(), gender, language: language === 'ky' ? 'ky' : 'ru',
          qrCode, qrData, bonusExpiresAt: new Date(Date.now() + bonusSettings.expiryDays * 86400000),
        }], { session });
        await OTP.deleteMany({ phone: cleanPhone, purpose: 'registration' }, { session });
      });
    } finally { await session.endSession(); }
    const token = generateToken(user._id, user.tokenVersion || 0, user.role);
    return res.status(201).json({
      success: true, token, user: userPayload(user),
      bonusProgram: { percent: bonusSettings.bonusPercent ?? 5, days: bonusSettings.expiryDays ?? 90 },
    });
  } catch (error) {
    console.error('register error:', error.name, error.code);
    return res.status(error.statusCode || (error.code === 11000 ? 409 : 500)).json({ success: false, message: msg(req, 'Не удалось создать аккаунт. Проверьте подтверждение номера', 'Аккаунт түзүлгөн жок. Номердин ырасталышын текшериңиз') });
  }
};
exports.login = async (req, res) => {
  const lang = req.lang || 'ru';
  const m = {
    ru: { wrong: 'Неверный email или пароль', blocked: 'Аккаунт заблокирован', error: 'Ошибка входа' },
    ky: { wrong: 'Ката email же сырсөз',      blocked: 'Аккаунт бөгөттөлгөн',  error: 'Кирүү катасы'  },
  }[lang] || { wrong: 'Неверный email или пароль', blocked: 'Аккаунт заблокирован', error: 'Ошибка входа' };

  try {
    const { phone, email, password } = req.body || {};
    if (typeof password !== 'string' || (phone != null && typeof phone !== 'string') || (!phone && typeof email !== 'string')) return res.status(400).json({ success: false, message: m.wrong });

    let user;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      user = await User.findOne({ phone: cleanPhone }).select('+password');
    } else {
      user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    }

    if (!user) return res.status(401).json({ success: false, message: m.wrong });
    if (!user.isActive) return res.status(403).json({ success: false, message: m.blocked });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: m.wrong });

    const token = generateToken(user._id, user.tokenVersion || 0, user.role);
    res.json({ success: true, token, user: userPayload(user) });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: m.error });
  }
};

// тФАтФАтФА Telefon orqali parol tiklash / Reset password by phone тФАтФАтФАтФАтФА
exports.resetPasswordByPhone = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;
    if (!phone || !newPassword) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите номер и новый пароль', 'Номер жана жаңы сырсөздү киргизиңиз') });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: msg(req, 'Пароль не менее 8 символов', 'Сырсөз кеминде 8 белги') });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      return res.status(404).json({ success: false, message: msg(req, 'Пользователь с таким номером не найден', 'Бул номер менен колдонуучу табылган жок') });
    }
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.pushToken = '';
    user.pushTokens = [];
    await user.save();
    const token = generateToken(user._id, user.tokenVersion, user.role);
    return res.json({ success: true, token, user: userPayload(user) });
    res.json({ success: true, message: msg(req, 'Пароль успешно изменён', 'Сырсөз ийгиликтүү өзгөртүлдү') });
  } catch (error) {
    console.error('resetPasswordByPhone error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};


// тФАтФАтФА Profilni olish / Get profile тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    if (!user.qrCode || !user.qrData) {
      user.qrData = user.qrData || `hlopok:bonus:${uuidv4()}`;
      user.qrCode = await QRCode.toDataURL(user.qrData);
      await user.save();
    }
    res.json({ success: true, user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// тФАтФАтФА Sevimlilarni olish / Get favorites (populated) тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'name_ru name_ky images price isActive');
    if (!user) return res.status(401).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    res.json({ success: true, favorites: (user.favorites || []).filter(Boolean) });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// тФАтФАтФА Profilni yangilash / Update profile тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, language, gender, birthDate, marketingPush } = req.body;
    if ((firstName !== undefined && (typeof firstName !== 'string' || !firstName.trim() || firstName.length > 100)) || (lastName !== undefined && (typeof lastName !== 'string' || !lastName.trim() || lastName.length > 100)) || (marketingPush !== undefined && typeof marketingPush !== 'boolean')) return res.status(400).json({ success: false, message: msg(req, 'Проверьте данные профиля', 'Профилдин маалыматын текшериңиз') });
    const updates = {};
    if (marketingPush !== undefined) updates.marketingPush = marketingPush;
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName  !== undefined) updates.lastName  = lastName.trim();
    if (language  !== undefined) updates.language  = language;
    if (gender    !== undefined) updates.gender    = gender;
    if (birthDate !== undefined) updates.birthDate = birthDate;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка обновления профиля', 'Профилди жаңыртууда ката') });
  }
};

// тФАтФАтФА Parol o'zgartirish / Change password тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, currentPassword, newPassword, pushToken } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });

    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: msg(req, 'Пароль должен быть не менее 8 символов', 'Сырсөз кеминде 8 белги болушу керек') });
    }
    const isMatch = await user.comparePassword(oldPassword || currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: msg(req, 'Неверный текущий пароль', 'Учурдагы сырсөз туура эмес') });

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.pushToken = '';
    user.pushTokens = typeof pushToken === 'string' && /^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/.test(pushToken)
      ? [pushToken]
      : [];
    await user.save();
    const token = generateToken(user._id, user.tokenVersion, user.role);
    res.json({ success: true, token, user: userPayload(user), message: msg(req, 'Пароль изменён', 'Сырсөз өзгөртүлдү') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка смены пароля', 'Сырсөздү өзгөртүүдө ката') });
  }
};


// тФАтФАтФА Email o'zgartirish / Change email тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.changeEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите корректный email', 'Туура email киргизиңиз') });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (user.email === newEmail) {
      return res.status(400).json({ success: false, message: msg(req, 'Email совпадает с текущим', 'Email учурдагы менен бирдей') });
    }

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите текущий пароль', 'Учурдагы сырсөздү киргизиңиз') });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: msg(req, 'Неверный текущий пароль', 'Учурдагы сырсөз туура эмес') });
    }

    const existing = await User.findOne({ email: newEmail, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(400).json({ success: false, message: msg(req, 'Email уже используется', 'Email мурунтан колдонулган') });
    }

    user.email = newEmail;
    await user.save();
    res.json({ success: true, message: msg(req, 'Email обновлён', 'Email жаңыланды') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// тФАтФАтФА Sevimlilar / Toggle favorite тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.clearFavorites = async (req, res) => {
  try {
    const result = await User.updateOne({ _id: req.user._id }, { $set: { favorites: [] } });
    if (!result.matchedCount) {
      return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    }
    return res.json({ success: true, favorites: [] });
  } catch (error) {
    console.error('clearFavorites error:', error.name);
    return res.status(500).json({ success: false, message: msg(req, 'Не удалось очистить избранное', 'Тандалгандарды тазалоо мүмкүн болгон жок') });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    const exists = user.favorites.some(f => f.toString() === productId);
    if (exists) user.favorites = user.favorites.filter(f => f.toString() !== productId);
    else user.favorites.push(productId);

    await user.save();
    res.json({ success: true, favorites: user.favorites.map(id => id.toString()) });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};

// тФАтФАтФА Manzil qo'shish / Add address тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { title, city, street, apartment, isDefault } = req.body;

    if (!title?.trim() || !street?.trim()) {
      return res.status(400).json({ success: false, message: msg(req, 'Заполните обязательные поля', 'Милдеттүү талааларды толтуруңуз') });
    }

    if (isDefault) user.addresses.forEach(a => { a.isDefault = false; });
    user.addresses.push({ title: title.trim(), city: city?.trim() || 'Ош', street: street.trim(), apartment, isDefault });
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка добавления адреса', 'Дарек кошууда ката') });
  }
};

// тФАтФАтФА Manzil o'chirish / Delete address тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка удаления адреса', 'Дарек жок кылууда ката') });
  }
};

exports.savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') return res.status(400).json({ success: false });
    if (!/^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/.test(token)) {
      return res.status(400).json({ success: false });
    }
    await User.updateMany({ _id: { $ne: req.user._id }, pushTokens: token }, { $pull: { pushTokens: token } });
    await User.updateMany({ _id: { $ne: req.user._id }, pushToken: token }, { $set: { pushToken: '' } });
    const result = await User.updateOne({ _id: req.user._id }, [{ $set: {
      pushTokens: { $slice: [{ $concatArrays: [
        { $filter: {
          input: { $concatArrays: [{ $ifNull: ['$pushTokens', []] }, [{ $ifNull: ['$pushToken', ''] }]] },
          as: 'saved',
          cond: { $and: [{ $ne: ['$$saved', ''] }, { $ne: ['$$saved', token] }] },
        } },
        [token],
      ] }, -10] },
      pushToken: '',
    } }]);
    if (result.matchedCount !== 1) return res.status(404).json({ success: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 }, $set: { pushToken: '', pushTokens: [] } });
    res.json({ success: true });
  } catch { res.status(503).json({ success: false }); }
};

exports.deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (req.user.role === 'admin') return res.status(403).json({ success: false });
    const candidate = await User.findById(req.user._id).select('+password');
    if (!candidate || typeof req.body?.password !== 'string' || !await candidate.comparePassword(req.body.password)) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите текущий пароль', 'Учурдагы сырсөздү киргизиңиз') });
    }
    await session.withTransaction(async () => {
      const user = await User.findOneAndUpdate({ _id: req.user._id, isActive: true, $or: [{ tokenVersion: candidate.tokenVersion || 0 }, ...(candidate.tokenVersion ? [] : [{ tokenVersion: { $exists: false } }])] }, { $inc: { checkoutVersion: 1 } }, { new: true, session });
      if (!user) throw Object.assign(new Error('Account changed'), { statusCode: 409 });
      if (await Order.exists({ user: user._id, status: { $in: ['pending', 'confirmed', 'preparing'] } }).session(session)) {
        throw Object.assign(new Error('Active order'), { statusCode: 409 });
      }
      await OTP.deleteMany({ phone: user.phone }, { session });
      await Review.deleteMany({ user: user._id }, { session });
      const ReviewReport = require('../models/ReviewReport');
      await ReviewReport.deleteMany({ $or: [{ reporter: user._id }, { author: user._id }] }, { session });
      await User.updateMany({ blockedUsers: user._id }, { $pull: { blockedUsers: user._id } }, { session });
      await Order.updateMany({ user: user._id }, { $set: { contactName: 'Deleted User', contactPhone: '', deliveryAddress: '', note: '', cancelReason: '', 'statusHistory.$[].comment': '' }, $unset: { finikPaymentUrl: 1, finikPaymentId: 1 } }, { session });
      await BonusTransaction.updateMany({ user: user._id }, { $set: { description_ru: 'Удалённый аккаунт', description_ky: 'Өчүрүлгөн аккаунт' } }, { session });
      const publicId = getPublicId(user.avatar);
      if (publicId?.startsWith('hlopok/avatars/')) await MediaCleanup.updateOne({ publicId }, { $setOnInsert: { publicId } }, { upsert: true, session });
      await User.updateOne({ _id: user._id }, {
        $set: { email: `deleted-${user._id}@deleted.hlopok.local`, firstName: 'Deleted', lastName: 'User', avatar: '', pushToken: '', pushTokens: [], favorites: [], addresses: [], blockedUsers: [], marketingPush: false, qrCode: '', qrData: '', bonusBalance: 0, totalSaved: 0, isActive: false },
        $unset: { phone: 1, password: 1, gender: 1, birthDate: 1, bonusExpiresAt: 1, bonusExpiryWarningSentAt: 1, bonusExpiryProcessedAt: 1 },
        $inc: { tokenVersion: 1 },
      }, { session });
    });
    res.json({ success: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: msg(req, 'Удаление не выполнено. Проверьте активные заказы или обратитесь в поддержку', 'Өчүрүлгөн жок. Активдүү буйрутмаларды текшериңиз же колдоого кайрылыңыз') });
  } finally { await session.endSession(); }
};

// тФАтФАтФА OTP yuborish / Send OTP тФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФАтФА
exports.sendOTP = async (req, res) => {
  try {
    const cleanPhone = normalizePhone(req.body?.phone);
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите номер в формате 0XXXXXXXXX', 'Номерди 0XXXXXXXXX форматында киргизиңиз') });
    }
    if (await User.findOne({ phone: cleanPhone })) {
      return res.status(400).json({ success: false, message: msg(req, 'Этот номер уже зарегистрирован', 'Бул номер мурда катталган') });
    }

    const recent = await OTP.findOne({
      phone: cleanPhone,
      purpose: 'registration',
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (recent) {
      return res.status(429).json({ success: false, message: msg(req, 'Повторите запрос через минуту', 'Бир мүнөттөн кийин кайталаңыз') });
    }

    await claimOtpSend(cleanPhone, 'registration');
    await OTP.deleteMany({ phone: cleanPhone, purpose: 'registration' });
    const code = crypto.randomInt(100000, 1000000).toString();
    const otp = await OTP.create({
      phone: cleanPhone,
      purpose: 'registration',
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const smsText = req.lang === 'ky'
      ? `Hlopok: тастыктоо коду ${code}. Код 5 мүнөт жарактуу.`
      : `Hlopok: код подтверждения ${code}. Код действителен 5 минут.`;
    try {
      await sendSMS(`+996${cleanPhone.slice(1)}`, smsText);
    } catch (error) {
      console.error('OTP delivery failed:', error.name, error.code);
      await OTP.deleteOne({ _id: otp._id }).catch(cleanupError => console.error('OTP cleanup failed:', cleanupError.name));
      return res.status(502).json({ success: false, message: otpDeliveryErrorMessage(req, error) });
    }

    return res.json({ success: true, message: msg(req, 'Запрос на отправку кода принят', 'Код жөнөтүү өтүнүчү кабыл алынды') });
  } catch (error) {
    console.error('sendOTP error:', error.name, error.code);
    return res.status(error.statusCode || 500).json({ success: false, message: msg(req, 'Не удалось отправить код. Повторите позже', 'Код жөнөтүлгөн жок. Кийинчерээк кайталаңыз') });
  }
};

exports.sendResetOTP = async (req, res) => {
  try {
    const cleanPhone = normalizePhone(req.body?.phone);
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите номер в формате 0XXXXXXXXX', 'Номерди 0XXXXXXXXX форматында киргизиңиз') });
    }

    const recent = await OTP.findOne({
      phone: cleanPhone,
      purpose: 'password_reset',
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (recent) {
      return res.status(429).json({ success: false, message: msg(req, 'Повторите запрос через минуту', 'Бир мүнөттөн кийин кайталаңыз') });
    }

    const user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      return res.json({ success: true, message: msg(req, 'Если номер зарегистрирован, код будет отправлен', 'Номер катталган болсо, код жөнөтүлөт') });
    }

    await claimOtpSend(cleanPhone, 'password_reset');
    await OTP.deleteMany({ phone: cleanPhone, purpose: 'password_reset' });
    const code = crypto.randomInt(100000, 1000000).toString();
    const otp = await OTP.create({
      phone: cleanPhone,
      purpose: 'password_reset',
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const smsText = req.lang === 'ky'
      ? `Hlopok: сырсөздү калыбына келтирүү коду ${code}. Код 5 мүнөт жарактуу.`
      : `Hlopok: код сброса пароля ${code}. Код действителен 5 минут.`;
    try {
      await sendSMS(`+996${cleanPhone.slice(1)}`, smsText);
    } catch (error) {
      console.error('Password reset OTP delivery failed:', error.name, error.code);
      await OTP.deleteOne({ _id: otp._id }).catch(cleanupError => console.error('Password reset OTP cleanup failed:', cleanupError.name));
      return res.status(502).json({ success: false, message: otpDeliveryErrorMessage(req, error) });
    }

    return res.json({ success: true, message: msg(req, 'Если номер зарегистрирован, код будет отправлен', 'Номер катталган болсо, код жөнөтүлөт') });
  } catch (error) {
    console.error('sendResetOTP error:', error.name, error.code);
    return res.status(error.statusCode || 500).json({ success: false, message: msg(req, 'Не удалось отправить код. Повторите позже', 'Код жөнөтүлгөн жок. Кийинчерээк кайталаңыз') });
  }
};

exports.resetPasswordByOTP = async (req, res) => {
  try {
    const cleanPhone = normalizePhone(req.body?.phone);
    const { code, newPassword } = req.body || {};
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0') || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: msg(req, 'Проверьте номер телефона и код', 'Телефон номерин жана кодду текшериңиз') });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: msg(req, 'Пароль должен содержать от 8 до 72 байт', 'Сырсөз 8ден 72 байтка чейин болушу керек') });
    }

    const otp = await OTP.findOne({
      phone: cleanPhone,
      purpose: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: MAX_OTP_ATTEMPTS },
    }).sort({ createdAt: -1 });
    if (!otp) {
      return res.status(400).json({ success: false, message: msg(req, 'Код недействителен или истёк', 'Код жараксыз же мөөнөтү бүткөн') });
    }

    const codeMatches = await bcrypt.compare(code, otp.codeHash);
    if (!codeMatches) {
      const attempt = await OTP.updateOne(
        { _id: otp._id, used: false, attempts: { $lt: MAX_OTP_ATTEMPTS }, expiresAt: { $gt: new Date() } },
        { $inc: { attempts: 1 } }
      );
      const message = attempt.modifiedCount
        ? msg(req, 'Неверный код', 'Код туура эмес')
        : msg(req, 'Слишком много попыток. Запросите новый код', 'Аракеттер көп болду. Жаңы код алыңыз');
      return res.status(attempt.modifiedCount ? 400 : 429).json({ success: false, message });
    }

    const consumed = await OTP.findOneAndUpdate(
      { _id: otp._id, used: false, attempts: { $lt: MAX_OTP_ATTEMPTS }, expiresAt: { $gt: new Date() } },
      { $set: { used: true } },
      { new: true }
    );
    if (!consumed) {
      return res.status(400).json({ success: false, message: msg(req, 'Код уже использован или истёк', 'Код мурда колдонулган же мөөнөтү бүткөн') });
    }

    const user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      return res.status(400).json({ success: false, message: msg(req, 'Не удалось сбросить пароль', 'Сырсөздү өзгөртүү мүмкүн болгон жок') });
    }
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.pushToken = '';
    user.pushTokens = [];
    await user.save();

    return res.json({ success: true, message: msg(req, 'Пароль успешно изменён', 'Сырсөз ийгиликтүү өзгөртүлдү') });
  } catch (error) {
    console.error('resetPasswordByOTP error:', error.name, error.code);
    return res.status(500).json({ success: false, message: msg(req, 'Не удалось сбросить пароль', 'Сырсөздү өзгөртүү мүмкүн болгон жок') });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const cleanPhone = normalizePhone(req.body?.phone);
    const { code } = req.body || {};
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0') || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: msg(req, 'Укажите номер телефона и шестизначный код', 'Телефон номерин жана алты орундуу кодду киргизиңиз') });
    }

    const otp = await OTP.findOne({
      phone: cleanPhone,
      purpose: 'registration',
      used: false,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: MAX_OTP_ATTEMPTS },
    }).sort({ createdAt: -1 });
    if (!otp) {
      return res.status(400).json({ success: false, message: msg(req, 'Код недействителен или истёк', 'Код жараксыз же мөөнөтү бүткөн') });
    }

    const codeMatches = await bcrypt.compare(code, otp.codeHash);
    if (!codeMatches) {
      const attempt = await OTP.updateOne(
        { _id: otp._id, used: false, attempts: { $lt: MAX_OTP_ATTEMPTS }, expiresAt: { $gt: new Date() } },
        { $inc: { attempts: 1 } }
      );
      const message = attempt.modifiedCount
        ? msg(req, 'Неверный код', 'Код туура эмес')
        : msg(req, 'Слишком много попыток. Запросите новый код', 'Аракеттер көп болду. Жаңы код алыңыз');
      return res.status(attempt.modifiedCount ? 400 : 429).json({ success: false, message });
    }

    const registrationToken = crypto.randomBytes(32).toString('hex');
    const verified = await OTP.findOneAndUpdate(
      { _id: otp._id, used: false, attempts: { $lt: MAX_OTP_ATTEMPTS }, expiresAt: { $gt: new Date() } },
      {
        $set: {
          used: true,
          verificationTokenHash: hashVerificationToken(registrationToken),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
      { new: true }
    );
    if (!verified) {
      return res.status(400).json({ success: false, message: msg(req, 'Код уже использован или истёк', 'Код мурда колдонулган же мөөнөтү бүткөн') });
    }

    return res.json({
      success: true,
      registrationToken,
      message: msg(req, 'Номер подтверждён', 'Номер тастыкталды'),
    });
  } catch (error) {
    console.error('verifyOTP error:', error.name, error.code);
    return res.status(500).json({ success: false, message: msg(req, 'Не удалось проверить код', 'Кодду текшерүү мүмкүн болгон жок') });
  }
};
