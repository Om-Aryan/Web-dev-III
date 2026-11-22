const mongoose = require('mongoose');
const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true },
  semester: { type: Number, min: 1, max: 12, required: true },
  department: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
sectionSchema.index({ name: 1, academicYear: 1, semester: 1 }, { unique: true });
module.exports = mongoose.model('Section', sectionSchema);
