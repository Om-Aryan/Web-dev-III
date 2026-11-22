const Course = require('../models/Course');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.listCourses = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.department) filter.department = req.query.department;
  if (req.query.faculty) filter.faculty = req.query.faculty;
  const courses = await Course.find(filter).populate('faculty', 'name email department').populate('section', 'name semester');
  success(res, 'Courses retrieved', courses);
});
exports.createCourse = asyncHandler(async (req, res) => {
  const { code, title, department, faculty, credits, description, section } = req.body;
  if (!code || !title || !department || !faculty) throw new ApiError(400, 'code, title, department and faculty are required');
  const facultyUser = await User.findById(faculty);
  if (!facultyUser || facultyUser.role !== 'faculty') throw new ApiError(400, 'A valid faculty user is required');
  const course = await Course.create({ code, title, department, faculty, credits, description, section });
  success(res, 'Course created', course, 201);
});
exports.getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('faculty', 'name email').populate('section', 'name');
  if (!course) throw new ApiError(404, 'Course not found');
  success(res, 'Course retrieved', course);
});
exports.updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!course) throw new ApiError(404, 'Course not found');
  success(res, 'Course updated', course);
});
exports.deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!course) throw new ApiError(404, 'Course not found');
  success(res, 'Course deactivated');
});
