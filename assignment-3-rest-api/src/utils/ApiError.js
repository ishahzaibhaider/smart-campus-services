class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

ApiError.badRequest = (m, code = 'BAD_REQUEST', details) => new ApiError(400, m, code, details);
ApiError.unauthorized = (m, code = 'UNAUTHORIZED') => new ApiError(401, m, code);
ApiError.forbidden = (m, code = 'FORBIDDEN') => new ApiError(403, m, code);
ApiError.notFound = (m, code = 'NOT_FOUND') => new ApiError(404, m, code);
ApiError.conflict = (m, code = 'CONFLICT') => new ApiError(409, m, code);
ApiError.unprocessable = (m, details) => new ApiError(422, m, 'VALIDATION_FAILED', details);

module.exports = ApiError;
