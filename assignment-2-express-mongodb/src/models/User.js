const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email is not valid'] },
  type: { type: String, enum: ['Student', 'Staff'], default: 'Student' }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('User', userSchema);
