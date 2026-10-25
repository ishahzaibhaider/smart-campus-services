const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const publicUser = u => ({ id: String(u._id), name: u.name, email: u.email, role: u.role });

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role, name: user.name }, jwtSecret, { expiresIn: jwtExpiresIn });
}

// Self-registration always creates a STUDENT; administrators are created by the seed script
async function register({ name, email, password }) {
  if (await User.exists({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }
  const user = await User.create({ name, email, password, role: 'student' });
  return { token: signToken(user), user: publicUser(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  // same message for "no such user" and "wrong password", so emails cannot be discovered
  if (!user || !(await user.checkPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  return { token: signToken(user), user: publicUser(user) };
}

module.exports = { register, login, publicUser };
