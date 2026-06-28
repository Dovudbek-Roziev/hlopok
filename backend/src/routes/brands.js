// Brend routelari / Brand routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { uploadBrand } = require('../middleware/upload');
const ctrl = require('../controllers/brandController');

router.get ('/',      ctrl.getBrands);
router.get ('/all',   protect, adminOnly, ctrl.getAllBrands);
router.post('/',      protect, adminOnly, uploadBrand.single('logo'), ctrl.createBrand);
router.put ('/:id',   protect, adminOnly, uploadBrand.single('logo'), ctrl.updateBrand);
router.delete('/:id', protect, adminOnly, ctrl.deleteBrand);

module.exports = router;
