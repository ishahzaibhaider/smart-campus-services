const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email is not valid']
  },
  password: { type: String, required: true, minlength: 8, select: false }, // bcrypt hash, never returned
  role: { type: String, enum: ['student', 'admin'], default: 'student' }
}, { timestamps: true, versionKey: false });

userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.password; return ret; }
});

module.exports = mongoose.model('User', userSchema);
