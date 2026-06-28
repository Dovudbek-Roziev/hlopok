// Admin routelari / Admin routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const ctrl = require('../controllers/adminController');
const { runSeed } = require('../utils/seed');

router.get ('/users',              protect, adminOnly, ctrl.getUsers);
router.get ('/users/:id',          protect, adminOnly, ctrl.getUser);
router.put ('/users/:id/block',          protect, adminOnly, ctrl.toggleUserBlock);
router.put ('/users/:id/reset-password', protect, adminOnly, ctrl.resetUserPassword);
router.post('/push-broadcast',     protect, adminOnly, ctrl.pushBroadcast);
router.delete('/clear-all-data', protect, adminOnly, ctrl.clearAllData);
router.post('/seed',            protect, adminOnly, async (req, res) => {
  try {
    await runSeed();
    res.json({ success: true, message: 'Seed muvaffaqiyatli bajarildi' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
