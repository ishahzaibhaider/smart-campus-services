const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = Router();

// Brute-force / DoS protection: at most 10 login or register attempts per minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: { status: 429, message: 'Too many attempts, try again in a minute', code: 'RATE_LIMITED' } })
});

const email = { type: 'string', required: true, max: 120, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ };

router.post('/register', authLimiter, validate({
  name: { type: 'string', required: true, min: 2, max: 80 },
  email,
  password: { type: 'string', required: true, min: 8, max: 72 }
}), ctrl.register);

router.post('/login', authLimiter, validate({
  email,
  password: { type: 'string', required: true, max: 72 }
}), ctrl.login);

router.get('/me', authenticate, ctrl.me);

module.exports = router;
