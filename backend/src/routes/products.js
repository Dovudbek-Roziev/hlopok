// Mahsulot routelari / Product routes
const express = require('express');
const router  = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly }   = require('../middleware/admin');
const { uploadProduct } = require('../middleware/upload');
const ctrl       = require('../controllers/productController');
const reviewCtrl = require('../controllers/reviewController');

router.get ('/',           optionalAuth, ctrl.getProducts);
router.get ('/:id',        optionalAuth, ctrl.getProduct);
router.post('/bulk-archive', protect, adminOnly, ctrl.bulkArchiveProducts);
router.post('/',           protect, adminOnly, uploadProduct.array('images', 4), ctrl.createProduct);
router.put ('/:id',        protect, adminOnly, uploadProduct.array('images', 4), ctrl.updateProduct);
router.patch('/:id/visibility', protect, adminOnly, ctrl.setProductVisibility);
router.delete('/:id',      protect, adminOnly, ctrl.deleteProduct);
router.put ('/:id/stock',  protect, adminOnly, ctrl.updateStock);

// Reviews
router.post('/:id/reviews/:reviewId/report', protect, reviewCtrl.reportReview);
router.get ('/:id/reviews',                 optionalAuth, reviewCtrl.getProductReviews);
router.get ('/:id/reviews/can',             protect, reviewCtrl.canReview);
router.post('/:id/reviews',                 protect, reviewCtrl.createReview);
router.delete('/:id/reviews/:reviewId',     protect, adminOnly, reviewCtrl.deleteReview);

module.exports = router;
