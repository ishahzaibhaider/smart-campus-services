// Small declarative input validator. Each rule describes one body field.
// Missing body / wrong JSON type -> 400, invalid values -> 422 with a list of messages.
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

function checkField(name, rule, value, errors) {
  if (value === undefined || value === null || value === '') {
    if (rule.required) errors.push(`${name} is required`);
    return undefined;
  }
  if (rule.type === 'string') {
    if (typeof value !== 'string') { errors.push(`${name} must be a string`); return undefined; }
    const v = value.trim();
    if (rule.min && v.length < rule.min) errors.push(`${name} must be at least ${rule.min} characters`);
    if (rule.max && v.length > rule.max) errors.push(`${name} must be at most ${rule.max} characters`);
    if (rule.pattern && !rule.pattern.test(v)) errors.push(`${name} is not valid`);
    if (rule.enum) {
      const match = rule.enum.find(e => e.toLowerCase() === v.toLowerCase());
      if (!match) errors.push(`${name} must be one of: ${rule.enum.join(', ')}`);
      return match;
    }
    return v;
  }
  if (rule.type === 'objectId') {
    if (!mongoose.isValidObjectId(value)) errors.push(`${name} must be a valid id`);
    return value;
  }
  return value;
}

const validate = (rules, { atLeastOne = false } = {}) => (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(ApiError.badRequest('Request body must be a JSON object'));
  }
  const unknown = Object.keys(body).filter(k => !(k in rules));
  if (unknown.length) return next(ApiError.badRequest(`Unknown field(s): ${unknown.join(', ')}`, 'UNKNOWN_FIELD'));
  if (atLeastOne && Object.keys(body).length === 0) {
    return next(ApiError.badRequest(`Send at least one of: ${Object.keys(rules).join(', ')}`));
  }
  const errors = [];
  const cleaned = {};
  for (const [name, rule] of Object.entries(rules)) {
    if (!(name in body)) { if (rule.required) errors.push(`${name} is required`); continue; }
    const v = checkField(name, rule, body[name], errors);
    cleaned[name] = v === undefined ? (body[name] === null ? null : undefined) : v;
  }
  if (errors.length) return next(ApiError.unprocessable('Validation failed', errors));
  req.body = Object.fromEntries(Object.entries(cleaned).filter(([, v]) => v !== undefined));
  next();
};

module.exports = validate;
