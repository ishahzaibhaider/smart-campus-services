const Category = require('../models/Category');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

exports.categories = async (req, res) => res.json({ data: await Category.find().sort({ name: 1 }) });

exports.users = async (req, res) => {
  const { role } = req.query;
  if (role !== undefined && !['student', 'admin'].includes(role)) throw ApiError.badRequest('role must be student or admin');
  res.json({ data: await User.find(role ? { role } : {}).sort({ name: 1 }) });
};
