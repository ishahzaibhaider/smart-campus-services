// End-to-end API test on a fresh in-memory MongoDB. Run: npm test
process.env.AUTH_RATE_LIMIT = '1000'; // the rate limit is tested separately below
const { MongoMemoryServer } = require('mongodb-memory-server');

let failed = 0, passed = 0;
const check = (ok, label) => { ok ? passed++ : failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); };

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('smart_campus_test');
  process.env.PORT = '4999';
  const start = require('../src/server');
  const server = await start();
  await require('../scripts/seed')();
  const B = 'http://localhost:4999/api';

  const call = async (method, path, { token, body, raw, origin } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (origin) headers.Origin = origin;
    const res = await fetch(B + path, { method, headers, body: raw ?? (body && JSON.stringify(body)) });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
  };
  const login = async (email, password) => (await call('POST', '/auth/login', { body: { email, password } })).body;

  try {
    // ---- authentication ----
    let r = await call('POST', '/auth/login', { body: { email: 'admin@campus.edu', password: 'wrong-pass' } });
    check(r.status === 401 && r.body.error.code === 'INVALID_CREDENTIALS', 'wrong password -> 401 INVALID_CREDENTIALS');
    const admin = await login('admin@campus.edu', 'Admin@123');
    const ayesha = await login('ayesha@student.campus.edu', 'Student@123');
    const shahzaib = await login('shahzaib@student.campus.edu', 'Student@123');
    check(admin.user.role === 'admin' && ayesha.user.role === 'student' && typeof admin.token === 'string', 'login returns JWT + user with role');
    r = await call('POST', '/auth/register', { body: { name: 'New Student', email: 'new@student.campus.edu', password: 'Password1' } });
    check(r.status === 201 && r.body.user.role === 'student', 'register -> 201, role forced to student');
    r = await call('POST', '/auth/register', { body: { name: 'Dup', email: 'new@student.campus.edu', password: 'Password1' } });
    check(r.status === 409 && r.body.error.code === 'EMAIL_TAKEN', 'duplicate email -> 409');
    r = await call('POST', '/auth/register', { body: { name: 'X', email: 'bad', password: '1' } });
    check(r.status === 422 && r.body.error.details.length === 3, 'invalid registration -> 422 with 3 messages');
    r = await call('POST', '/auth/register', { body: { name: 'Hacker', email: 'h@x.com', password: 'Password1', role: 'admin' } });
    check(r.status === 400 && r.body.error.code === 'UNKNOWN_FIELD', 'cannot register as admin (unknown field role -> 400)');
    r = await call('GET', '/auth/me', { token: ayesha.token });
    check(r.status === 200 && r.body.user.email === 'ayesha@student.campus.edu', 'GET /auth/me with token');

    // ---- authentication middleware ----
    r = await call('GET', '/requests');
    check(r.status === 401 && r.body.error.code === 'TOKEN_MISSING', 'no token -> 401 TOKEN_MISSING');
    r = await call('GET', '/requests', { token: 'abc.def.ghi' });
    check(r.status === 401 && r.body.error.code === 'TOKEN_INVALID', 'bad token -> 401 TOKEN_INVALID');
    const expired = require('jsonwebtoken').sign({ sub: ayesha.user.id }, require('../src/config/env').jwtSecret, { expiresIn: -10 });
    r = await call('GET', '/requests', { token: expired });
    check(r.status === 401 && r.body.error.code === 'TOKEN_EXPIRED', 'expired token -> 401 TOKEN_EXPIRED');

    // ---- authorization ----
    r = await call('GET', '/stats', { token: ayesha.token });
    check(r.status === 403, 'student cannot read /stats -> 403');
    r = await call('GET', '/users?role=admin', { token: ayesha.token });
    check(r.status === 403, 'student cannot list users -> 403');

    // ---- reading ----
    r = await call('GET', '/requests', { token: ayesha.token });
    check(r.status === 200 && r.body.total === 3 && r.body.data.every(x => x.createdBy.email === 'ayesha@student.campus.edu'), 'student sees only own requests (3)');
    r = await call('GET', '/requests?limit=4&page=2', { token: admin.token });
    check(r.status === 200 && r.body.total === 10 && r.body.data.length === 4 && r.body.totalPages === 3, 'admin sees all 10, paginated');
    r = await call('GET', '/requests?status=Submitted', { token: admin.token });
    check(r.body.total === 3 && r.body.data.every(x => x.status === 'Submitted'), 'filter by status');
    const cats = (await call('GET', '/categories')).body.data;
    const it = cats.find(c => c.code === 'IT');
    r = await call('GET', `/requests?category=${it._id}`, { token: admin.token });
    check(r.body.total === 3 && r.body.data.every(x => x.category.code === 'IT'), 'filter by category');
    r = await call('GET', '/requests?status=Done', { token: admin.token });
    check(r.status === 400, 'invalid status filter -> 400');
    r = await call('GET', '/requests/REQ-101', { token: ayesha.token });
    check(r.status === 200 && r.body.data.requestId === 'REQ-101' && r.body.data.history.length === 3, 'GET by REQ code with history');
    r = await call('GET', '/requests/REQ-102', { token: ayesha.token });
    check(r.status === 403, "student cannot view another student's request -> 403");
    r = await call('GET', '/requests/REQ-999', { token: admin.token });
    check(r.status === 404, 'unknown request -> 404');
    r = await call('GET', '/requests/not-an-id', { token: admin.token });
    check(r.status === 400 && r.body.error.code === 'INVALID_ID', 'malformed id -> 400');

    // ---- creating ----
    r = await call('POST', '/requests', { token: shahzaib.token, body: { title: 'Lab PC keyboard missing', category: it._id, description: 'PC 14 in Lab 2 has no keyboard attached.', priority: 'high' } });
    const created = r.body.data;
    check(r.status === 201 && created.requestId === 'REQ-111' && created.status === 'Submitted' && created.priority === 'High' && r.headers.get('location') === '/api/requests/REQ-111', 'student creates REQ-111 (201, Submitted, Location)');
    r = await call('POST', '/requests', { token: shahzaib.token, body: { title: 'x', category: 'nope', description: 'short' } });
    check(r.status === 422 && r.body.error.details.length === 3, 'invalid request body -> 422 with details');
    r = await call('POST', '/requests', { token: shahzaib.token, raw: '{bad' });
    check(r.status === 400 && r.body.error.code === 'INVALID_JSON', 'malformed JSON -> 400');
    r = await call('POST', '/requests', { token: shahzaib.token, body: { title: 'Injection', category: { $ne: null }, description: 'trying a NoSQL operator in category' } });
    check(r.status === 422, 'NoSQL operator in body is stripped -> 422 category required');

    // ---- updating (PUT) ----
    r = await call('PUT', '/requests/REQ-111', { token: shahzaib.token, body: { description: 'PC 14 in Lab 2 has no keyboard and no mouse.' } });
    check(r.status === 200 && r.body.data.description.includes('no mouse'), 'owner edits own Submitted request');
    r = await call('PUT', '/requests/REQ-111', { token: shahzaib.token, body: { status: 'Closed' } });
    check(r.status === 403, 'student cannot change status -> 403');
    r = await call('PUT', '/requests/REQ-111', { token: ayesha.token, body: { title: 'Hijack attempt' } });
    check(r.status === 403, "student cannot edit someone else's request -> 403");
    r = await call('PUT', '/requests/REQ-102', { token: shahzaib.token, body: { title: 'AC still leaking' } });
    check(r.status === 409 && r.body.error.code === 'REQUEST_LOCKED', 'student cannot edit once Assigned -> 409 REQUEST_LOCKED');

    // ---- workflow ----
    const admins = (await call('GET', '/users?role=admin', { token: admin.token })).body.data;
    const itAdmin = admins.find(a => a.email === 'it.admin@campus.edu');
    r = await call('PATCH', '/requests/REQ-111/status', { token: admin.token, body: { status: 'Resolved' } });
    check(r.status === 409 && r.body.error.code === 'INVALID_TRANSITION', 'skipping steps (Submitted -> Resolved) -> 409 INVALID_TRANSITION');
    r = await call('PATCH', '/requests/REQ-111/status', { token: admin.token, body: { status: 'Assigned' } });
    check(r.status === 409 && r.body.error.code === 'ASSIGNEE_REQUIRED', 'Assigned without an assignee -> 409');
    r = await call('PATCH', '/requests/REQ-111/assign', { token: shahzaib.token, body: { assignedTo: itAdmin._id } });
    check(r.status === 403, 'student cannot assign -> 403');
    r = await call('PATCH', '/requests/REQ-111/assign', { token: admin.token, body: { assignedTo: ayesha.user.id } });
    check(r.status === 422, 'cannot assign to a student -> 422');
    r = await call('PATCH', '/requests/REQ-111/assign', { token: admin.token, body: { assignedTo: itAdmin._id } });
    check(r.status === 200 && r.body.data.status === 'Assigned' && r.body.data.assignedTo.email === 'it.admin@campus.edu', 'admin assigns -> status becomes Assigned');
    r = await call('PUT', '/requests/REQ-111', { token: admin.token, body: { status: 'In Progress', note: 'Technician on the way' } });
    check(r.status === 200 && r.body.data.status === 'In Progress' && r.body.data.history.at(-1).note === 'Technician on the way', 'admin PUT moves to In Progress with note');
    const both = await Promise.all([1, 2].map(() => call('PATCH', '/requests/REQ-111/status', { token: admin.token, body: { status: 'Resolved' } })));
    check(both.filter(x => x.status === 200).length === 1 && both.filter(x => x.status === 409).length === 1, 'two admins resolve at once -> exactly one succeeds');
    r = await call('PATCH', '/requests/REQ-111/status', { token: admin.token, body: { status: 'In Progress' } });
    check(r.status === 409, 'going backwards (Resolved -> In Progress) -> 409');
    r = await call('PATCH', '/requests/REQ-111/status', { token: admin.token, body: { status: 'Closed' } });
    check(r.status === 200 && r.body.data.history.map(h => h.status).join('>') === 'Submitted>Assigned>In Progress>Resolved>Closed', 'full workflow recorded in history');
    r = await call('PATCH', '/requests/REQ-111/status', { token: admin.token, body: { status: 'Closed' } });
    check(r.status === 409, 'closed request cannot move -> 409');

    // ---- deleting ----
    r = await call('DELETE', '/requests/REQ-102', { token: shahzaib.token });
    check(r.status === 409, 'student cannot withdraw an Assigned request -> 409');
    r = await call('DELETE', '/requests/REQ-104', { token: shahzaib.token });
    check(r.status === 204, 'student withdraws own Submitted request -> 204');
    r = await call('DELETE', '/requests/REQ-104', { token: shahzaib.token });
    check(r.status === 404, 'deleting again -> 404 (DELETE is idempotent: state unchanged)');
    r = await call('DELETE', '/requests/REQ-103', { token: admin.token });
    check(r.status === 204, 'admin deletes any request -> 204');

    // ---- statistics (aggregation) ----
    r = await call('GET', '/stats', { token: admin.token });
    const s = r.body.data;
    check(r.status === 200 && s.total === 9 && s.byStatus.Closed === 1 && s.unresolvedByCategory.length === 7, `stats: total ${s.total}, unresolved ${s.unresolved}, byStatus ${JSON.stringify(s.byStatus)}`);
    check(s.unresolvedByCategory.reduce((a, c) => a + c.count, 0) === s.unresolved, 'unresolved-per-category adds up to the unresolved total');

    // ---- CORS / security headers / 404 ----
    r = await call('GET', '/categories', { origin: 'http://localhost:4200' });
    check(r.headers.get('access-control-allow-origin') === 'http://localhost:4200', 'CORS allows the Angular origin');
    r = await call('GET', '/categories', { origin: 'http://evil.example' });
    check(!r.headers.get('access-control-allow-origin'), 'CORS does not allow an unknown origin');
    check(r.headers.get('x-content-type-options') === 'nosniff' && !r.headers.get('x-powered-by'), 'helmet security headers, no X-Powered-By');
    r = await call('GET', '/nothing');
    check(r.status === 404 && r.body.error.code === 'ROUTE_NOT_FOUND', 'unknown route -> 404 JSON');
  } catch (err) {
    console.error(err);
    failed++;
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  server.close();
  await require('mongoose').disconnect();
  await mongod.stop();
  process.exit(failed ? 1 : 0);
})();
