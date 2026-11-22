const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

exports.listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  const [users, total] = await Promise.all([
    User.find(filter).select('-password -refreshTokenHash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);
  success(res, 'Users retrieved', { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, studentId, facultyId, phone } = req.body;
  if (!name || !email || !password || !role) throw new ApiError(400, 'name, email, password and role are required');
  if (!['admin', 'faculty', 'student'].includes(role)) throw new ApiError(400, 'Invalid role');
  const user = await User.create({ name, email, password, role, department, studentId, facultyId, phone });
  success(res, 'User created', { id: user._id, name, email, role }, 201);
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokenHash');
  if (!user) throw new ApiError(404, 'User not found');
  success(res, 'User retrieved', user);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'department', 'isActive'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password -refreshTokenHash');
  if (!user) throw new ApiError(404, 'User not found');
  success(res, 'User updated', user);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  success(res, 'User deleted');
});

exports.updateMe = asyncHandler(async (req, res) => {
  ['name', 'phone'].forEach(k => { if (req.body[k] !== undefined) req.user[k] = req.body[k]; });
  await req.user.save();
  success(res, 'Profile updated', { id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role });
});
