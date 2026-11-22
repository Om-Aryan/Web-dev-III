const router = require('express').Router();
const c = require('../controllers/sectionController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.get('/', c.listSections);
router.post('/', authorize('admin'), c.createSection);
router.post('/:id/students', authorize('admin'), c.addStudent);
router.delete('/:id', authorize('admin'), c.deleteSection);
module.exports = router;
