const Questionnaire = require('../models/Questionnaire');
const { QUESTION_TYPES } = require('../models/Questionnaire');
const { getIstYearMonth } = require('../utils/ist');
const { notFound, unprocessable } = require('../utils/errors');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const monthLabel = (year, month) => `${MONTH_NAMES[month - 1]} ${year}`;

                                                                                                                   
function validateQuestionnaireDefinition(q) {
  const where = `questionnaire ${q?.year}-${q?.month}`;
  if (!Number.isInteger(q?.year) || !Number.isInteger(q?.month) || q.month < 1 || q.month > 12) {
    throw new Error(`${where}: year and month must be integers, month 1-12`);
  }
  if (typeof q.title !== 'string' || !q.title.trim()) throw new Error(`${where}: title is required`);
  if (!Array.isArray(q.questions) || q.questions.length === 0) throw new Error(`${where}: questions are required`);

  const ids = new Set();
  for (const question of q.questions) {
    const label = `${where} ${question.questionId}`;
    if (typeof question.questionId !== 'string' || !question.questionId) throw new Error(`${where}: question without questionId`);
    if (ids.has(question.questionId)) throw new Error(`${label}: duplicate questionId`);
    ids.add(question.questionId);
    if (!QUESTION_TYPES.includes(question.type)) throw new Error(`${label}: unknown type ${question.type}`);
    if (question.type === 'number' && (!Number.isInteger(question.min) || !Number.isInteger(question.max) || question.min > question.max)) {
      throw new Error(`${label}: number questions need integer min <= max`);
    }
    if (question.type === 'singleChoice' && (!Array.isArray(question.options) || question.options.length === 0)) {
      throw new Error(`${label}: singleChoice questions need options`);
    }
    if (question.type === 'text' && (!Number.isInteger(question.maxLength) || question.maxLength < 1)) {
      throw new Error(`${label}: text questions need a positive maxLength`);
    }
  }
}

function findForMonth(year, month) {
  return Questionnaire.findOne({ year, month }).lean();
}

async function getCurrent(now = new Date()) {
  const { year, month } = getIstYearMonth(now);
  const questionnaire = await findForMonth(year, month);
  if (!questionnaire) {
    throw notFound('QUESTIONNAIRE_NOT_FOUND', `There is no questionnaire for ${monthLabel(year, month)}.`);
  }
  return questionnaire;
}

function isBlank(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

                                                                                                          
function checkValue(question, value) {
  switch (question.type) {
    case 'yesNo':
      return typeof value === 'boolean' ? null : 'must be true or false';
    case 'number':
      if (typeof value !== 'number' || !Number.isInteger(value)) return 'must be a whole number';
      if (value < question.min || value > question.max) return `must be between ${question.min} and ${question.max}`;
      return null;
    case 'singleChoice':
      return typeof value === 'string' && question.options.includes(value)
        ? null
        : `must be one of: ${question.options.join(', ')}`;
    case 'text':
      if (typeof value !== 'string') return 'must be text';
      if (value.trim().length > question.maxLength) return `must be at most ${question.maxLength} characters`;
      return null;
    default:
      return `has an unsupported type ${question.type}`;
  }
}

   
                                                                                              
                                                                                             
   
function validateAnswers(questionnaire, answers) {
  const label = monthLabel(questionnaire.year, questionnaire.month);
  const byId = new Map(questionnaire.questions.map((q) => [q.questionId, q]));
  const given = new Map();
  const foreignIds = [];
  const problems = [];

  for (const { questionId, value } of answers) {
    if (!byId.has(questionId)) foreignIds.push(questionId);
    else if (given.has(questionId)) problems.push({ questionId, message: 'is answered more than once' });
    else given.set(questionId, value);
  }

  if (foreignIds.length > 0) {
    throw unprocessable(
      'QUESTIONNAIRE_MISMATCH',
      `Answers include questions that are not in the ${label} questionnaire (${foreignIds.join(', ')}). ` +
        'The app is probably using an out-of-date questionnaire; download the current one and fill the form again.',
      foreignIds.map((questionId) => ({ questionId, message: `is not part of the ${label} questionnaire` })),
    );
  }

  const cleaned = [];
  for (const question of questionnaire.questions) {
    const value = given.get(question.questionId);
    if (isBlank(value)) {
      if (!question.optional) problems.push({ questionId: question.questionId, message: 'is required' });
      continue;
    }
    const error = checkValue(question, value);
    if (error) {
      problems.push({ questionId: question.questionId, message: error });
      continue;
    }
    cleaned.push({ questionId: question.questionId, value: typeof value === 'string' ? value.trim() : value });
  }

  if (problems.length > 0) {
    const summary = problems.map((p) => `${p.questionId} ${p.message}`).join('; ');
    throw unprocessable('INVALID_ANSWERS', `Some answers are not valid: ${summary}.`, problems);
  }

  return cleaned;
}

module.exports = {
  monthLabel,
  validateQuestionnaireDefinition,
  findForMonth,
  getCurrent,
  validateAnswers,
};
