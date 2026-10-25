

module.exports = (req, res, next) => next(Object.assign(new Error(`Route ${req.method} ${req.originalUrl} not found`), { status: 404 }));
