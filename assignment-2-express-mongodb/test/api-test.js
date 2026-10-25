// CRUD + aggregation + A1 import test on a fresh in-memory MongoDB. Run: npm test
const { MongoMemoryServer } = require('mongodb-memory-server');

let failed = 0, passed = 0;
const check = (ok, label) => { ok ? passed++ : failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); };

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('smart_campus_a2_test');
  process.env.PORT = '4998';
  const server = await require('../src/server')();
  await require('../scripts/seed')();
  const B = 'http://localhost:4998';
  const call = async (method, p, body, raw) => {
    const res = await fetch(B + p, { method, headers: { 'Content-Type': 'application/json' }, body: raw ?? (body && JSON.stringify(body)) });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };
  try {
    const cats = (await call('GET', '/categories')).body.data;
    const users = (await call('GET', '/users')).body.data;
    check(cats.length === 7 && users.length === 5, 'Categories and Users collections are seeded');

    let r = await call('GET', '/requests');
    check(r.status === 200 && r.body.count === 14 && r.body.data[0].category.name && r.body.data[0].requester.name, 'GET /requests lists 14 with populated requester + category');
    r = await call('GET', '/requests?status=Submitted');
    check(r.body.count === 5 && r.body.data.every(x => x.status === 'Submitted'), 'filter by status');

    const lib = cats.find(c => c.code === 'LIB');
    r = await call('POST', '/requests', { requester: users[0]._id, category: lib._id, description: 'Need a quiet study room booking for Friday.', priority: 'Low' });
    const created = r.body.data;
    check(r.status === 201 && created.requestId === 'REQ-115' && created.status === 'Submitted', 'POST creates REQ-115 (201)');
    r = await call('GET', `/requests/${created._id}`);
    check(r.status === 200 && r.body.data.requestId === 'REQ-115', 'GET /requests/:id');
    r = await call('PUT', `/requests/${created._id}`, { status: 'In Progress', priority: 'High' });
    check(r.status === 200 && r.body.data.status === 'In Progress' && r.body.data.priority === 'High', 'PUT updates status + priority');
    r = await call('PUT', `/requests/${created._id}`, { status: 'Done' });
    check(r.status === 422 && r.body.error.details[0].includes('status must be one of'), 'PUT with invalid status -> 422 (runValidators)');
    r = await call('POST', '/requests', { requester: '000000000000000000000000', category: lib._id, description: 'short' });
    check(r.status === 422 && r.body.error.details.length === 1, 'unknown requester -> 422');
    r = await call('POST', '/requests', { requester: users[0]._id, category: lib._id, description: 'tiny' });
    check(r.status === 422 && r.body.error.details[0].includes('at least 10'), 'schema validation (minlength) -> 422');
    r = await call('POST', '/requests', null, '{bad');
    check(r.status === 400, 'malformed JSON -> 400');
    r = await call('GET', '/requests/123');
    check(r.status === 400, 'malformed id -> 400');
    r = await call('GET', '/requests/000000000000000000000000');
    check(r.status === 404, 'unknown id -> 404');
    r = await call('DELETE', `/requests/${created._id}`);
    check(r.status === 204, 'DELETE -> 204');
    r = await call('DELETE', `/requests/${created._id}`);
    check(r.status === 404, 'DELETE again -> 404');

    r = await call('GET', '/requests/stats/unresolved-by-category');
    const agg = Object.fromEntries(r.body.data.map(x => [x.category, x.unresolved]));
    check(r.status === 200 && agg['IT Support'] === 3 && agg['Maintenance'] === 2 && agg['Transport'] === 2 && !('Classroom & Equipment' in agg),
      `aggregation unresolved by category: ${JSON.stringify(agg)}`);

    r = await call('POST', '/categories', { name: 'Hostel', code: 'HST' });
    check(r.status === 201, 'POST /categories');
    r = await call('POST', '/categories', { name: 'Hostel', code: 'HS2' });
    check(r.status === 409, 'duplicate category -> 409');
    r = await call('GET', '/nope');
    check(r.status === 404 && r.body.error.message.includes('not found'), 'unknown route -> 404');

    const imported = await require('../scripts/import-from-a1')(process.env.MONGODB_URI.replace('smart_campus_a2_test', 'a1_import_test'));
    check(imported === 3, 'Assignment 1 JSON file imported with the MongoDB driver (3 requests)');
  } catch (err) { console.error(err); failed++; }
  console.log(`\n${passed} passed, ${failed} failed`);
  server.close();
  await require('mongoose').disconnect();
  await mongod.stop();
  process.exit(failed ? 1 : 0);
})();
