const fs = require('fs');
const path = require('path');
const { connectDb, disconnectDb } = require('../src/config/db');
const Questionnaire = require('../src/models/Questionnaire');
const User = require('../src/models/User');
const { validateQuestionnaireDefinition } = require('../src/services/questionnaireService');

const DEMO_USERS = [
  { userId: 'U1001', userName: 'Asha Patra', role: 'Cluster coordinator' },
  { userId: 'U1002', userName: 'Ramesh Nayak', role: 'Cluster coordinator' },
  { userId: 'U1003', userName: 'Sunita Das', role: 'Block officer' },
];

async function upsertMany(Model, docs, keyFields) {
  if (docs.length === 0) return { inserted: 0, updated: 0, unchanged: 0 };
  const result = await Model.bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: Object.fromEntries(keyFields.map((key) => [key, doc[key]])),
        update: { $set: doc },
        upsert: true,
        timestamps: false,
      },
    })),
  );
  return {
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
    unchanged: result.matchedCount - result.modifiedCount,
  };
}

function format(label, { inserted, updated, unchanged }) {
  return `${label}: inserted ${inserted}, updated ${updated}, unchanged ${unchanged}`;
}

async function main() {
  const filePath = path.resolve(process.argv[2] || path.join(__dirname, '../data/questionnaires.json'));
  const questionnaires = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(questionnaires)) throw new Error(`${filePath} must contain a JSON array`);

  const seenMonths = new Set();
  const seenQuestionIds = new Set();
  for (const q of questionnaires) {
    validateQuestionnaireDefinition(q);
    const monthKey = `${q.year}-${q.month}`;
    if (seenMonths.has(monthKey)) throw new Error(`Two questionnaires for ${monthKey}`);
    seenMonths.add(monthKey);
    for (const { questionId } of q.questions) {
      if (seenQuestionIds.has(questionId)) throw new Error(`questionId ${questionId} is used in more than one questionnaire`);
      seenQuestionIds.add(questionId);
    }
  }

  await connectDb();
  await Promise.all([Questionnaire.createIndexes(), User.createIndexes()]);

  const docs = questionnaires.map(({ year, month, title, questions }) => ({ year, month, title, questions }));
  console.log(format('Questionnaires', await upsertMany(Questionnaire, docs, ['year', 'month'])));
  console.log(format('Users', await upsertMany(User, DEMO_USERS, ['userId'])));
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
