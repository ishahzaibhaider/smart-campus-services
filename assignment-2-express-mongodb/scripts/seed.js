// Sample data: 7 categories, 5 users, 14 service requests. Run: npm run seed (clears the collections first)
const mongoose = require('mongoose');
const { mongoUri } = require('../src/config/env');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const ServiceRequest = require('../src/models/ServiceRequest');
const Counter = require('../src/models/Counter');

const CATEGORIES = [['IT Support', 'IT'], ['Maintenance', 'MNT'], ['Transport', 'TRN'], ['Library', 'LIB'],
  ['Lost & Found', 'LNF'], ['Classroom & Equipment', 'CLS'], ['Facility Services', 'FAC']];
const USERS = [
  { name: 'Ayesha Khan', email: 'ayesha@student.campus.edu', type: 'Student' },
  { name: 'Syed Shahzaib Haider Rizvi', email: 'shahzaib@student.campus.edu', type: 'Student' },
  { name: 'Omar Farooq', email: 'omar@student.campus.edu', type: 'Student' },
  { name: 'Dr. Sana Malik', email: 'sana.malik@campus.edu', type: 'Staff' },
  { name: 'Bilal Ahmed', email: 'bilal.ahmed@campus.edu', type: 'Staff' }
];
// [user index, category code, description, priority, status]
const REQUESTS = [
  [0, 'IT', 'Wi-Fi keeps disconnecting in Lab 3 of the CS block.', 'High', 'In Progress'],
  [1, 'IT', 'Cannot log in to the LMS after a password reset.', 'Urgent', 'Submitted'],
  [3, 'IT', 'Faculty printer on the 2nd floor shows a paper jam error.', 'Medium', 'Assigned'],
  [2, 'IT', 'Lab 2 PC 14 has no keyboard attached.', 'Low', 'Resolved'],
  [1, 'MNT', 'Air conditioner in room C-204 is leaking water.', 'Medium', 'Assigned'],
  [2, 'MNT', 'Two chairs in Lab 1 have broken backrests.', 'Low', 'Submitted'],
  [4, 'MNT', 'Ceiling light flickering in corridor B.', 'Low', 'Closed'],
  [0, 'TRN', 'Route 4 bus is 30-40 minutes late every morning.', 'Medium', 'Submitted'],
  [3, 'TRN', 'Staff van needed for the Friday seminar at 2 PM.', 'High', 'In Progress'],
  [2, 'LIB', "Return of 'Clean Code' not recorded in the system.", 'Low', 'Closed'],
  [0, 'LIB', 'Request access to the IEEE Xplore digital library.', 'Medium', 'Submitted'],
  [1, 'LNF', 'Lost student card near the cafeteria on Monday.', 'Medium', 'In Progress'],
  [2, 'CLS', 'Projector in B-101 shows no signal with any laptop.', 'High', 'Resolved'],
  [4, 'FAC', 'Water cooler on the library 2nd floor is empty.', 'Low', 'Submitted']
];

async function seed() {
  await Promise.all([User.deleteMany(), Category.deleteMany(), ServiceRequest.deleteMany(), Counter.deleteMany()]);
  await Promise.all([User.syncIndexes(), Category.syncIndexes(), ServiceRequest.syncIndexes()]);
  const cats = Object.fromEntries((await Category.insertMany(CATEGORIES.map(([name, code]) => ({ name, code })))).map(c => [c.code, c._id]));
  const users = await User.insertMany(USERS);
  const day = 24 * 3600 * 1000;
  await ServiceRequest.insertMany(REQUESTS.map(([u, code, description, priority, status], i) => ({
    requestId: `REQ-${101 + i}`, requester: users[u]._id, category: cats[code], description, priority, status,
    date: new Date(Date.now() - (REQUESTS.length - i) * day)
  })));
  await Counter.create({ _id: 'serviceRequest', seq: 100 + REQUESTS.length });
  console.log(`Seeded ${CATEGORIES.length} categories, ${USERS.length} users, ${REQUESTS.length} service requests`);
}

if (require.main === module) {
  mongoose.connect(mongoUri).then(seed).then(() => mongoose.disconnect()).catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = seed;
