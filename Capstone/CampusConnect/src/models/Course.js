const mongoose = require('mongoose');
const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, maxlength: 1000 },
  credits: { type: Number, min: 1, max: 10, default: 3 },
  department: { type: String, required: true, trim: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
courseSchema.index({ department: 1, isActive: 1 });
module.exports = mongoose.model('Course', courseSchema);
