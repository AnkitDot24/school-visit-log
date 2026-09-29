import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  user: 'svl:user',
  visitQueue: 'svl:visitQueue',
  questionnaire: 'svl:questionnaire',
  schools: 'svl:schools',
  districts: 'svl:districts',
  blocks: (districtCode) => `svl:blocks:${districtCode}`,
  serverVisits: (userId) => `svl:serverVisits:${userId}`,
};

export async function readJson(key) {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key) {
  await AsyncStorage.removeItem(key);
}
