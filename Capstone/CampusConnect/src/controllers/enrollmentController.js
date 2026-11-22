const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Section = require('../models/Section');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.enroll = asyncHandler(async (req, res) => {
  const { student, course, section } = req.body;
  const [courseDoc, sectionDoc] = await Promise.all([Course.findById(course), Section.findById(section)]);
  if (!courseDoc || !sectionDoc) throw new ApiError(404, 'Course or section not found');
  if (courseDoc.section && !courseDoc.section.equals(sectionDoc._id)) throw new ApiError(400, 'Course is not assigned to this section');
  const enrollment = await Enrollment.create({ student, course, section });
  success(res, 'Student enrolled', enrollment, 201);
});
exports.listEnrollments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.student) filter.student = req.query.student;
  if (req.query.course) filter.course = req.query.course;
  if (req.user.role === 'student') filter.student = req.user._id;
  const rows = await Enrollment.find(filter).populate('student', 'name studentId').populate('course', 'code title').populate('section', 'name');
  success(res, 'Enrollments retrieved', rows);
});
exports.dropEnrollment = asyncHandler(async (req, res) => {
  const row = await Enrollment.findByIdAndUpdate(req.params.id, { status: 'dropped' }, { new: true });
  if (!row) throw new ApiError(404, 'Enrollment not found');
  success(res, 'Enrollment dropped', row);
});
