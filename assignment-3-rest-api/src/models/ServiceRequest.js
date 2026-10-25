const mongoose = require('mongoose');
const { STATUSES } = require('../utils/workflow');

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const historySchema = new mongoose.Schema({
  status: { type: String, enum: STATUSES, required: true },
  note: { type: String, trim: true, maxlength: 500 },
  by: { type: String, required: true },
  at: { type: Date, default: Date.now }
}, { _id: false });

const serviceRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true }, // REQ-101
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  requesterName: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  priority: { type: String, enum: PRIORITIES, default: 'Medium' },
  status: { type: String, enum: STATUSES, default: 'Submitted', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  history: [historySchema]
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports.PRIORITIES = PRIORITIES;
