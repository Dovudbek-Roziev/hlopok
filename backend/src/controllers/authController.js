// Autentifikatsiya kontrolleri / Authentication controller
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const User = require('../models/User');
const OTP  = require('../models/OTP');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { sendSMS } = require('../utils/sms');
const msg = require('../utils/msg');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const userPayload = (user) => ({
  _id: user._id,
  phone: user.phone || '',
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  gender: user.gender,
  birthDate: user.birthDate,
  language: user.language,
  role: user.role,
  bonusBalance: user.bonusBalance,
  totalSaved: user.totalSaved,
  qrCode: user.qrCode,
  // Always return string IDs (favorites may be populated objects from getMe)
  favorites: (user.favorites || []).map(f => (f._id ? f._id.toString() : f.toString())),
  addresses: user.addresses,
  avatar: user.avatar || '',
});


// ─── Ro'yxatdan o'tish / Register ────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { phone, email: emailInput, password, firstName, lastName, gender, birthDate, language } = req.body;

    // Phone-based registration (mobile flow)
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
        return res.status(400).json({ success: false, message: msg(req, 'Введите номер в формате 0XXXXXXXXX', 'Номерди 0XXXXXXXXX форматында киргизиңиз') });
      }
      const existing = await User.findOne({ phone: cleanPhone });
      if (existing) return res.status(400).json({ success: false, message: msg(req, 'Этот номер уже зарегистрирован', 'Бул номер катталган') });

      const autoEmail = `${cleanPhone.replace(/\D/g, '')}@hlopok.kg`;
      const existingEmail = await User.findOne({ email: autoEmail });
      if (existingEmail) return res.status(400).json({ success: false, message: msg(req, 'Этот номер уже зарегистрирован', 'Бул номер катталган') });

      const qrData = `hlopok:bonus:${uuidv4()}`;
      const qrCode = await QRCode.toDataURL(qrData);

      const user = await User.create({
        phone: cleanPhone,
        email: autoEmail,
        password, firstName, lastName, gender,
        birthDate: birthDate || new Date('1990-01-01'),
        language: language || 'ru',
        qrCode, qrData,
      });
      const token = generateToken(user._id);
      return res.status(201).json({ success: true, token, user: userPayload(user) });
    }

    // Email-based registration (legacy / admin)
    const existing = await User.findOne({ email: emailInput });
    if (existing) return res.status(400).json({ success: false, message: msg(req, 'Email уже зарегистрирован', 'Email катталган') });

    const qrData = `hlopok:bonus:${uuidv4()}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const user = await User.create({
      email: emailInput, password, firstName, lastName, gender, birthDate,
      language: language || 'ru',
      qrCode, qrData,
    });

    const token = generateToken(user._id);
    return res.status(201).json({ success: true, token, user: userPayload(user) });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка регистрации', 'Катталууда ката') });
  }
};

// ─── Kirish / Login ───────────────────────────────────────────────
exports.login = async (req, res) => {
  const lang = req.lang || 'ru';
  const m = {
    ru: { wrong: 'Неверный email или пароль', blocked: 'Аккаунт заблокирован', error: 'Ошибка входа' },
    ky: { wrong: 'Ката email же сырсөз',      blocked: 'Аккаунт бөгөттөлгөн',  error: 'Кирүү катасы'  },
  }[lang] || { wrong: 'Неверный email или пароль', blocked: 'Аккаунт заблокирован', error: 'Ошибка входа' };

  try {
    const { phone, email, password } = req.body;

    let user;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      user = await User.findOne({ phone: cleanPhone }).select('+password');
    } else {
      user = await User.findOne({ email }).select('+password');
    }

    if (!user) return res.status(401).json({ success: false, message: m.wrong });
    if (!user.isActive) return res.status(403).json({ success: false, message: m.blocked });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: m.wrong });

    const token = generateToken(user._id);
    res.json({ success: true, token, user: userPayload(user) });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: m.error });
  }
};

// ─── Telefon orqali parol tiklash / Reset password by phone ─────
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
    await user.save();
    res.json({ success: true, message: msg(req, 'Пароль успешно изменён', 'Сырсөз ийгиликтүү өзгөртүлдү') });
  } catch (error) {
    console.error('resetPasswordByPhone error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};


// ─── Profilni olish / Get profile ────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    res.json({ success: true, user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Sevimlilarni olish / Get favorites (populated) ──────────────
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'name_ru name_ky images price isActive');
    if (!user) return res.status(401).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    res.json({ success: true, favorites: user.favorites || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// ─── Profilni yangilash / Update profile ─────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, language, gender, birthDate } = req.body;
    const updates = {};
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

// ─── Parol o'zgartirish / Change password ────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: msg(req, 'Пароль должен быть не менее 8 символов', 'Сырсөз кеминде 8 белги болушу керек') });
    }
    const isMatch = await user.comparePassword(oldPassword || currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: msg(req, 'Неверный текущий пароль', 'Учурдагы сырсөз туура эмес') });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: msg(req, 'Пароль изменён', 'Сырсөз өзгөртүлдү') });
  } catch (error) {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка смены пароля', 'Сырсөздү өзгөртүүдө ката') });
  }
};


// ─── Email o'zgartirish / Change email ───────────────────────────
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

// ─── Avatar yuklash / Upload avatar ──────────────────────────────
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: msg(req, 'Файл не загружен', 'Файл жүктөлгөн жок') });
    }
    const url = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'hlopok/avatars');
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: url }, { new: true });
    res.json({ success: true, avatar: user.avatar, user: userPayload(user) });
  } catch (error) {
    console.error('Avatar upload error:', error.message || error);
    res.status(500).json({ success: false, message: error.message || msg(req, 'Ошибка загрузки аватара', 'Аватарды жүктөөдө ката') });
  }
};

// ─── Sevimlilar / Toggle favorite ────────────────────────────────
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

// ─── Manzil qo'shish / Add address ───────────────────────────────
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

// ─── Manzil o'chirish / Delete address ───────────────────────────
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
    if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
      return res.status(400).json({ success: false });
    }
    await User.findByIdAndUpdate(req.user._id, { pushToken: token });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// ─── OTP yuborish / Send OTP ─────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const clean = (phone || '').replace(/\D/g, '');

    if (clean.length !== 10 || !clean.startsWith('0')) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите номер в формате 0XXXXXXXXX', 'Номерди 0XXXXXXXXX форматында киргизиңиз') });
    }

    // Allaqachon ro'yxatdan o'tganmi?
    const existing = await User.findOne({ phone: clean });
    if (existing) {
      return res.status(400).json({ success: false, message: msg(req, 'Этот номер уже зарегистрирован', 'Бул номер катталган') });
    }

    // Rate limit: 1 daqiqada 1 ta SMS
    const recent = await OTP.findOne({ phone: clean, createdAt: { $gt: new Date(Date.now() - 60 * 1000) } });
    if (recent) {
      return res.status(429).json({ success: false, message: msg(req, 'Подождите минуту перед повторной отправкой', 'Кайра жөнөтүү үчүн 1 мүнөт күтүңүз') });
    }

    // Eskisini o'chirish
    await OTP.deleteMany({ phone: clean });

    // 4 xonali kod
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await OTP.create({ phone: clean, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    // SMS yuborish (+996 prefixi bilan, 0 ni olib tashlab)
    const intlPhone = `+996${clean.slice(1)}`;
    await sendSMS(intlPhone, `Hlopok: код подтверждения ${code}. Действует 5 минут.`);

    res.json({ success: true, message: msg(req, 'Код отправлен', 'Код жөнөтүлдү') });
  } catch (error) {
    console.error('sendOTP error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка отправки кода', 'Код жөнөтүүдө ката') });
  }
};

// ─── Parol tiklash OTP / Send reset OTP ──────────────────────────
exports.sendResetOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const clean = (phone || '').replace(/\D/g, '');

    if (clean.length !== 10 || !clean.startsWith('0')) {
      return res.status(400).json({ success: false, message: msg(req, 'Введите номер в формате 0XXXXXXXXX', 'Номерди 0XXXXXXXXX форматында киргизиңиз') });
    }

    const user = await User.findOne({ phone: clean });
    if (!user) {
      return res.status(404).json({ success: false, message: msg(req, 'Пользователь с таким номером не найден', 'Бул номер менен колдонуучу табылган жок') });
    }

    const recent = await OTP.findOne({ phone: `reset_${clean}`, createdAt: { $gt: new Date(Date.now() - 60 * 1000) } });
    if (recent) {
      return res.status(429).json({ success: false, message: msg(req, 'Подождите минуту перед повторной отправкой', 'Кайра жөнөтүү үчүн 1 мүнөт күтүңүз') });
    }

    await OTP.deleteMany({ phone: `reset_${clean}` });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await OTP.create({ phone: `reset_${clean}`, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    const intlPhone = `+996${clean.slice(1)}`;
    await sendSMS(intlPhone, `Hlopok: сброс пароля — код ${code}. Действует 5 минут.`);

    res.json({ success: true, message: msg(req, 'Код отправлен', 'Код жөнөтүлдү') });
  } catch (error) {
    console.error('sendResetOTP error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка отправки кода', 'Код жөнөтүүдө ката') });
  }
};

// ─── Parol tiklash (OTP + yangi parol) / Reset password via OTP ──
exports.resetPasswordByOTP = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    const clean = (phone || '').replace(/\D/g, '');

    if (!clean || !code || !newPassword) {
      return res.status(400).json({ success: false, message: msg(req, 'Заполните все поля', 'Бардык талааларды толтуруңуз') });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: msg(req, 'Пароль не менее 8 символов', 'Сырсөз кеминде 8 белги') });
    }

    const otp = await OTP.findOne({ phone: `reset_${clean}`, used: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!otp) {
      return res.status(400).json({ success: false, message: msg(req, 'Код не найден или истёк', 'Код табылган жок же мөөнөтү өттү') });
    }
    if (otp.code !== code.trim()) {
      return res.status(400).json({ success: false, message: msg(req, 'Неверный код', 'Код туура эмес') });
    }

    otp.used = true;
    await otp.save();

    const user = await User.findOne({ phone: clean });
    if (!user) {
      return res.status(404).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    }
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: msg(req, 'Пароль успешно изменён', 'Сырсөз ийгиликтүү өзгөртүлдү') });
  } catch (error) {
    console.error('resetPasswordByOTP error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сброса пароля', 'Сырсөздү калыбына келтирүүдө ката') });
  }
};

// ─── OTP tekshirish / Verify OTP ─────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, code } = req.body;
    const clean = (phone || '').replace(/\D/g, '');

    if (!clean || !code) {
      return res.status(400).json({ success: false, message: msg(req, 'Укажите номер и код', 'Номер жана кодду киргизиңиз') });
    }

    const otp = await OTP.findOne({ phone: clean, used: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({ success: false, message: msg(req, 'Код не найден или истёк', 'Код табылган жок же мөөнөтү өттү') });
    }
    if (otp.code !== code.trim()) {
      return res.status(400).json({ success: false, message: msg(req, 'Неверный код', 'Код туура эмес') });
    }

    otp.used = true;
    await otp.save();

    res.json({ success: true, message: msg(req, 'Номер подтверждён', 'Номер тастыкталды') });
  } catch (error) {
    console.error('verifyOTP error:', error);
    res.status(500).json({ success: false, message: msg(req, 'Ошибка проверки кода', 'Кодду текшерүүдө ката') });
  }
};
