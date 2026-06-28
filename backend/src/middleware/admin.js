// Admin huquqi tekshirish / Admin role check middleware
const msg = require('../utils/msg');

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: msg(req, 'Доступ запрещён', 'Кирүүгө тыюу салынган') });
  }
  next();
};

module.exports = { adminOnly };
