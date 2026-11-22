require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Section = require('../models/Section');
const Enrollment = require('../models/Enrollment');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User.deleteMany({}), Course.deleteMany({}), Section.deleteMany({}), Enrollment.deleteMany({})]);
  const [admin, faculty, student1, student2] = await User.create([
    { name: 'Campus Admin', email: 'admin@campusconnect.edu', password: 'Admin@12345', role: 'admin' },
    { name: 'Dr. Asha Sharma', email: 'faculty@campusconnect.edu', password: 'Faculty@12345', role: 'faculty', department: 'Computer Science', facultyId: 'FAC001' },
    { name: 'Aarav Student', email: 'student1@campusconnect.edu', password: 'Student@12345', role: 'student', department: 'Computer Science', studentId: 'STU001' },
    { name: 'Diya Student', email: 'student2@campusconnect.edu', password: 'Student@12345', role: 'student', department: 'Computer Science', studentId: 'STU002' }
  ]);
  const section = await Section.create({ name: 'CSE-A', academicYear: '2026-27', semester: 3, department: 'Computer Science', students: [student1._id, student2._id] });
  const course = await Course.create({ code: 'CSE301', title: 'Data Structures and Algorithms', department: 'Computer Science', faculty: faculty._id, section: section._id, credits: 4 });
  await Enrollment.create([{ student: student1._id, course: course._id, section: section._id }, { student: student2._id, course: course._id, section: section._id }]);
  console.log('Seed complete. Demo logins:');
  console.log('Admin: admin@campusconnect.edu / Admin@12345');
  console.log('Faculty: faculty@campusconnect.edu / Faculty@12345');
  console.log('Student: student1@campusconnect.edu / Student@12345');
  await mongoose.disconnect();
}
seed().catch(async e => { console.error(e); await mongoose.disconnect(); process.exit(1); });
