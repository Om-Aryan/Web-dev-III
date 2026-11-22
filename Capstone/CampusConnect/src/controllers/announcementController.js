const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const eventBus = require('../events/eventBus');

exports.createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, audience = 'university', course, section } = req.body;
  if (!title || !message) throw new ApiError(400, 'Title and message are required');
  if (!['university', 'course', 'section'].includes(audience)) throw new ApiError(400, 'Invalid audience');
  if (audience === 'course' && !course) throw new ApiError(400, 'Course is required for course announcements');
  if (audience === 'section' && !section) throw new ApiError(400, 'Section is required for section announcements');
  if (req.user.role === 'faculty') {
    if (audience !== 'course') throw new ApiError(403, 'Faculty may publish course announcements only');
    const owned = await Course.findOne({ _id: course, faculty: req.user._id });
    if (!owned) throw new ApiError(403, 'You are not assigned to this course');
  }
  const announcement = await Announcement.create({ title, message, audience, course, section, createdBy: req.user._id });
  eventBus.emit('announcement-created', announcement);
  success(res, 'Announcement published', announcement, 201);
});
exports.listAnnouncements = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.course) filter.$or = [{ audience: 'university' }, { audience: 'course', course: req.query.course }];
  if (req.query.section) filter.$or = [...(filter.$or || []), { audience: 'section', section: req.query.section }];
  success(res, 'Announcements retrieved', await Announcement.find(filter).populate('createdBy', 'name role').sort({ publishedAt: -1 }));
});
exports.deleteAnnouncement = asyncHandler(async (req, res) => {
  const a = await Announcement.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!a) throw new ApiError(404, 'Announcement not found');
  success(res, 'Announcement archived');
});
