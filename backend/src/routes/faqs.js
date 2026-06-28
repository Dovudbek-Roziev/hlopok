const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const ctrl = require('../controllers/faqController');

router.get('/',        ctrl.getAll);
router.get('/admin',   protect, adminOnly, ctrl.getAll_admin);
router.post('/',       protect, adminOnly, ctrl.create);
router.put('/:id',     protect, adminOnly, ctrl.update);
router.delete('/:id',  protect, adminOnly, ctrl.remove);

module.exports = router;
