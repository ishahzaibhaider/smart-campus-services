const auth = require('../services/auth.service');
const User = require('../models/User');

exports.register = async (req, res) => res.status(201).json(await auth.register(req.body));

exports.login = async (req, res) => res.json(await auth.login(req.body));

exports.me = async (req, res) => res.json({ user: auth.publicUser(await User.findById(req.user.id)) });
