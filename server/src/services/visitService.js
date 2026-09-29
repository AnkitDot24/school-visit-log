const Visit = require('../models/Visit');
const School = require('../models/School');
const User = require('../models/User');
const questionnaireService = require('./questionnaireService');
const { getIstYearMonth } = require('../utils/ist');
const { notFound, unprocessable } = require('../utils/errors');

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const DUPLICATE_KEY = 11000;

function toDto(visit, schoolName) {
  const dto = {
    id: String(visit._id),
    clientId: visit.clientId,
    userId: visit.userId,
    udiseCode: visit.udiseCode,
    visitedAt: visit.visitedAt,
    year: visit.year,
    month: visit.month,
    districtCode: visit.districtCode,
    blockCode: visit.blockCode,
    clusterCode: visit.clusterCode,
    answers: visit.answers,
    createdAt: visit.createdAt,
  };
  if (schoolName !== undefined) dto.schoolName = schoolName;
  return dto;
}

const findByClientId = (clientId) => Visit.findOne({ clientId }).lean();

async function createVisit({ clientId, userId, udiseCode, visitedAt, answers }, now = new Date()) {
  const existing = await findByClientId(clientId);
  if (existing) return { visit: toDto(existing), created: false };

  if (visitedAt.getTime() > now.getTime() + MAX_CLOCK_SKEW_MS) {
    throw unprocessable('VISITED_AT_IN_FUTURE', 'visitedAt cannot be more than 5 minutes in the future.');
  }

  const [user, school] = await Promise.all([
    User.exists({ userId }),
    School.findOne({ udiseCode }, { districtCode: 1, blockCode: 1, clusterCode: 1 }).lean(),
  ]);
  if (!user) throw unprocessable('UNKNOWN_USER', `User ${userId} is not one of the demo users.`);
  if (!school) throw unprocessable('UNKNOWN_SCHOOL', `No school has udiseCode ${udiseCode}.`);

  const { year, month } = getIstYearMonth(visitedAt);
  const questionnaire = await questionnaireService.findForMonth(year, month);
  if (!questionnaire) {
    throw unprocessable(
      'QUESTIONNAIRE_NOT_FOUND',
      `There is no questionnaire for ${questionnaireService.monthLabel(year, month)}, the month of visitedAt in India time.`,
    );
  }
  const cleanedAnswers = questionnaireService.validateAnswers(questionnaire, answers);

  try {
    const visit = await Visit.create({
      clientId,
      userId,
      udiseCode,
      visitedAt,
      year,
      month,
      districtCode: school.districtCode,
      blockCode: school.blockCode,
      clusterCode: school.clusterCode,
      questionnaireId: questionnaire._id,
      answers: cleanedAnswers,
    });
    return { visit: toDto(visit.toObject()), created: true };
  } catch (err) {
    if (err.code === DUPLICATE_KEY && err.keyPattern?.clientId) {
      const winner = await findByClientId(clientId);
      if (winner) return { visit: toDto(winner), created: false };
    }
    throw err;
  }
}

async function listVisits({ userId, year, month, page, limit }) {
  if (!(await User.exists({ userId }))) {
    throw notFound('USER_NOT_FOUND', `User ${userId} is not one of the demo users.`);
  }

  const filter = { userId };
  if (year !== undefined) filter.year = year;
  if (month !== undefined) filter.month = month;

  const [visits, total] = await Promise.all([
    Visit.find(filter, { questionnaireId: 0, __v: 0 })
      .sort({ visitedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Visit.countDocuments(filter),
  ]);

  const codes = [...new Set(visits.map((v) => v.udiseCode))];
  const schools = await School.find({ udiseCode: { $in: codes } }, { _id: 0, udiseCode: 1, schoolName: 1 }).lean();
  const names = new Map(schools.map((s) => [s.udiseCode, s.schoolName]));

  return {
    items: visits.map((v) => toDto(v, names.get(v.udiseCode) ?? null)),
    page,
    limit,
    total,
  };
}

module.exports = { createVisit, listVisits };
