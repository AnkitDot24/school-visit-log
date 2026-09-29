import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, describeError } from '@/api/client';
import { downloadQuestionnaire, getSavedQuestionnaire } from '@/offline/questionnaireStore';
import { compareMonths, getIstYearMonth } from '@/utils/ist';
                        
   
export function useCurrentQuestionnaire() {
  const [state, setState] = useState({ status: 'loading' });
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const now = getIstYearMonth();
    const saved = await getSavedQuestionnaire();
    const savedIsCurrent = saved !== null && compareMonths(saved, now) === 0;
    if (savedIsCurrent && mounted.current) setState({ status: 'ready', questionnaire: saved });

    try {
      const fresh = await downloadQuestionnaire();
      if (!mounted.current) return;
      if (compareMonths(fresh, now) === 0) {
        setState({ status: 'ready', questionnaire: fresh });
      } else {
        setState({
          status: 'unavailable',
          message: `The server's current month (${fresh.title}) does not match this phone's date. Check the date and time settings.`,
        });
      }
    } catch (error) {
      if (!mounted.current || savedIsCurrent) return;
      if (error instanceof ApiError && error.status === 404) {
        setState({ status: 'unavailable', message: error.message });
      } else if (saved && compareMonths(saved, now) < 0) {
        setState({ status: 'outdated', saved });
      } else {
        setState({
          status: 'unavailable',
          message: `The questionnaire for this month has not been downloaded yet. Go online and try again. (${describeError(error)})`,
        });
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { state, reload: load };
}
