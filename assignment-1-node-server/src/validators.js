const CATEGORIES = ['IT Support', 'Maintenance', 'Transport', 'Library', 'Lost & Found', 'Classroom & Equipment', 'Facility Services'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const isValidId = id => /^REQ-\d+$/.test(id);

// Returns { errors, value }: value holds the cleaned-up fields (case fixed, trimmed)
function validateNewRequest(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Body must be a JSON object'], value: null };
  }
  const text = (field, min, max) => {
    const v = typeof body[field] === 'string' ? body[field].trim() : '';
    if (!v) errors.push(`${field} is required`);
    else if (v.length < min || v.length > max) errors.push(`${field} must be ${min}-${max} characters`);
    return v;
  };
  const pick = (field, allowed) => {
    const v = allowed.find(a => a.toLowerCase() === String(body[field] ?? '').trim().toLowerCase());
    if (!v) errors.push(`${field} must be one of: ${allowed.join(', ')}`);
    return v;
  };
  const value = {
    name: text('name', 2, 80),
    category: pick('category', CATEGORIES),
    description: text('description', 10, 1000),
    priority: pick('priority', PRIORITIES)
  };
  return { errors, value };
}

module.exports = { validateNewRequest, isValidId, CATEGORIES, PRIORITIES };
