// Business rules for service requests (ownership, roles, workflow). Controllers stay thin.
const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const Category = require('../models/Category');
const User = require('../models/User');
const Counter = require('../models/Counter');
const ApiError = require('../utils/ApiError');
const { STATUSES, UNRESOLVED, canTransition, nextStatus } = require('../utils/workflow');

const POPULATE = [
  { path: 'category', select: 'name code' },
  { path: 'createdBy', select: 'name email' },
  { path: 'assignedTo', select: 'name email' }
];

const isAdmin = user => user.role === 'admin';
const isOwner = (user, doc) => String(doc.createdBy?._id ?? doc.createdBy) === user.id;

async function findRequest(idOrCode) {
  let doc;
  if (mongoose.isValidObjectId(idOrCode)) doc = await ServiceRequest.findById(idOrCode).populate(POPULATE);
  else if (/^REQ-\d+$/i.test(idOrCode)) doc = await ServiceRequest.findOne({ requestId: idOrCode.toUpperCase() }).populate(POPULATE);
  else throw ApiError.badRequest(`'${idOrCode}' is not a valid request id (use an ObjectId or REQ-101)`, 'INVALID_ID');
  if (!doc) throw ApiError.notFound(`Request ${idOrCode} not found`);
  return doc;
}

function assertCanView(user, doc) {
  if (!isAdmin(user) && !isOwner(user, doc)) throw ApiError.forbidden('You can only access your own requests');
}

async function assertCategory(id) {
  if (!(await Category.exists({ _id: id }))) throw ApiError.unprocessable('Validation failed', ['category does not exist']);
}

async function findAdmin(id) {
  const admin = await User.findOne({ _id: id, role: 'admin' });
  if (!admin) throw ApiError.unprocessable('Validation failed', ['assignedTo must be the id of a service administrator']);
  return admin;
}

function toPositiveInt(value, name, fallback, max) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) throw ApiError.badRequest(`${name} must be an integer between 1 and ${max}`);
  return n;
}

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function list(user, query) {
  const filter = isAdmin(user) ? {} : { createdBy: user.id }; // students only ever see their own
  for (const key of ['status', 'category', 'priority', 'q', 'assignedTo']) {
    if (query[key] !== undefined && typeof query[key] !== 'string') throw ApiError.badRequest(`${key} must be a single value`);
  }
  if (query.status) {
    if (!STATUSES.includes(query.status)) throw ApiError.badRequest(`status must be one of: ${STATUSES.join(', ')}`);
    filter.status = query.status;
  }
  if (query.category) {
    if (!mongoose.isValidObjectId(query.category)) throw ApiError.badRequest('category must be a category id');
    filter.category = query.category;
  }
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo && isAdmin(user)) filter.assignedTo = query.assignedTo === 'me' ? user.id : query.assignedTo;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q.slice(0, 100)), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { requestId: rx }, { requesterName: rx }];
  }
  const page = toPositiveInt(query.page, 'page', 1, 100000);
  const limit = toPositiveInt(query.limit, 'limit', 10, 100);
  const [data, total] = await Promise.all([
    ServiceRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(POPULATE),
    ServiceRequest.countDocuments(filter)
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

async function getOne(user, idOrCode) {
  const doc = await findRequest(idOrCode);
  assertCanView(user, doc);
  return doc;
}

async function create(user, { title, category, description, priority }) {
  await assertCategory(category);
  const requestId = `REQ-${await Counter.next('serviceRequest')}`;
  const doc = await ServiceRequest.create({
    requestId, title, category, description, priority,
    requesterName: user.name,
    createdBy: user.id,
    status: 'Submitted',
    history: [{ status: 'Submitted', note: 'Request submitted', by: user.name }]
  });
  return doc.populate(POPULATE);
}

// Moves a request one step forward. The update only succeeds if the status is still
// the one we checked, so two administrators cannot advance the same request twice.
async function changeStatus(user, idOrCode, status, note) {
  const doc = await findRequest(idOrCode);
  if (!STATUSES.includes(status)) throw ApiError.unprocessable('Validation failed', [`status must be one of: ${STATUSES.join(', ')}`]);
  if (!canTransition(doc.status, status)) {
    const next = nextStatus(doc.status);
    throw ApiError.conflict(
      `Cannot move from '${doc.status}' to '${status}'.${next ? ` The next allowed status is '${next}'.` : ' The request is already closed.'}`,
      'INVALID_TRANSITION');
  }
  if (status === 'Assigned' && !doc.assignedTo) {
    throw ApiError.conflict('Assign the request to an administrator before marking it Assigned', 'ASSIGNEE_REQUIRED');
  }
  const updated = await ServiceRequest.findOneAndUpdate(
    { _id: doc._id, status: doc.status },
    { $set: { status }, $push: { history: { status, note: note || `Status changed to ${status}`, by: user.name } } },
    { returnDocument: 'after' }
  ).populate(POPULATE);
  if (!updated) throw ApiError.conflict('The request was changed by someone else, reload and try again', 'STALE_STATUS');
  return updated;
}

async function assign(user, idOrCode, assignedTo, note) {
  const doc = await findRequest(idOrCode);
  if (['Resolved', 'Closed'].includes(doc.status)) {
    throw ApiError.conflict(`A ${doc.status.toLowerCase()} request cannot be reassigned`, 'REQUEST_FINISHED');
  }
  const admin = await findAdmin(assignedTo);
  const status = doc.status === 'Submitted' ? 'Assigned' : doc.status; // first assignment moves it forward
  const updated = await ServiceRequest.findOneAndUpdate(
    { _id: doc._id, status: doc.status },
    {
      $set: { assignedTo: admin._id, status },
      $push: { history: { status, note: note || `Assigned to ${admin.name}`, by: user.name } }
    },
    { returnDocument: 'after' }
  ).populate(POPULATE);
  if (!updated) throw ApiError.conflict('The request was changed by someone else, reload and try again', 'STALE_STATUS');
  return updated;
}

const STUDENT_FIELDS = ['title', 'category', 'description', 'priority'];

// PUT: students may edit the content of their own request while it is still Submitted;
// administrators may change priority/content, assign it and move the status forward.
async function update(user, idOrCode, body) {
  let doc = await findRequest(idOrCode);
  assertCanView(user, doc);

  if (!isAdmin(user)) {
    const forbidden = Object.keys(body).filter(k => !STUDENT_FIELDS.includes(k));
    if (forbidden.length) throw ApiError.forbidden(`Students cannot change: ${forbidden.join(', ')}`);
    if (doc.status !== 'Submitted') {
      throw ApiError.conflict(`Request is already ${doc.status}; it can no longer be edited`, 'REQUEST_LOCKED');
    }
  }

  const { status, assignedTo, note, ...content } = body;
  if (content.category) await assertCategory(content.category);
  if (Object.keys(content).length) {
    doc.set(content);
    await doc.save();
  }
  if (assignedTo && String(assignedTo) !== String(doc.assignedTo?._id ?? '')) doc = await assign(user, doc.requestId, assignedTo, note);
  if (status && status !== doc.status) doc = await changeStatus(user, doc.requestId, status, note);
  return doc.populate(POPULATE);
}

async function remove(user, idOrCode) {
  const doc = await findRequest(idOrCode);
  assertCanView(user, doc);
  if (!isAdmin(user) && doc.status !== 'Submitted') {
    throw ApiError.conflict(`Request is already ${doc.status}; only Submitted requests can be withdrawn`, 'REQUEST_LOCKED');
  }
  await doc.deleteOne();
}

// Aggregation pipelines for the admin dashboard
async function stats() {
  const [byStatusRaw, unresolvedRaw, byPriorityRaw, categories] = await Promise.all([
    ServiceRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ServiceRequest.aggregate([
      { $match: { status: { $in: UNRESOLVED } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: '$cat' },
      { $project: { _id: 0, categoryId: '$_id', category: '$cat.name', code: '$cat.code', count: 1 } },
      { $sort: { count: -1, category: 1 } }
    ]),
    ServiceRequest.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Category.find().sort({ name: 1 })
  ]);
  const byStatus = Object.fromEntries(STATUSES.map(s => [s, byStatusRaw.find(r => r._id === s)?.count || 0]));
  const byPriority = Object.fromEntries(ServiceRequest.PRIORITIES.map(p => [p, byPriorityRaw.find(r => r._id === p)?.count || 0]));
  // categories with no open requests are listed with 0
  const unresolvedByCategory = [
    ...unresolvedRaw,
    ...categories.filter(c => !unresolvedRaw.some(u => String(u.categoryId) === String(c._id)))
      .map(c => ({ categoryId: c._id, category: c.name, code: c.code, count: 0 }))
  ];
  return {
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    unresolved: UNRESOLVED.reduce((a, s) => a + byStatus[s], 0),
    byStatus, byPriority, unresolvedByCategory
  };
}

module.exports = { list, getOne, create, update, changeStatus, assign, remove, stats };
