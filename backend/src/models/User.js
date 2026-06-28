// Foydalanuvchi modeli / User model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  city:      { type: String, default: 'Ош' },
  street:    { type: String, required: true },
  apartment: String,
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema({
  // Asosiy ma'lumotlar / Basic info
  phone: {
    type: String,
    trim: true,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  birthDate: { type: Date },

  // Rol / Role
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  // Til / Language
  language: {
    type: String,
    enum: ['ru', 'ky'],
    default: 'ru',
  },

  // Faol/bloklangan / Active/blocked
  isActive: { type: Boolean, default: true },

  // Sevimlilar / Favorite products
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Yetkazish manzillari / Delivery addresses
  addresses: [AddressSchema],

  // Bonus balansi / Bonus balance (real KGZ som)
  bonusBalance: { type: Number, default: 0, min: 0 },

  // Jami tejaldi / Total saved with bonuses
  totalSaved: { type: Number, default: 0 },

  // Do'konda ko'rsatish uchun QR kod / QR code for in-store bonus
  qrCode: String,

  // QR kod ichidagi matn (skaner uchun) / Raw QR data for scanning
  qrData: { type: String, default: '' },

  // Avatar (Cloudinary URL)
  avatar: { type: String, default: '' },

  // Expo Push Token — mobil ilova bildirishnomalar uchun
  pushToken: { type: String, default: '' },

}, { timestamps: true });

// Parolni saqlashdan oldin hash qilish / Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Parolni tekshirish / Check password
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// To'liq ism / Full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', UserSchema);
