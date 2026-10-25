// Starts the server on a copy of the seed data and checks every route. Run: npm test
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3999;
const dataFile = path.join(os.tmpdir(), `a1-requests-${Date.now()}.json`);
fs.copyFileSync(path.join(__dirname, '..', 'data', 'requests.seed.json'), dataFile);

const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
  env: { ...process.env, PORT, DATA_FILE: dataFile }, stdio: ['ignore', 'pipe', 'inherit']
});

const BASE = `http://localhost:${PORT}`;
let failed = 0;
const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failed++; };
const call = async (method, p, body) => {
  const res = await fetch(BASE + p, { method, headers: { 'Content-Type': 'application/json' }, body });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json, text, headers: res.headers };
};

async function run() {
  let r = await call('GET', '/requests');
  check(r.status === 200 && r.json.count === 3, 'GET /requests returns the 3 seeded requests');
  r = await call('GET', '/requests?category=it%20support');
  check(r.status === 200 && r.json.count === 1 && r.json.data[0].id === 'REQ-101', 'GET /requests?category= filters (URL module)');
  r = await call('GET', '/requests/REQ-102');
  check(r.status === 200 && r.json.data.status === 'In Progress', 'GET /requests/REQ-102 returns one request');
  r = await call('GET', '/requests/REQ-999');
  check(r.status === 404, 'unknown request id -> 404');
  r = await call('GET', '/requests/abc');
  check(r.status === 400, 'malformed request id -> 400');
  r = await call('POST', '/requests', JSON.stringify({ name: 'Ali Raza', category: 'transport', description: 'Bus route 4 was late by 40 minutes today.', priority: 'urgent' }));
  check(r.status === 201 && r.json.data.id === 'REQ-104' && r.json.data.status === 'Submitted' && r.json.data.category === 'Transport' && r.headers.get('location') === '/requests/REQ-104', 'POST /requests creates REQ-104 (201 + Location)');
  r = await call('GET', '/requests/REQ-104');
  check(r.status === 200, 'new request is readable from the file');
  const onDisk = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  check(onDisk.length === 4 && onDisk[3].id === 'REQ-104', 'new request was written to the JSON file');
  r = await call('POST', '/requests', JSON.stringify({ name: 'X', category: 'Food', priority: 'Now' }));
  check(r.status === 422 && r.json.error.details.length === 4, 'invalid body -> 422 with 4 validation messages');
  r = await call('POST', '/requests', '{bad json');
  check(r.status === 400, 'malformed JSON -> 400');
  r = await call('DELETE', '/requests/REQ-101');
  check(r.status === 405 && r.headers.get('allow') === 'GET', 'unsupported method -> 405 with Allow header');
  r = await call('GET', '/students');
  check(r.status === 404 && r.json.error.message.includes('not found'), 'invalid URL -> 404 JSON');
  r = await call('GET', '/requests/export');
  check(r.status === 200 && JSON.parse(r.text).length === 4, 'GET /requests/export streams the file');
  const many = await Promise.all(Array.from({ length: 5 }, (_, i) => call('POST', '/requests', JSON.stringify({ name: `Student ${i}`, category: 'Library', description: 'Concurrent request number ' + i, priority: 'Low' }))));
  const ids = many.map(m => m.json.data.id);
  check(new Set(ids).size === 5 && JSON.parse(fs.readFileSync(dataFile, 'utf8')).length === 9, `5 simultaneous POSTs get unique ids (${ids.join(', ')}) and none are lost`);
}

server.stdout.once('data', () => run()
  .catch(err => { console.error(err); failed++; })
  .finally(() => { server.kill(); fs.rmSync(dataFile, { force: true }); console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed'); process.exit(failed ? 1 : 0); }));
