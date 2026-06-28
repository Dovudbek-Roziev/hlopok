// Banner routelari / Banner routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { uploadBanner } = require('../middleware/upload');
const ctrl = require('../controllers/bannerController');

router.get ('/',      ctrl.getBanners);
router.get ('/all',   protect, adminOnly, ctrl.getAllBanners);
router.post('/',      protect, adminOnly, uploadBanner.single('image'), ctrl.createBanner);
router.put ('/:id',   protect, adminOnly, uploadBanner.single('image'), ctrl.updateBanner);
router.delete('/:id', protect, adminOnly, ctrl.deleteBanner);

module.exports = router;
