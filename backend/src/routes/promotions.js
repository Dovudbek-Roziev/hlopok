// Aksiya routelari / Promotion routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { uploadPromotion } = require('../middleware/upload');
const ctrl = require('../controllers/promotionController');

router.get ('/all',   protect, adminOnly, ctrl.getAllPromotions);
router.get ('/',      ctrl.getPromotions);
router.get ('/:id',   ctrl.getPromotion);
router.post('/',      protect, adminOnly, uploadPromotion.single('image'), ctrl.createPromotion);
router.put ('/:id',   protect, adminOnly, uploadPromotion.single('image'), ctrl.updatePromotion);
router.delete('/:id', protect, adminOnly, ctrl.deletePromotion);

module.exports = router;
