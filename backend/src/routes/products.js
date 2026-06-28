// Mahsulot routelari / Product routes
const express = require('express');
const router  = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly }   = require('../middleware/admin');
const { uploadProduct } = require('../middleware/upload');
const ctrl       = require('../controllers/productController');
const reviewCtrl = require('../controllers/reviewController');

router.get ('/',           optionalAuth, ctrl.getProducts);
router.get ('/low-stock',  protect, adminOnly, ctrl.getLowStockProducts);
router.get ('/:id',        optionalAuth, ctrl.getProduct);
router.post('/',           protect, adminOnly, uploadProduct.array('images', 10), ctrl.createProduct);
router.put ('/:id',        protect, adminOnly, uploadProduct.array('images', 10), ctrl.updateProduct);
router.delete('/:id',      protect, adminOnly, ctrl.deleteProduct);
router.put ('/:id/stock',  protect, adminOnly, ctrl.updateStock);

// Reviews
router.get ('/:id/reviews',                 reviewCtrl.getProductReviews);
router.get ('/:id/reviews/can',             protect, reviewCtrl.canReview);
router.post('/:id/reviews',                 protect, reviewCtrl.createReview);
router.delete('/:id/reviews/:reviewId',     protect, adminOnly, reviewCtrl.deleteReview);

module.exports = router;
