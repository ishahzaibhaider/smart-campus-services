function logger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const who = req.user ? ` (${req.user.role} ${req.user.email})` : '';
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)} ms${who}`);
  });
  next();
}

module.exports = logger;
