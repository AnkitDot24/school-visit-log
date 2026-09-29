const questionnaireService = require('../services/questionnaireService');

async function current(req, res) {
  const { _id, year, month, title, questions } = await questionnaireService.getCurrent();
  res.json({ id: String(_id), year, month, title, questions });
}

module.exports = { current };
