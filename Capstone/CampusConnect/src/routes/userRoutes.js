const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.get('/me', c.updateMe);
router.patch('/me', c.updateMe);
router.route('/').get(authorize('admin'), c.listUsers).post(authorize('admin'), c.createUser);
router.route('/:id').get(authorize('admin'), c.getUser).patch(authorize('admin'), c.updateUser).delete(authorize('admin'), c.deleteUser);
module.exports = router;
