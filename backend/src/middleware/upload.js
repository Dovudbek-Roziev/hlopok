const multer = require('multer');

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Только изображения разрешены'), false);
};

const memoryStorage = multer.memoryStorage();

module.exports = {
  uploadProduct:   multer({ storage: memoryStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
  uploadBrand:     multer({ storage: memoryStorage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }),
  uploadBanner:    multer({ storage: memoryStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
  uploadPromotion: multer({ storage: memoryStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
  uploadAvatar:    multer({ storage: memoryStorage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }),
  uploadSetting:   multer({ storage: memoryStorage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } }),
};
