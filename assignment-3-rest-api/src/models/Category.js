const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Category', categorySchema);
