const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const eventBus = require('../events/eventBus');

exports.markAttendance = asyncHandler(async (req, res) => {
  const { course, section, date, records } = req.body;
  if (!course || !section || !date || !Array.isArray(records) || !records.length) throw new ApiError(400, 'course, section, date and non-empty records are required');
  const courseDoc = await Course.findById(course);
  if (!courseDoc) throw new ApiError(404, 'Course not found');
  if (req.user.role === 'faculty' && !courseDoc.faculty.equals(req.user._id)) throw new ApiError(403, 'You are not assigned to this course');
  const sessionDate = new Date(date);
  if (Number.isNaN(sessionDate.getTime())) throw new ApiError(400, 'Invalid date');
  const ids = records.map(r => r.student);
  const enrolled = await Enrollment.find({ student: { $in: ids }, course, section, status: 'active' }).select('student');
  const enrolledSet = new Set(enrolled.map(e => e.student.toString()));
  const invalid = ids.filter(id => !enrolledSet.has(String(id)));
  if (invalid.length) throw new ApiError(400, 'Every student must be actively enrolled in this course and section', invalid);
  const ops = records.map(r => {
    if (!['present', 'absent', 'late'].includes(r.status)) throw new ApiError(400, 'Attendance status must be present, absent or late');
    return { updateOne: { filter: { student: r.student, course, date: sessionDate }, update: { $set: { student: r.student, course, section, date: sessionDate, status: r.status, note: r.note, faculty: courseDoc.faculty, updatedBy: req.user._id } }, upsert: true } };
  });
  await Attendance.bulkWrite(ops);
  eventBus.emit('attendance-marked', { course, section, date: sessionDate, count: records.length });
  success(res, 'Attendance saved', { count: records.length }, 201);
});

exports.myAttendance = asyncHandler(async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user._id : req.query.student;
  if (!studentId) throw new ApiError(400, 'student query parameter is required');
  const match = { student: studentId };
  if (req.query.course) match.course = req.query.course;
  const rows = await Attendance.find(match).populate('course', 'code title').sort({ date: -1 });
  success(res, 'Attendance records retrieved', rows);
});

exports.attendanceSummary = asyncHandler(async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user._id : req.query.student;
  if (!studentId) throw new ApiError(400, 'student query parameter is required');
  const summary = await Attendance.aggregate([
    { $match: { student: require('mongoose').Types.ObjectId.createFromHexString(String(studentId)) } },
    { $group: { _id: '$course', totalClasses: { $sum: 1 }, attended: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } },
    { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    { $project: { _id: 0, courseId: '$course._id', courseCode: '$course.code', courseTitle: '$course.title', totalClasses: 1, attended: 1, percentage: { $round: [{ $multiply: [{ $divide: ['$attended', '$totalClasses'] }, 100] }, 2] } } }
  ]);
  success(res, 'Attendance summary generated', summary);
});
