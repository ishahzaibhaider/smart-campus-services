const { Router } = require('express');
const ctrl = require('../controllers/requests.controller');
const validateId = require('../middleware/validateId');

const router = Router();
router.get('/stats/unresolved-by-category', ctrl.unresolvedByCategory); // before /:id
router.route('/').get(ctrl.list).post(ctrl.create);
router.route('/:id').all(validateId).get(ctrl.getOne).put(ctrl.update).delete(ctrl.remove);

module.exports = router;
