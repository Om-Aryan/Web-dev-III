const Section = require('../models/Section');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.listSections = asyncHandler(async (req, res) => success(res, 'Sections retrieved', await Section.find().populate('students', 'name email studentId')));
exports.createSection = asyncHandler(async (req, res) => {
  const { name, academicYear, semester, department } = req.body;
  if (!name || !academicYear || !semester || !department) throw new ApiError(400, 'All section fields are required');
  success(res, 'Section created', await Section.create({ name, academicYear, semester, department }), 201);
});
exports.addStudent = asyncHandler(async (req, res) => {
  const [section, student] = await Promise.all([Section.findById(req.params.id), User.findById(req.body.studentId)]);
  if (!section) throw new ApiError(404, 'Section not found');
  if (!student || student.role !== 'student') throw new ApiError(400, 'Valid student required');
  if (section.students.some(id => id.equals(student._id))) throw new ApiError(409, 'Student already belongs to this section');
  section.students.push(student._id);
  await section.save();
  success(res, 'Student added to section', section);
});
exports.deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findByIdAndDelete(req.params.id);
  if (!section) throw new ApiError(404, 'Section not found');
  success(res, 'Section deleted');
});
