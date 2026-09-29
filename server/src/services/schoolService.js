const School = require('../models/School');
const { escapeRegex } = require('../utils/text');

const LIST_FIELDS = { _id: 0, udiseCode: 1, schoolName: 1, clusterName: 1, blockName: 1 };

function buildFilter({ districtCode, blockCode, clusterCode, search }) {
  const filter = {};
  if (districtCode) filter.districtCode = districtCode;
  if (blockCode) filter.blockCode = blockCode;
  if (clusterCode) filter.clusterCode = clusterCode;
  if (search) {
    const escaped = escapeRegex(search);
    const or = [{ schoolName: { $regex: escaped, $options: 'i' } }];
                                                                                                       
    if (/^\d+$/.test(search)) or.push({ udiseCode: { $regex: `^${escaped}` } });
    filter.$or = or;
  }
  return filter;
}

async function searchSchools({ page, limit, ...criteria }) {
  const filter = buildFilter(criteria);
  const [items, total] = await Promise.all([
    School.find(filter, LIST_FIELDS)
      .sort({ schoolName: 1, udiseCode: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    School.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

module.exports = { searchSchools };
