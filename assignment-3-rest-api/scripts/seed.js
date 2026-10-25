// Sample data: 7 categories, 2 administrators, 3 students and 10 requests in every workflow state.
// Run: npm run seed   (WARNING: clears the existing collections first)
const mongoose = require('mongoose');
const { mongoUri } = require('../src/config/env');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const ServiceRequest = require('../src/models/ServiceRequest');
const Counter = require('../src/models/Counter');
const { STATUSES } = require('../src/utils/workflow');

const CATEGORIES = [
  ['IT Support', 'IT'], ['Maintenance', 'MNT'], ['Transport', 'TRN'], ['Library', 'LIB'],
  ['Lost & Found', 'LNF'], ['Classroom & Equipment', 'CLS'], ['Facility Services', 'FAC']
];

const USERS = [
  { key: 'admin', name: 'Campus Service Admin', email: 'admin@campus.edu', password: 'Admin@123', role: 'admin' },
  { key: 'itAdmin', name: 'IT Helpdesk Admin', email: 'it.admin@campus.edu', password: 'Admin@123', role: 'admin' },
  { key: 'ayesha', name: 'Ayesha Khan', email: 'ayesha@student.campus.edu', password: 'Student@123', role: 'student' },
  { key: 'shahzaib', name: 'Syed Shahzaib Haider Rizvi', email: 'shahzaib@student.campus.edu', password: 'Student@123', role: 'student' },
  { key: 'omar', name: 'Omar Farooq', email: 'omar@student.campus.edu', password: 'Student@123', role: 'student' }
];

// [student, category code, title, description, priority, final status, assignee]
const REQUESTS = [
  ['ayesha', 'IT', 'Wi-Fi drops in Lab 3', 'Wi-Fi keeps disconnecting every few minutes in Lab 3 of the CS block.', 'High', 'In Progress', 'itAdmin'],
  ['shahzaib', 'MNT', 'AC leaking in C-204', 'The air conditioner in room C-204 is leaking water onto the desks.', 'Medium', 'Assigned', 'admin'],
  ['omar', 'LIB', 'Book return not recorded', "I returned 'Clean Code' last week but the library system still shows it as issued.", 'Low', 'Closed', 'admin'],
  ['shahzaib', 'IT', 'Cannot log in to LMS', 'My LMS account shows "invalid credentials" even after a password reset.', 'Urgent', 'Submitted', null],
  ['ayesha', 'TRN', 'Bus route 4 is late', 'The route 4 bus has been 30-40 minutes late every morning this week.', 'Medium', 'Submitted', null],
  ['omar', 'CLS', 'Projector not working in B-101', 'The projector in lecture hall B-101 shows no signal with any laptop.', 'High', 'Resolved', 'itAdmin'],
  ['shahzaib', 'LNF', 'Lost student card', 'Lost my student card near the cafeteria on Monday, card number ends 050.', 'Medium', 'In Progress', 'admin'],
  ['ayesha', 'FAC', 'Water cooler empty', 'The water cooler on the 2nd floor of the library has been empty for two days.', 'Low', 'Resolved', 'admin'],
  ['omar', 'MNT', 'Broken chair in Lab 1', 'Two chairs in Lab 1 have broken backrests and are unsafe to use.', 'Low', 'Submitted', null],
  ['shahzaib', 'IT', 'Printer jam in library', 'The library printer jams on every double-sided print job.', 'Medium', 'Assigned', 'itAdmin']
];

async function seed() {
  await Promise.all([User.deleteMany(), Category.deleteMany(), ServiceRequest.deleteMany(), Counter.deleteMany()]);
  await Promise.all([User.syncIndexes(), Category.syncIndexes(), ServiceRequest.syncIndexes()]);

  const cats = Object.fromEntries((await Category.insertMany(CATEGORIES.map(([name, code]) => ({ name, code }))))
    .map(c => [c.code, c]));
  const users = {};
  for (const u of USERS) users[u.key] = await User.create(u); // create() runs the password-hashing hook

  let n = 100;
  const day = 24 * 3600 * 1000;
  const start = Date.now() - 12 * day;
  const docs = REQUESTS.map(([who, code, title, description, priority, finalStatus, assignee], i) => {
    const student = users[who];
    const created = new Date(start + i * day);
    const steps = STATUSES.slice(0, STATUSES.indexOf(finalStatus) + 1);
    const history = steps.map((status, k) => ({
      status,
      note: status === 'Submitted' ? 'Request submitted' : status === 'Assigned' ? `Assigned to ${users[assignee].name}` : `Status changed to ${status}`,
      by: status === 'Submitted' ? student.name : users[assignee].name,
      at: new Date(created.getTime() + k * 6 * 3600 * 1000)
    }));
    return {
      requestId: `REQ-${++n}`, title, description, priority, status: finalStatus,
      requesterName: student.name, category: cats[code]._id, createdBy: student._id,
      assignedTo: assignee ? users[assignee]._id : null, history, createdAt: created, updatedAt: history.at(-1).at
    };
  });
  await ServiceRequest.insertMany(docs, { timestamps: false });
  await Counter.create({ _id: 'serviceRequest', seq: n });
  console.log(`Seeded ${CATEGORIES.length} categories, ${USERS.length} users, ${docs.length} requests (REQ-101..REQ-${n})`);
}

if (require.main === module) {
  mongoose.connect(mongoUri).then(seed).then(() => mongoose.disconnect())
    .catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = seed;
