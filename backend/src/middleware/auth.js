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
      return res.status(403).json({ success: false, code: 'ACCOUNT_BLOCKED', message: msg(req, 'Аккаунт заблокирован', 'Аккаунт бөгөттөлгөн') });
    }
    if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      return res.status(401).json({ success: false, message: msg(req, 'Войдите заново', 'Кайра кириңиз') });
    }

    req.user = user;
    next();
  } catch (error) {
    const status = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name) ? 401 : 503;
    return res.status(status).json({ success: false, message: msg(req, status === 401 ? 'Недействительный токен' : 'Сервис временно недоступен', status === 401 ? 'Токен жараксыз' : 'Кызмат убактылуу жеткиликсиз') });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive && (user.tokenVersion || 0) === (decoded.tokenVersion || 0)) req.user = user;
    }
  } catch {}
  next();
};

module.exports = { protect, optionalAuth };
