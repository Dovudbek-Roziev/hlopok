// Buyurtma routelari / Order routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const ctrl = require('../controllers/orderController');

const dangerousAdminOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DANGEROUS_ADMIN_ACTIONS === 'true') return next();
  return res.status(403).json({ success: false, message: 'Опасное действие отключено в production' });
};

router.post('/',                    protect, ctrl.createOrder);
router.get ('/my',                  protect, ctrl.getMyOrders);
router.get ('/pending-ratings',     protect, ctrl.getPendingRatings);
router.get ('/my/:id',              protect, ctrl.getOrder);
router.put ('/my/:id/cancel',       protect, ctrl.cancelMyOrder);
router.get ('/dashboard',           protect, adminOnly, ctrl.getDashboardStats);
router.get ('/all',                 protect, adminOnly, ctrl.getAllOrders);
router.put ('/:id/status',          protect, adminOnly, ctrl.updateOrderStatus);
router.put ('/:id/confirm-payment', protect, adminOnly, ctrl.confirmPayment);
router.delete('/all',              protect, adminOnly, dangerousAdminOnly, ctrl.clearOrders);
router.delete('/clear-all-stats',  protect, adminOnly, dangerousAdminOnly, ctrl.clearAllStats);

module.exports = router;
