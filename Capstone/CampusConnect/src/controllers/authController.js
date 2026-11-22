const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { signAccessToken, signRefreshToken, hashToken } = require('../utils/tokens');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, department, studentId, facultyId } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  if (password.length < 8) throw new ApiError(400, 'Password must contain at least 8 characters');
  // Public registration is restricted to student accounts. Admin creates staff accounts.
  const user = await User.create({ name, email, password, role: 'student', phone, department, studentId });
  success(res, 'Student account created', { id: user._id, name: user.name, email: user.email, role: user.role }, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokenHash');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is disabled');
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  success(res, 'Login successful', { user: { id: user._id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token is required');
  let payload;
  try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
  catch { throw new ApiError(401, 'Invalid or expired refresh token'); }
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || user.tokenVersion !== payload.tokenVersion || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, 'Refresh token has been revoked');
  }
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });
  success(res, 'Tokens refreshed', { accessToken: newAccessToken, refreshToken: newRefreshToken });
});

exports.logout = asyncHandler(async (req, res) => {
  req.user.refreshTokenHash = undefined;
  req.user.tokenVersion += 1;
  await req.user.save({ validateBeforeSave: false });
  success(res, 'Logged out successfully');
});

exports.me = asyncHandler(async (req, res) => {
  success(res, 'Current user', { user: req.user });
});
