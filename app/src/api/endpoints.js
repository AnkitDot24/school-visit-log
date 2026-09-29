import { request } from './client';
                                                                                                 
export async function fetchSchools(query) {
  return (await request('/schools', { query })).data;
}

export async function fetchDistricts() {
  return (await request('/locations/districts')).data.items;
}

export async function fetchBlocks(districtCode) {
  return (await request('/locations/blocks', { query: { districtCode } })).data.items;
}

export async function fetchCurrentQuestionnaire() {
  return (await request('/questionnaires/current')).data;
}

                                                                                                                 
export async function postVisit(payload) {
  const { status, data } = await request('/visits', { method: 'POST', body: payload });
  return { created: status === 201, visit: data };
}

export async function fetchVisits(userId, page, limit) {
  return (await request('/visits', { query: { userId, page, limit } })).data;
}

export async function pingServer() {
  return (await request('/health', { timeoutMs: 4000 })).data;
}
