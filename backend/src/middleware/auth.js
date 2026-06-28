// JWT autentifikatsiya middleware / JWT authentication middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const msg = require('../utils/msg');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: msg(req, 'Авторизация требуется', 'Авторизация талап кылынат') });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: msg(req, 'Пользователь не найден', 'Колдонуучу табылган жок') });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: msg(req, 'Аккаунт заблокирован', 'Аккаунт бөгөттөлгөн') });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: msg(req, 'Недействительный токен', 'Токен жараксыз') });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    }
  } catch {}
  next();
};

module.exports = { protect, optionalAuth };
