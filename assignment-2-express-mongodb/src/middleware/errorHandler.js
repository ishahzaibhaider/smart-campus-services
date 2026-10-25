const mongoose = require('mongoose');

class HttpError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

// One JSON error format for the whole app: { error: { status, message, details? } }
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message;
  let details = err.details;
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Request body is not valid JSON'; }
  else if (err instanceof mongoose.Error.ValidationError) {
    status = 422; message = 'Validation failed'; details = Object.values(err.errors).map(e => e.message);
  } else if (err instanceof mongoose.Error.CastError) { status = 400; message = `Invalid value for ${err.path}`; }
  else if (err.code === 11000) { status = 409; message = `${Object.keys(err.keyValue).join(', ')} already exists`; }
  else if (status === 500) { console.error(err); message = 'Internal server error'; }
  res.status(status).json({ error: { status, message, ...(details && { details }) } });
}

module.exports = { errorHandler, HttpError };
