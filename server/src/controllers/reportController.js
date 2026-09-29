const reportService = require('../services/reportService');

async function blockSummary(req, res) {
  res.json(await reportService.blockSummary(req.valid.query));
}

module.exports = { blockSummary };
