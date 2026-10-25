// Logging with events and a writable file stream (logs/activity.log)
const fs = require('fs');
const path = require('path');
const events = require('./events');

const LOG_DIR = path.join(__dirname, '..', 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });
const activityLog = fs.createWriteStream(path.join(LOG_DIR, 'activity.log'), { flags: 'a' });

function logRequest(req, res, started) {
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  const line = `${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode} ${ms.toFixed(1)}ms`;
  console.log(line);
  activityLog.write(line + '\n');
}

events.on('request:created', request => {
  const line = `${request.date} NEW ${request.id} [${request.category}/${request.priority}] by ${request.name}`;
  console.log(`  -> event request:created ${request.id}`);
  activityLog.write(line + '\n');
});

module.exports = { logRequest };
