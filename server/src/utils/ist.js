const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
                          
   
function getIstYearMonth(date = new Date()) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1 };
}

module.exports = { IST_OFFSET_MS, getIstYearMonth };
