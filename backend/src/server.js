require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./utils/db');
const initSocket = require('./socket');

// Routelar / Routes
const authRoutes          = require('./routes/auth');
const productRoutes       = require('./routes/products');
const orderRoutes         = require('./routes/orders');
const categoryRoutes      = require('./routes/categories');
const bonusRoutes         = require('./routes/bonus');
const bannerRoutes        = require('./routes/banners');
const brandRoutes         = require('./routes/brands');
const promotionRoutes     = require('./routes/promotions');
const storeSettingsRoutes = require('./routes/storeSettings');
const adminRoutes         = require('./routes/admin');
const faqRoutes           = require('./routes/faqs');

const app = express();
const server = http.createServer(app);

// Ruxsat berilgan originlar / Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:19006',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  process.env.ADMIN_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: ruxsat yo\'q'));
    }
  },
  credentials: true,
};

// Socket.io — Render da websocket + polling, Vercel da faqat polling
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  transports: process.env.VERCEL ? ['polling'] : ['websocket', 'polling'],
});
app.set('io', io);
initSocket(io);

// Render/proxy orqali ishlaydi
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(require('./middleware/language'));

// DB ulanishini har so'rovda tekshirish (serverless uchun)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB ulanish xatosi' });
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Слишком много запросов. Попробуйте позже.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Слишком много попыток. Подождите 15 минут.' },
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API routelari
app.use('/api/auth',           authRoutes);
app.use('/api/products',       productRoutes);
app.use('/api/orders',         orderRoutes);
app.use('/api/categories',     categoryRoutes);
app.use('/api/bonus',          bonusRoutes);
app.use('/api/banners',        bannerRoutes);
app.use('/api/brands',         brandRoutes);
app.use('/api/promotions',     promotionRoutes);
app.use('/api/store-settings', storeSettingsRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/faqs',           faqRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  const lang = req.lang || 'ru';
  res.status(404).json({ success: false, message: lang === 'ky' ? 'Маршрут табылган жок' : 'Маршрут не найден' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  const lang = req.lang || 'ru';
  res.status(500).json({ success: false, message: lang === 'ky' ? 'Сервер катасы' : 'Ошибка сервера' });
});

// Vercel: app ni export qilamiz, lokal: server.listen
if (process.env.VERCEL) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 5000;
  const startServer = async () => {
    await connectDB();
    const initCron = require('./utils/cron');
    initCron();
    server.listen(PORT, () => {
      console.log(`Server ishga tushdi: http://localhost:${PORT}`);
    });
  };
  startServer();
}
