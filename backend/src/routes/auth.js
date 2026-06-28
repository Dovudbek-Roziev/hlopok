// Autentifikatsiya routelari / Auth routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const ctrl = require('../controllers/authController');
const { uploadAvatar } = require('../middleware/upload');

router.post('/send-otp',                ctrl.sendOTP);
router.post('/verify-otp',              ctrl.verifyOTP);
router.post('/register',                ctrl.register);
router.post('/login',                   ctrl.login);
router.post('/send-reset-otp',          ctrl.sendResetOTP);
router.post('/reset-password',          ctrl.resetPasswordByOTP);
// Faqat admin foydalanuvchi parolini tiklashi mumkin
router.post('/reset-password-by-phone', protect, adminOnly, ctrl.resetPasswordByPhone);

router.get ('/me',                          protect, ctrl.getMe);
router.put ('/profile',                     protect, ctrl.updateProfile);
router.put ('/change-password',             protect, ctrl.changePassword);
router.put ('/change-email',                protect, ctrl.changeEmail);
router.post('/avatar',                     protect, uploadAvatar.single('avatar'), ctrl.uploadAvatar);
router.get ('/favorites',                   protect, ctrl.getFavorites);
router.post('/favorites/:productId',        protect, ctrl.toggleFavorite);
router.post('/addresses',                   protect, ctrl.addAddress);
router.delete('/addresses/:addressId',      protect, ctrl.deleteAddress);
router.put('/push-token',                   protect, ctrl.savePushToken);

module.exports = router;
