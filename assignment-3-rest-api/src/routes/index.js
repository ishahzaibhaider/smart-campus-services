const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const lookup = require('../controllers/lookup.controller');
const requests = require('../controllers/requests.controller');

const router = Router();
router.use('/auth', require('./auth.routes'));
router.use('/requests', require('./requests.routes'));
router.get('/categories', lookup.categories);
router.get('/users', authenticate, authorize('admin'), lookup.users);
router.get('/stats', authenticate, authorize('admin'), requests.stats);

module.exports = router;
