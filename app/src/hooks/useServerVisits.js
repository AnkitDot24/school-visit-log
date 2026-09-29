import { useCallback, useRef, useState } from 'react';
import { describeError, NetworkError } from '@/api/client';
import { fetchVisits } from '@/api/endpoints';
import { VISIT_PAGE_SIZE } from '@/config';
import { removeVisits } from '@/offline/visitQueue';
import { readJson, StorageKeys, writeJson } from '@/storage/storage';

const initialState = {
  items: [],
  total: 0,
  page: 0,
  loading: false,
  loadingMore: false,
  error: null,
                                                                                            
  offline: false,
};

                                                                                                  
export function useServerVisits(userId, queue) {
  const [state, setState] = useState(initialState);
  const requestId = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const loadPage = useCallback(
    async (page) => {
      const id = ++requestId.current;
      const first = page === 1;
      setState((s) => (first ? { ...s, loading: true, error: null } : { ...s, loadingMore: true }));

      try {
        const result = await fetchVisits(userId, page, VISIT_PAGE_SIZE);
        if (id !== requestId.current) return;
        if (first) writeJson(StorageKeys.serverVisits(userId), result).catch(() => undefined);

                                                                                                              
        const onServer = new Set(result.items.map((v) => v.clientId));
        const confirmed = queueRef.current.filter((q) => q.status === 'synced' && onServer.has(q.clientId));
        removeVisits(confirmed.map((q) => q.clientId)).catch(() => undefined);

        setState((s) => ({
          items: first ? result.items : [...s.items, ...result.items.filter((v) => !s.items.some((x) => x.id === v.id))],
          total: result.total,
          page,
          loading: false,
          loadingMore: false,
          error: null,
          offline: false,
        }));
      } catch (error) {
        if (id !== requestId.current) return;
        if (first && error instanceof NetworkError) {
          const saved = await readJson(StorageKeys.serverVisits(userId));
          if (id !== requestId.current) return;
          setState({ ...initialState, items: saved?.items ?? [], total: saved?.items.length ?? 0, page: 1, offline: true });
        } else {
          setState((s) => ({ ...s, loading: false, loadingMore: false, error: describeError(error) }));
        }
      }
    },
    [userId],
  );

  const refresh = useCallback(() => loadPage(1), [loadPage]);

  const loadMore = useCallback(() => {
    const s = stateRef.current;
    if (s.loading || s.loadingMore || s.offline || s.error || s.items.length >= s.total) return;
    loadPage(s.page + 1);
  }, [loadPage]);

  return { ...state, refresh, loadMore };
}
