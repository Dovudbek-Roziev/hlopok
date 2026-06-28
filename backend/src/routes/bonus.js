// Bonus routelari / Bonus routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const ctrl = require('../controllers/bonusController');

router.get ('/my',           protect, ctrl.getMyBonusHistory);
router.get ('/settings',     ctrl.getSettings);
router.put ('/settings',     protect, adminOnly, ctrl.updateSettings);
router.post('/add',          protect, adminOnly, ctrl.addBonusManual);
router.post('/find-by-qr',   protect, adminOnly, ctrl.findByQR);
router.post('/extend',       protect, adminOnly, ctrl.extendExpiry);
router.get ('/transactions', protect, adminOnly, ctrl.getAllTransactions);

module.exports = router;
