const visitService = require('../services/visitService');

async function create(req, res) {
  const { visit, created } = await visitService.createVisit(req.valid.body);
  res.status(created ? 201 : 200).json(visit);
}

async function list(req, res) {
  res.json(await visitService.listVisits(req.valid.query));
}

module.exports = { create, list };
