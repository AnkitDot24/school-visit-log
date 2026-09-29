const fs = require('fs');
const path = require('path');
const { connectDb, disconnectDb } = require('../src/config/db');
const School = require('../src/models/School');
const { cleanSchool } = require('../src/utils/cleanSchool');

const BATCH_SIZE = 1000;
const MAX_EXAMPLES_PER_REASON = 5;

function readRecords(filePath) {
  const records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(records)) {
    throw new Error(`${filePath} must contain a JSON array`);
  }
  return records;
}

function prepare(records) {
  const schools = [];
  const seen = new Set();
  const skipped = new Map();

  const skip = (reason, index, raw) => {
    const entry = skipped.get(reason) || { count: 0, examples: [] };
    entry.count += 1;
    if (entry.examples.length < MAX_EXAMPLES_PER_REASON) {
      entry.examples.push(`#${index} udiseCode=${JSON.stringify(raw?.udiseCode ?? null)}`);
    }
    skipped.set(reason, entry);
  };

  records.forEach((raw, index) => {
    const { school, reason } = cleanSchool(raw);
    if (reason) return skip(reason, index, raw);
    if (seen.has(school.udiseCode)) return skip('duplicate udiseCode in file (first one kept)', index, raw);
    seen.add(school.udiseCode);
    schools.push(school);
  });

  return { schools, skipped };
}

async function upsertAll(schools) {
  const totals = { inserted: 0, updated: 0, unchanged: 0 };
  const now = new Date();

  for (let i = 0; i < schools.length; i += BATCH_SIZE) {
    const batch = schools.slice(i, i + BATCH_SIZE);
                                                                                                 
    const result = await School.collection.bulkWrite(
      batch.map((school) => ({
        updateOne: {
          filter: { udiseCode: school.udiseCode },
          update: { $set: school, $setOnInsert: { createdAt: now } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    totals.inserted += result.upsertedCount;
    totals.updated += result.modifiedCount;
    totals.unchanged += result.matchedCount - result.modifiedCount;
  }

  return totals;
}

async function main() {
  const filePath = path.resolve(process.argv[2] || path.join(__dirname, '../data/schools.json'));
  console.log(`Reading ${filePath}`);
  const records = readRecords(filePath);
  const { schools, skipped } = prepare(records);

  await connectDb();
  await School.createIndexes();

  const started = Date.now();
  const totals = await upsertAll(schools);
  const skippedCount = [...skipped.values()].reduce((sum, entry) => sum + entry.count, 0);

  console.log(`\nRecords in file: ${records.length}`);
  console.log(`Inserted:  ${totals.inserted}`);
  console.log(`Updated:   ${totals.updated}`);
  console.log(`Unchanged: ${totals.unchanged}`);
  console.log(`Skipped:   ${skippedCount}`);
  for (const [reason, { count, examples }] of skipped) {
    console.log(`  - ${reason}: ${count} (e.g. ${examples.join('; ')})`);
  }
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((err) => {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
