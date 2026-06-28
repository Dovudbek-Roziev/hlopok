// Do'kon sozlamalari routelari / Store settings routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { uploadSetting } = require('../middleware/upload');
const ctrl = require('../controllers/storeSettingsController');

router.get('/',           ctrl.getSettings);
router.put('/',           protect, adminOnly, ctrl.updateSettings);
router.post('/upload-qr',  protect, adminOnly, uploadSetting.single('image'), ctrl.uploadQRImage);
router.post('/upload-qr2', protect, adminOnly, uploadSetting.single('image'), ctrl.uploadQRImage2);

module.exports = router;
