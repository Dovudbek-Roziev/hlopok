// Buyurtma modeli / Order model
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name_ru:     { type: String, required: true },
  name_ky:     { type: String, required: true },
  image:        { type: String },
  price:        { type: Number, required: true },
  size:         { type: String, required: true },
  color:        { type: String },
  qty:          { type: Number, required: true, min: 1 },
  promotionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
}, { _id: false });

const StatusHistorySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  comment:   { type: String, default: '' },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  // Buyurtma raqami / Order number
  orderNumber: {
    type: String,
    unique: true,
  },

  // Foydalanuvchi / User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Buyurtma elementlari / Order items
  items: [OrderItemSchema],

  deliveryType: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup',
  },

  // Mijoz kontakti / Contact info
  contactName:    { type: String, required: true },
  contactPhone:   { type: String, required: true },
  deliveryAddress: { type: String, default: '' },

  paymentMethod: {
    type: String,
    enum: ['cash', 'online'],
    default: 'cash',
  },
  paymentConfirmed:  { type: Boolean, default: false },
  finikPaymentId:   { type: String, default: '' },
  finikPaymentUrl:  { type: String, default: '' },

  // Narxlar / Prices
  subtotal:    { type: Number, required: true },
  bonusUsed:   { type: Number, default: 0 },
  bonusEarned: { type: Number, default: 0 },
  total:       { type: Number, required: true },

  // Holat / Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'cancelled'],
    default: 'pending',
  },

  // Holat tarixi / Status history
  statusHistory: [StatusHistorySchema],

  // Bekor qilish sababi / Cancellation reason
  cancelReason: { type: String, default: '' },

  // Izoh / Note
  note: { type: String, default: '', maxlength: 100 },

}, { timestamps: true });

// Buyurtma raqami avtomatik generatsiya / Auto-generate order number
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `HLP-${yy}${mm}${dd}-${rand}`;

    // Birinchi holat yozuvi / First status entry
    this.statusHistory = [{ status: this.status, timestamp: new Date() }];
  }
  next();
});

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ user: 1, status: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
