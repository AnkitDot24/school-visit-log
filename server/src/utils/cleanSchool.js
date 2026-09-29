const REQUIRED_FIELDS = ['udiseCode', 'schoolName', 'districtCode', 'blockCode', 'clusterCode'];
const CODE_FIELDS = ['udiseCode', 'districtCode', 'blockCode', 'clusterCode'];

                                                                                    
function cleanString(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const cleaned = String(value).trim().replace(/\s+/g, ' ');
  return cleaned === '' ? null : cleaned;
}

function cleanInt(value) {
  const text = cleanString(value);
  if (text === null || !/^\d+$/.test(text)) return null;
  return Number(text);
}

function cleanBoolean(value) {
  if (typeof value === 'boolean') return value;
  const text = cleanString(value);
  if (text === null) return null;
  if (/^(true|yes|1)$/i.test(text)) return true;
  if (/^(false|no|0)$/i.test(text)) return false;
  return null;
}                                                                     
   
function cleanSchool(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { reason: 'record is not an object' };
  }

  const school = {
    udiseCode: cleanString(raw.udiseCode),
    schoolName: cleanString(raw.schoolName),
    districtCode: cleanString(raw.districtCode),
    districtName: cleanString(raw.districtName),
    blockCode: cleanString(raw.blockCode),
    blockName: cleanString(raw.blockName),
    clusterCode: cleanString(raw.clusterCode),
    clusterName: cleanString(raw.clusterName),
    schoolType: cleanString(raw.schoolType ?? raw.school_type),
    management: cleanString(raw.management),
    category: cleanString(raw.category),
    classFrom: cleanInt(raw.classFrom),
    classTo: cleanInt(raw.classTo),
    address: cleanString(raw.address),
    isNv: cleanBoolean(raw.isNv),
  };

  const missing = REQUIRED_FIELDS.filter((field) => school[field] === null);
  if (missing.length > 0) {
    return { reason: `missing ${missing.join(', ')}` };
  }

  const nonNumeric = CODE_FIELDS.filter((field) => !/^\d+$/.test(school[field]));
  if (nonNumeric.length > 0) {
    return { reason: `non-numeric ${nonNumeric.join(', ')}` };
  }

  return { school };
}

module.exports = { cleanSchool, cleanString };
