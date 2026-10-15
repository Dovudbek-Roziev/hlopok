// Admin routelari / Admin routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const ctrl = require('../controllers/adminController');
const reviewCtrl = require('../controllers/reviewController');
router.get('/reviews', protect, adminOnly, reviewCtrl.getModeration);
router.put('/reviews/:reviewId', protect, adminOnly, reviewCtrl.moderate);
const { runSeed } = require('../utils/seed');

const dangerousAdminOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DANGEROUS_ADMIN_ACTIONS === 'true') return next();
  return res.status(403).json({ success: false, message: 'Опасное действие отключено в production' });
};

router.get ('/users',              protect, adminOnly, ctrl.getUsers);
router.get ('/users/:id',          protect, adminOnly, ctrl.getUser);
router.put ('/users/:id/block',          protect, adminOnly, ctrl.toggleUserBlock);
router.put ('/users/:id/reset-password', protect, adminOnly, ctrl.resetUserPassword);
router.post('/push-broadcast',     protect, adminOnly, ctrl.pushBroadcast);
router.delete('/clear-all-data', protect, adminOnly, dangerousAdminOnly, ctrl.clearAllData);
router.post('/seed',            protect, adminOnly, dangerousAdminOnly, async (req, res) => {
  try {
    await runSeed();
    res.json({ success: true, message: 'Seed muvaffaqiyatli bajarildi' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
