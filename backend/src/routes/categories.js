// Kategoriya routelari / Category routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const ctrl = require('../controllers/categoryController');

router.get ('/',     ctrl.getCategories);
router.get ('/all',  protect, adminOnly, ctrl.getAllCategories);
router.post('/',     protect, adminOnly, ctrl.createCategory);
router.put ('/:id',  protect, adminOnly, ctrl.updateCategory);
router.delete('/:id',protect, adminOnly, ctrl.deleteCategory);

module.exports = router;
