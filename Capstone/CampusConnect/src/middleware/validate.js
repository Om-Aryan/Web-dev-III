const ApiError = require('../utils/apiError');
exports.required = (...fields) => (req, res, next) => {
  const missing = fields.filter(field => req.body[field] === undefined || req.body[field] === '');
  if (missing.length) return next(new ApiError(400, `Missing required fields: ${missing.join(', ')}`));
  next();
};
