const { Router } = require('express');
const ctrl = require('../controllers/lookup.controller');

const categories = Router();
categories.route('/').get(ctrl.listCategories).post(ctrl.createCategory);

const users = Router();
users.route('/').get(ctrl.listUsers).post(ctrl.createUser);

module.exports = { categories, users };
