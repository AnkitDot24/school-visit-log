import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError, NetworkError } from '@/api/client';
import { fetchSchools } from '@/api/endpoints';
import { SCHOOL_PAGE_SIZE } from '@/config';
import { rememberSchools, searchSavedSchools } from '@/offline/schoolStore';

const initialState = {
  items: [],
  total: 0,
  page: 0,
  loading: true,
  loadingMore: false,
  error: null,
  loadMoreError: null,
                                                               
  offline: false,
};

function appendUnique(existing, incoming) {
  const seen = new Set(existing.map((s) => s.udiseCode));
  return [...existing, ...incoming.filter((s) => !seen.has(s.udiseCode))];
}

export function useSchoolSearch({ districtCode, blockCode, search }) {
  const [state, setState] = useState(initialState);
                                                                                             
  const requestId = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const loadPage = useCallback(
    async (page) => {
      const id = ++requestId.current;
      const first = page === 1;
      const filters = { districtCode, blockCode, search: search.trim() || undefined };
      setState((s) => (first ? { ...initialState } : { ...s, loadingMore: true, loadMoreError: null }));

      try {
        const result = await fetchSchools({ ...filters, page, limit: SCHOOL_PAGE_SIZE });
        if (id !== requestId.current) return;
        rememberSchools(result.items, filters).catch(() => undefined);
        setState((s) => ({
          ...s,
          items: first ? result.items : appendUnique(s.items, result.items),
          total: result.total,
          page,
          loading: false,
          loadingMore: false,
          offline: false,
        }));
      } catch (error) {
        if (id !== requestId.current) return;
        if (first && error instanceof NetworkError) {
          const saved = await searchSavedSchools(filters);
          if (id !== requestId.current) return;
          setState({ ...initialState, items: saved, total: saved.length, page: 1, loading: false, offline: true });
        } else if (first) {
          setState({ ...initialState, loading: false, error: describeError(error) });
        } else {
          setState((s) => ({ ...s, loadingMore: false, loadMoreError: describeError(error) }));
        }
      }
    },
    [districtCode, blockCode, search],
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    const s = stateRef.current;
    if (s.loading || s.loadingMore || s.offline || s.error || s.loadMoreError) return;
    if (s.items.length >= s.total) return;
    loadPage(s.page + 1);
  }, [loadPage]);

  const retryMore = useCallback(() => loadPage(stateRef.current.page + 1), [loadPage]);
  const reload = useCallback(() => loadPage(1), [loadPage]);

  return { ...state, hasMore: !state.offline && state.items.length < state.total, loadMore, retryMore, reload };
}
