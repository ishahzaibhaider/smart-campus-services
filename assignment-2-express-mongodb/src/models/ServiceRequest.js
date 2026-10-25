const mongoose = require('mongoose');

const STATUSES = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Schema = the shape and rules of a document; the model (below) is the class used for CRUD
const serviceRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },                     // REQ-101
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'requester is required'] },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'category is required'] },
  description: { type: String, required: [true, 'description is required'], trim: true, minlength: [10, 'description must be at least 10 characters'], maxlength: 2000 },
  priority: { type: String, enum: { values: PRIORITIES, message: `priority must be one of: ${PRIORITIES.join(', ')}` }, default: 'Medium' },
  status: { type: String, enum: { values: STATUSES, message: `status must be one of: ${STATUSES.join(', ')}` }, default: 'Submitted' },
  date: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });

serviceRequestSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
