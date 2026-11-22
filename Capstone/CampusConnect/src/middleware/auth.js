const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET); }
  catch { throw new ApiError(401, 'Invalid or expired access token'); }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Account unavailable');
  req.user = user;
  next();
});

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};
