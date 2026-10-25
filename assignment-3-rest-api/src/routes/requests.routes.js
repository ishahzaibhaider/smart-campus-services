const { Router } = require('express');
const ctrl = require('../controllers/requests.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { STATUSES } = require('../utils/workflow');
const { PRIORITIES } = require('../models/ServiceRequest');

const router = Router();
router.use(authenticate); // every request route needs a valid JWT

const content = {
  title: { type: 'string', min: 3, max: 120 },
  category: { type: 'objectId' },
  description: { type: 'string', min: 10, max: 2000 },
  priority: { type: 'string', enum: PRIORITIES }
};
const note = { type: 'string', max: 500 };

router.get('/', ctrl.list);
router.post('/', validate({
  ...content,
  title: { ...content.title, required: true },
  category: { ...content.category, required: true },
  description: { ...content.description, required: true }
}), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', validate({
  ...content,
  status: { type: 'string', enum: STATUSES },
  assignedTo: { type: 'objectId' },
  note
}, { atLeastOne: true }), ctrl.update);
router.delete('/:id', ctrl.remove);

// Workflow actions: administrators only
router.patch('/:id/status', authorize('admin'),
  validate({ status: { type: 'string', required: true, enum: STATUSES }, note }), ctrl.changeStatus);
router.patch('/:id/assign', authorize('admin'),
  validate({ assignedTo: { type: 'objectId', required: true }, note }), ctrl.assign);

module.exports = router;
