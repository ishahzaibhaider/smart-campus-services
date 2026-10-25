const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// Every error leaves the API in one shape: { error: { status, message, code, details? } }
function toApiError(err) {
  if (err instanceof ApiError) return err;
  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Request body is not valid JSON', 'INVALID_JSON');
  if (err.type === 'entity.too.large') return new ApiError(413, 'Request body is too large', 'PAYLOAD_TOO_LARGE');
  if (err instanceof mongoose.Error.ValidationError) {
    return ApiError.unprocessable('Validation failed', Object.values(err.errors).map(e => e.message));
  }
  if (err instanceof mongoose.Error.CastError) return ApiError.badRequest(`Invalid value for ${err.path}`, 'INVALID_ID');
  if (err.code === 11000) {
    return ApiError.conflict(`${Object.keys(err.keyValue || {}).join(', ')} already exists`, 'DUPLICATE');
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  let e = toApiError(err);
  if (!e) {
    console.error(err);
    e = new ApiError(500, 'Internal server error', 'INTERNAL');
  }
  const body = { status: e.status, message: e.message, code: e.code };
  if (e.details) body.details = e.details;
  res.status(e.status).json({ error: body });
};
