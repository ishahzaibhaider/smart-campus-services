// Persists service requests in data/requests.json using the File System module.
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const events = require('./events');

const FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'requests.json');

async function readAll() {
  try {
    const text = await fsp.readFile(FILE, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err.code === 'ENOENT') { // first run: create an empty file
      await fsp.mkdir(path.dirname(FILE), { recursive: true });
      await fsp.writeFile(FILE, '[]\n');
      return [];
    }
    throw err;
  }
}

// Write to a temporary file, then rename: a crash can never leave a half-written JSON file
async function writeAll(requests) {
  const tmp = `${FILE}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(requests, null, 2) + '\n');
  await fsp.rename(tmp, FILE);
}

// Writes are queued one after another, so two POSTs at the same moment cannot overwrite each other
let queue = Promise.resolve();
function serialise(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

const matches = (value, wanted) => !wanted || String(value).toLowerCase() === String(wanted).toLowerCase();

async function findAll(filters = {}) {
  const all = await readAll();
  return all.filter(r =>
    matches(r.category, filters.category) && matches(r.status, filters.status) && matches(r.priority, filters.priority));
}

async function findById(id) {
  const all = await readAll();
  return all.find(r => r.id === id) || null;
}

function create(data) {
  return serialise(async () => {
    const all = await readAll();
    const lastNumber = all.reduce((max, r) => Math.max(max, Number(r.id.split('-')[1]) || 0), 100);
    const request = {
      id: `REQ-${lastNumber + 1}`,
      name: data.name,
      category: data.category,
      description: data.description,
      priority: data.priority,
      date: new Date().toISOString(),
      status: 'Submitted'
    };
    all.push(request);
    await writeAll(all);
    events.emit('request:created', request); // event-driven: listeners react to the new request
    return request;
  });
}

function createExportStream() {
  return fs.createReadStream(FILE);
}

module.exports = { findAll, findById, create, createExportStream, FILE };
