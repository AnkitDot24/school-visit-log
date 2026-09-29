const { connectDb, disconnectDb } = require('../src/config/db');
const School = require('../src/models/School');
const { buildBlockSummaryPipeline } = require('../src/services/reportService');
const { getIstYearMonth } = require('../src/utils/ist');

async function main() {
  const [districtCode = '2101', yearArg, monthArg] = process.argv.slice(2);
  const current = getIstYearMonth();
  const params = {
    districtCode,
    year: yearArg ? Number(yearArg) : current.year,
    month: monthArg ? Number(monthArg) : current.month,
  };

  await connectDb();
  const pipeline = buildBlockSummaryPipeline(params);
  const started = Date.now();
  await School.aggregate(pipeline);
  const elapsed = Date.now() - started;
  const explain = await School.aggregate(pipeline).explain('executionStats');

  console.log('Params:', params);
  console.log(`Pipeline ran in ${elapsed}ms\n`);
  console.log(JSON.stringify(explain, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
