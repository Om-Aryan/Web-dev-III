const router = require('express').Router();
const c = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
router.get('/', protect, c.listCourses);
router.get('/:id', protect, c.getCourse);
router.post('/', protect, authorize('admin'), c.createCourse);
router.patch('/:id', protect, authorize('admin'), c.updateCourse);
router.delete('/:id', protect, authorize('admin'), c.deleteCourse);
module.exports = router;
