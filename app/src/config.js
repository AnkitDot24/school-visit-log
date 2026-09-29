import Constants from 'expo-constants';

const API_PORT = 4000;
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:${API_PORT}`;

  return `http://10.0.2.2:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
export const REQUEST_TIMEOUT_MS = 15000;
export const SCHOOL_PAGE_SIZE = 20;
export const VISIT_PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 400;
