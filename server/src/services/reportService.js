const School = require('../models/School');
const Visit = require('../models/Visit');
const { countSchoolsByCode } = require('./locationService');
const { getIstYearMonth } = require('../utils/ist');
const { notFound } = require('../utils/errors');
                                                                       
   
const coverageExpr = (visited, total) => ({
  $cond: [
    { $gt: [total, 0] },
    { $divide: [{ $floor: { $add: [{ $divide: [{ $multiply: [visited, 1000] }, total] }, 0.5] } }, 10] },
    0,
  ],
});
                                                                                      
   
function buildBlockSummaryPipeline({ districtCode, year, month }) {
  return [
    { $match: { districtCode } },
    ...countSchoolsByCode('blockCode', 'blockName'),
    {
      $lookup: {
        from: Visit.collection.name,
        localField: '_id',
        foreignField: 'blockCode',
        pipeline: [
          { $match: { year, month } },
          { $group: { _id: { userId: '$userId', udiseCode: '$udiseCode' } } },
        ],
        as: 'pairs',
      },
    },
    {
      $project: {
        _id: 0,
        blockCode: '$_id',
        blockName: '$name',
        totalSchools: '$schoolCount',
        visits: { $size: '$pairs' },
        schoolSet: { $setUnion: ['$pairs._id.udiseCode', []] },
        userSet: { $setUnion: ['$pairs._id.userId', []] },
      },
    },
    {
      $facet: {
        rows: [
          {
            $project: {
              blockCode: 1,
              blockName: 1,
              totalSchools: 1,
              schoolsVisited: { $size: '$schoolSet' },
              uniqueVisitors: { $size: '$userSet' },
              visits: 1,
              sortName: { $toLower: '$blockName' },
            },
          },
          { $addFields: { coveragePercent: coverageExpr('$schoolsVisited', '$totalSchools') } },
          { $sort: { sortName: 1, blockCode: 1 } },
          { $project: { sortName: 0 } },
        ],
        districtTotal: [
          {
            $group: {
              _id: null,
              totalSchools: { $sum: '$totalSchools' },
              schoolsVisited: { $sum: { $size: '$schoolSet' } },
              visits: { $sum: '$visits' },
              userSets: { $push: '$userSet' },
            },
          },
          {
            $project: {
              _id: 0,
              totalSchools: 1,
              schoolsVisited: 1,
              uniqueVisitors: {
                $size: { $reduce: { input: '$userSets', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } },
              },
              visits: 1,
            },
          },
          { $addFields: { coveragePercent: coverageExpr('$schoolsVisited', '$totalSchools') } },
        ],
      },
    },
  ];
}

async function blockSummary({ districtCode, year, month }) {
  const period = year !== undefined ? { year, month } : getIstYearMonth();

  const district = await School.findOne({ districtCode }, { _id: 0, districtName: 1 }).lean();
  if (!district) throw notFound('DISTRICT_NOT_FOUND', `No schools found for districtCode ${districtCode}.`);

  const [result] = await School.aggregate(buildBlockSummaryPipeline({ districtCode, ...period }));

  return {
    districtCode,
    districtName: district.districtName,
    year: period.year,
    month: period.month,
    rows: result.rows,
    districtTotal: result.districtTotal[0],
  };
}

module.exports = { buildBlockSummaryPipeline, blockSummary };
