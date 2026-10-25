// Manual URL-based routing: this is the work Express will do for us in Assignment 2.
const store = require('./requestStore');
const { validateNewRequest, isValidId } = require('./validators');

const MAX_BODY = 1024 * 1024; // 1 MB

function send(res, status, body, headers = {}) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(json);
}

function sendError(res, status, message, extra = {}) {
  send(res, status, { error: { status, message, ...extra } });
}

// Reads the request body from the incoming stream chunk by chunk
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Request body is too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) return reject(Object.assign(new Error('Request body is empty'), { status: 400 }));
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error('Request body is not valid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function methodNotAllowed(res, allowed) {
  send(res, 405, { error: { status: 405, message: 'Method not allowed', allowed } }, { Allow: allowed.join(', ') });
}

async function handle(req, res) {
  // URL module: split the path from the query string
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean); // "/requests/REQ-101" -> ['requests', 'REQ-101']

  if (path === '/') {
    return send(res, 200, {
      name: 'Smart Campus Service Request Server (Assignment 1)',
      endpoints: ['GET /requests', 'GET /requests/:id', 'POST /requests', 'GET /requests/export']
    });
  }

  if (parts[0] !== 'requests' || parts.length > 2) {
    return sendError(res, 404, `Route ${req.method} ${url.pathname} not found`);
  }

  // /requests
  if (parts.length === 1) {
    if (req.method === 'GET') {
      const filters = Object.fromEntries(url.searchParams); // ?category=IT%20Support&status=Submitted
      const requests = await store.findAll(filters);
      return send(res, 200, { count: requests.length, data: requests });
    }
    if (req.method === 'POST') {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        return sendError(res, err.status || 400, err.message);
      }
      const { errors, value } = validateNewRequest(body);
      if (errors.length) return sendError(res, 422, 'Validation failed', { details: errors });
      const created = await store.create(value);
      return send(res, 201, { data: created }, { Location: `/requests/${created.id}` });
    }
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  // /requests/export - streams the JSON file straight to the client
  if (parts[1] === 'export') {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="requests.json"'
    });
    return store.createExportStream().pipe(res);
  }

  // /requests/:id
  const id = decodeURIComponent(parts[1]).toUpperCase();
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isValidId(id)) {
    return sendError(res, 400, `'${parts[1]}' is not a valid request ID (expected format REQ-101)`);
  }
  const request = await store.findById(id);
  if (!request) return sendError(res, 404, `Request ${id} not found`);
  return send(res, 200, { data: request });
}

module.exports = { handle, sendError };
