const schoolService = require('../services/schoolService');
const locationService = require('../services/locationService');

async function list(req, res) {
  res.json(await schoolService.searchSchools(req.valid.query));
}

async function listDistricts(req, res) {
  res.json({ items: await locationService.listDistricts() });
}

async function listBlocks(req, res) {
  res.json({ items: await locationService.listBlocks(req.valid.query.districtCode) });
}

module.exports = { list, listDistricts, listBlocks };
