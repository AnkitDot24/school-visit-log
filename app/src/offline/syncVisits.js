import { ApiError } from '@/api/client';
import { postVisit } from '@/api/endpoints';
import { getQueue, updateVisit } from './visitQueue';

let running = null;
let rerunRequested = false;

const toPayload = ({ clientId, userId, udiseCode, visitedAt, answers }) => ({
  clientId,
  userId,
  udiseCode,
  visitedAt,
  answers,
});

async function syncOnce() {
  const result = { sent: 0, failed: 0, remaining: 0, networkError: false };
  const pending = (await getQueue())
    .filter((item) => item.status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const item of pending) {
    const attemptAt = new Date().toISOString();
    try {
      await postVisit(toPayload(item));
                                                                                                 
                                                                                                           
      await updateVisit(item.clientId, {
        status: 'synced',
        syncedAt: new Date().toISOString(),
        lastError: null,
        lastAttemptAt: attemptAt,
        attempts: item.attempts + 1,
      });
      result.sent += 1;
    } catch (error) {
      const permanent = error instanceof ApiError && error.isPermanent;
      await updateVisit(item.clientId, {
        status: permanent ? 'failed' : 'pending',
        lastError: error instanceof Error ? error.message : String(error),
        lastAttemptAt: attemptAt,
        attempts: item.attempts + 1,
      });
      if (permanent) {
        result.failed += 1;
      } else if (!(error instanceof ApiError)) {
                                                                         
        result.networkError = true;
        break;
      }
    }
  }

  result.remaining = (await getQueue()).filter((item) => item.status === 'pending').length;
  return result;
}

   
                                                                                           
                                                                                                
                                 
   
export function syncPendingVisits() {
  if (running) {
    rerunRequested = true;
    return running;
  }
  running = (async () => {
    let result;
    do {
      rerunRequested = false;
      result = await syncOnce();
    } while (rerunRequested && !result.networkError);
    return result;
  })().finally(() => {
    running = null;
  });
  return running;
}
