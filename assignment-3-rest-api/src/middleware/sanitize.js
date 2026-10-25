// Removes keys that start with "$" or contain "." from the JSON body,
// so a client cannot inject MongoDB operators such as { "$gt": "" } (NoSQL injection).
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) delete value[key];
      else value[key] = clean(value[key]);
    }
  }
  return value;
}

module.exports = (req, res, next) => {
  if (req.body) clean(req.body);
  next();
};
