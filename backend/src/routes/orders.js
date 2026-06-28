// Buyurtma routelari / Order routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const ctrl = require('../controllers/orderController');

router.post('/',                    protect, ctrl.createOrder);
router.get ('/my',                  protect, ctrl.getMyOrders);
router.get ('/pending-ratings',     protect, ctrl.getPendingRatings);
router.get ('/my/:id',              protect, ctrl.getOrder);
router.put ('/my/:id/cancel',       protect, ctrl.cancelMyOrder);
router.get ('/dashboard',           protect, adminOnly, ctrl.getDashboardStats);
router.get ('/all',                 protect, adminOnly, ctrl.getAllOrders);
router.put ('/:id/status',          protect, adminOnly, ctrl.updateOrderStatus);
router.put ('/:id/confirm-payment', protect, adminOnly, ctrl.confirmPayment);
router.delete('/all',              protect, adminOnly, ctrl.clearOrders);
router.delete('/clear-all-stats',  protect, adminOnly, ctrl.clearAllStats);

module.exports = router;
