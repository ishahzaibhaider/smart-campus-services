// Authentication (who are you?) and authorization (are you allowed?) middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { jwtSecret } = require('../config/env');

// Stateless: every request carries its own JWT, the server keeps no session
async function authenticate(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing token: send Authorization: Bearer <token>', 'TOKEN_MISSING'));
  }
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return next(ApiError.unauthorized(expired ? 'Token has expired, please log in again' : 'Invalid token',
      expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'));
  }
  const user = await User.findById(payload.sub);
  if (!user) return next(ApiError.unauthorized('User no longer exists', 'TOKEN_INVALID'));
  req.user = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  next();
}

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Not logged in'));
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`This action requires role: ${roles.join(' or ')}`));
  }
  next();
};

module.exports = { authenticate, authorize };
