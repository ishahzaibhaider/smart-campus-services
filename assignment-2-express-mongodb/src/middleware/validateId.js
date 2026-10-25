const mongoose = require('mongoose');
const { HttpError } = require('./errorHandler');

// Rejects a malformed MongoDB ObjectId in the URL before it reaches the controller
module.exports = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return next(new HttpError(400, `'${req.params.id}' is not a valid id`));
  next();
};
