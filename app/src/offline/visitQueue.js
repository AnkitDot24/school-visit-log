import { readJson, StorageKeys, writeJson } from '@/storage/storage';
                                   
let cache = null;
let tail = Promise.resolve();
const listeners = new Set();

function withLock(fn) {
  const run = tail.then(fn);
  tail = run.catch(() => undefined);
  return run;
}

async function load() {
  if (cache === null) cache = (await readJson(StorageKeys.visitQueue)) ?? [];
  return cache;
}

                                                                                                     
async function save(items) {
  await writeJson(StorageKeys.visitQueue, items);
  cache = items;
  listeners.forEach((listener) => listener(items));
}

                                        
export function getQueue() {
  return withLock(load);
}

                                 
export function enqueueVisit(visit) {
  return withLock(async () => {
    const items = await load();
    if (items.some((item) => item.clientId === visit.clientId)) return;
    await save([...items, visit]);
  });
}

export function updateVisit(clientId, patch) {
  return withLock(async () => {
    const items = await load();
    if (!items.some((item) => item.clientId === clientId)) return;
    await save(items.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  });
}

export function removeVisits(clientIds) {
  if (clientIds.length === 0) return Promise.resolve();
  const drop = new Set(clientIds);
  return withLock(async () => {
    const items = await load();
    const kept = items.filter((item) => !drop.has(item.clientId));
    if (kept.length !== items.length) await save(kept);
  });
}

export function subscribeToQueue(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
