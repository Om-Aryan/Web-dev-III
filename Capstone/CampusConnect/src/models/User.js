const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['admin', 'faculty', 'student'], default: 'student', index: true },
  phone: { type: String, trim: true, maxlength: 20 },
  department: { type: String, trim: true },
  studentId: { type: String, sparse: true, unique: true },
  facultyId: { type: String, sparse: true, unique: true },
  isActive: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 },
  refreshTokenHash: { type: String, select: false }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, Number(process.env.BCRYPT_ROUNDS) || 12);
  next();
});
userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
userSchema.index({ role: 1, department: 1 });
module.exports = mongoose.model('User', userSchema);
