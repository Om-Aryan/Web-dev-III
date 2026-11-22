const router = require('express').Router();
const c = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.get('/', c.listAnnouncements);
router.post('/', authorize('admin', 'faculty'), c.createAnnouncement);
router.delete('/:id', authorize('admin'), c.deleteAnnouncement);
module.exports = router;
