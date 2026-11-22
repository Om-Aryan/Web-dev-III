const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.lowAttendance = asyncHandler(async (req, res) => {
  const threshold = Math.min(100, Math.max(0, Number(req.query.threshold) || Number(process.env.ATTENDANCE_LOW_THRESHOLD) || 75));
  const rows = await Attendance.aggregate([
    { $group: { _id: { student: '$student', course: '$course' }, total: { $sum: 1 }, attended: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } },
    { $addFields: { percentage: { $multiply: [{ $divide: ['$attended', '$total'] }, 100] } } },
    { $match: { percentage: { $lt: threshold } } },
    { $lookup: { from: 'users', localField: '_id.student', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $lookup: { from: 'courses', localField: '_id.course', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    { $project: { studentName: '$student.name', studentEmail: '$student.email', courseCode: '$course.code', courseTitle: '$course.title', totalClasses: '$total', attended: 1, percentage: { $round: ['$percentage', 2] } } },
    { $sort: { percentage: 1 } }
  ]);
  success(res, `Students below ${threshold}% attendance`, rows);
});

exports.courseEnrollment = asyncHandler(async (req, res) => {
  const rows = await Enrollment.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$course', enrolledStudents: { $sum: 1 } } },
    { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    { $project: { _id: 0, courseId: '$course._id', code: '$course.code', title: '$course.title', department: '$course.department', enrolledStudents: 1 } },
    { $sort: { enrolledStudents: -1 } }
  ]);
  success(res, 'Course enrolment report generated', rows);
});
