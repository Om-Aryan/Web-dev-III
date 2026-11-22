const router = require('express').Router();
const c = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.get('/', c.listEnrollments);
router.post('/', authorize('admin'), c.enroll);
router.patch('/:id/drop', authorize('admin'), c.dropEnrollment);
module.exports = router;
