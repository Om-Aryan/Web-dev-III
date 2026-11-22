const router = require('express').Router();
const c = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect, authorize('admin', 'faculty'));
router.get('/low-attendance', c.lowAttendance);
router.get('/course-enrolment', c.courseEnrollment);
module.exports = router;
