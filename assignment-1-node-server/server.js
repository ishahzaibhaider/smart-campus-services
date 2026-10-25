// Assignment 1 - Service Request Server using ONLY Node.js core modules.
// No Express, no MongoDB: http + url + fs + events + streams.
const http = require('http');
const router = require('./src/router');
const { logRequest } = require('./src/logger');

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => logRequest(req, res, started)); // 'finish' is an event of the response stream
  try {
    await router.handle(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) router.sendError(res, 500, 'Internal server error');
  }
});

server.listen(PORT, () => {
  console.log(`Service Request Server running on http://localhost:${PORT}`);
  console.log('  GET  /requests            list (filters: ?category=&status=&priority=)');
  console.log('  GET  /requests/:id        one request, e.g. /requests/REQ-101');
  console.log('  POST /requests            create (JSON body)');
  console.log('  GET  /requests/export     download the raw JSON file (streamed)');
});

module.exports = server;
