import { NetworkError } from '@/api/client';
import { fetchBlocks, fetchDistricts } from '@/api/endpoints';
import { readJson, StorageKeys, writeJson } from '@/storage/storage';
                                                                           
const MAX_SAVED_SCHOOLS = 3000;
const PERSIST_DELAY_MS = 1000;

let saved = null;
let persistTimer = null;

async function loadSaved() {
  if (saved === null) saved = (await readJson(StorageKeys.schools)) ?? {};
  return saved;
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (saved) writeJson(StorageKeys.schools, saved).catch(() => undefined);
  }, PERSIST_DELAY_MS);
}

export async function rememberSchools(items, filters) {
  const all = await loadSaved();
  const now = Date.now();
  for (const item of items) {
    const previous = all[item.udiseCode];
    all[item.udiseCode] = {
      ...item,
      districtCode: filters.districtCode ?? previous?.districtCode,
      blockCode: filters.blockCode ?? previous?.blockCode,
      seenAt: now,
    };
  }

  const codes = Object.keys(all);
  if (codes.length > MAX_SAVED_SCHOOLS) {
    codes
      .sort((a, b) => all[a].seenAt - all[b].seenAt)
      .slice(0, codes.length - MAX_SAVED_SCHOOLS)
      .forEach((code) => delete all[code]);
  }
  schedulePersist();
}

                                                                                            
export async function searchSavedSchools({ districtCode, blockCode, search }) {
  const all = Object.values(await loadSaved());
  const needle = search?.trim().toLowerCase() ?? '';
  const isDigits = /^\d+$/.test(needle);

  return all
    .filter((s) => !districtCode || s.districtCode === districtCode)
    .filter((s) => !blockCode || s.blockCode === blockCode)
    .filter((s) => !needle || s.schoolName.toLowerCase().includes(needle) || (isDigits && s.udiseCode.startsWith(needle)))
    .sort((a, b) => a.schoolName.localeCompare(b.schoolName) || a.udiseCode.localeCompare(b.udiseCode))
    .map(({ udiseCode, schoolName, clusterName, blockName }) => ({ udiseCode, schoolName, clusterName, blockName }));
}

                                                                                     
async function withOfflineCopy(key, load) {
  try {
    const data = await load();
    await writeJson(key, data);
    return { data, offline: false };
  } catch (error) {
    if (!(error instanceof NetworkError)) throw error;
    const copy = await readJson(key);
    if (copy === null) throw error;
    return { data: copy, offline: true };
  }
}

export function loadDistricts() {
  return withOfflineCopy(StorageKeys.districts, fetchDistricts);
}

export function loadBlocks(districtCode) {
  return withOfflineCopy(StorageKeys.blocks(districtCode), () => fetchBlocks(districtCode));
}
