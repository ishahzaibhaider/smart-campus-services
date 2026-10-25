const service = require('../services/requests.service');

exports.list = async (req, res) => res.json(await service.list(req.user, req.query));

exports.getOne = async (req, res) => res.json({ data: await service.getOne(req.user, req.params.id) });

exports.create = async (req, res) => {
  const doc = await service.create(req.user, req.body);
  res.status(201).location(`/api/requests/${doc.requestId}`).json({ data: doc });
};

exports.update = async (req, res) => res.json({ data: await service.update(req.user, req.params.id, req.body) });

exports.changeStatus = async (req, res) =>
  res.json({ data: await service.changeStatus(req.user, req.params.id, req.body.status, req.body.note) });

exports.assign = async (req, res) =>
  res.json({ data: await service.assign(req.user, req.params.id, req.body.assignedTo, req.body.note) });

exports.remove = async (req, res) => {
  await service.remove(req.user, req.params.id);
  res.status(204).end();
};

exports.stats = async (req, res) => res.json({ data: await service.stats() });
