const router = require('express').Router();
const c = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.post('/mark', authorize('admin', 'faculty'), c.markAttendance);
router.get('/me', c.myAttendance);
router.get('/summary', c.attendanceSummary);
module.exports = router;
