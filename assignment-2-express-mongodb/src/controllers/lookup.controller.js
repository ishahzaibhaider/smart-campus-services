const Category = require('../models/Category');
const User = require('../models/User');

exports.listCategories = async (req, res) => res.json({ data: await Category.find().sort({ name: 1 }) });
exports.createCategory = async (req, res) => res.status(201).json({ data: await Category.create({ name: req.body?.name, code: req.body?.code }) });

exports.listUsers = async (req, res) => res.json({ data: await User.find().sort({ name: 1 }) });
exports.createUser = async (req, res) => res.status(201).json({ data: await User.create({ name: req.body?.name, email: req.body?.email, type: req.body?.type }) });
