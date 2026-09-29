const School = require('../models/School');

function countSchoolsByCode(codeField, nameField) {
  return [
    { $group: { _id: { code: `$${codeField}`, name: `$${nameField}` }, count: { $sum: 1 } } },
    { $sort: { '_id.code': 1, count: -1, '_id.name': 1 } },
    { $group: { _id: '$_id.code', name: { $first: '$_id.name' }, schoolCount: { $sum: '$count' } } },
  ];
}

function groupByCode(codeField, nameField) {
  return [
    ...countSchoolsByCode(codeField, nameField),
    { $project: { _id: 0, code: '$_id', name: 1, schoolCount: 1, sortName: { $toLower: '$name' } } },
    { $sort: { sortName: 1, code: 1 } },
    { $project: { sortName: 0 } },
  ];
}

async function listDistricts() {
  const rows = await School.aggregate(groupByCode('districtCode', 'districtName'));
  return rows.map(({ code, name, schoolCount }) => ({ districtCode: code, districtName: name, schoolCount }));
}

async function listBlocks(districtCode) {
  const rows = await School.aggregate([{ $match: { districtCode } }, ...groupByCode('blockCode', 'blockName')]);
  return rows.map(({ code, name, schoolCount }) => ({ blockCode: code, blockName: name, schoolCount }));
}

module.exports = { countSchoolsByCode, listDistricts, listBlocks };
