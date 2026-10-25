const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const Category = require('../models/Category');
const User = require('../models/User');
const Counter = require('../models/Counter');
const { HttpError } = require('../middleware/errorHandler');

const POPULATE = [{ path: 'requester', select: 'name email type' }, { path: 'category', select: 'name code' }];
const EDITABLE = ['requester', 'category', 'description', 'priority', 'status'];

const pick = body => Object.fromEntries(EDITABLE.filter(k => body?.[k] !== undefined).map(k => [k, body[k]]));

async function checkReferences({ requester, category }) {
  const errors = [];
  if (requester !== undefined && !(mongoose.isValidObjectId(requester) && await User.exists({ _id: requester }))) errors.push('requester must be the id of an existing user');
  if (category !== undefined && !(mongoose.isValidObjectId(category) && await Category.exists({ _id: category }))) errors.push('category must be the id of an existing category');
  if (errors.length) throw new HttpError(422, 'Validation failed', errors);
}

async function findOr404(id) {
  const doc = await ServiceRequest.findById(id).populate(POPULATE);
  if (!doc) throw new HttpError(404, `Service request ${id} not found`);
  return doc;
}

// CREATE - POST /requests
exports.create = async (req, res) => {
  const data = pick(req.body);
  await checkReferences(data);
  const doc = await ServiceRequest.create({ ...data, requestId: `REQ-${await Counter.next('serviceRequest')}` });
  res.status(201).location(`/requests/${doc._id}`).json({ data: await doc.populate(POPULATE) });
};

// READ ALL - GET /requests?status=&category=&priority=
exports.list = async (req, res) => {
  const filter = {};
  for (const key of ['status', 'priority', 'category']) if (typeof req.query[key] === 'string') filter[key] = req.query[key];
  if (filter.category && !mongoose.isValidObjectId(filter.category)) throw new HttpError(400, 'category must be a category id');
  const data = await ServiceRequest.find(filter).sort({ date: -1 }).populate(POPULATE);
  res.json({ count: data.length, data });
};

// READ ONE - GET /requests/:id
exports.getOne = async (req, res) => res.json({ data: await findOr404(req.params.id) });

// UPDATE - PUT /requests/:id
exports.update = async (req, res) => {
  const data = pick(req.body);
  if (!Object.keys(data).length) throw new HttpError(400, `Send at least one of: ${EDITABLE.join(', ')}`);
  await checkReferences(data);
  const doc = await ServiceRequest.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after', runValidators: true }).populate(POPULATE);
  if (!doc) throw new HttpError(404, `Service request ${req.params.id} not found`);
  res.json({ data: doc });
};

// DELETE - DELETE /requests/:id
exports.remove = async (req, res) => {
  const doc = await ServiceRequest.findByIdAndDelete(req.params.id);
  if (!doc) throw new HttpError(404, `Service request ${req.params.id} not found`);
  res.status(204).end();
};

// AGGREGATION - GET /requests/stats/unresolved-by-category
// Number of unresolved requests (not Resolved/Closed) in each category
exports.unresolvedByCategory = async (req, res) => {
  const data = await ServiceRequest.aggregate([
    { $match: { status: { $nin: ['Resolved', 'Closed'] } } },
    { $group: { _id: '$category', unresolved: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, category: '$category.name', unresolved: 1 } },
    { $sort: { unresolved: -1, category: 1 } }
  ]);
  res.json({ data });
};
