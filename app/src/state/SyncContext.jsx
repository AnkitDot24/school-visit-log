import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { NetworkError } from '@/api/client';
import { pingServer } from '@/api/endpoints';
import { downloadQuestionnaire } from '@/offline/questionnaireStore';
import { syncPendingVisits } from '@/offline/syncVisits';
import { enqueueVisit, getQueue, removeVisits, subscribeToQueue } from '@/offline/visitQueue';

                                                                                                
const RETRY_DELAYS_MS = [3000, 10000, 30000, 60000];

const SERVER_PROBE_MS = 8000;

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(null);
  const [isServerUp, setIsServerUp] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const onlineRef = useRef(null);
  const retryTimer = useRef(null);
  const retryIndex = useRef(0);

  const reportServerUp = useCallback((up) => setIsServerUp(up), []);

  const probeServer = useCallback(async () => {
    if (onlineRef.current === false) return;
    try {
      await pingServer();
      setIsServerUp(true);
    } catch (error) {
      setIsServerUp(!(error instanceof NetworkError));
    }
  }, []);

  const runSync = useCallback(async () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
    if (onlineRef.current === false) return;                                                        

    setIsSyncing(true);
    try {
      const result = await syncPendingVisits();
      if (result.networkError) setIsServerUp(false);
      else if (result.sent > 0 || result.failed > 0) setIsServerUp(true);
      if (result.remaining > 0) {
        const delay = RETRY_DELAYS_MS[Math.min(retryIndex.current, RETRY_DELAYS_MS.length - 1)];
        retryIndex.current += 1;
        retryTimer.current = setTimeout(runSync, delay);
      } else {
        retryIndex.current = 0;
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    getQueue().then(setQueue);
    const unsubscribeQueue = subscribeToQueue(setQueue);

    let probeTimer = null;
    const stopProbing = () => {
      if (probeTimer) clearInterval(probeTimer);
      probeTimer = null;
    };
    const startProbing = () => {
      stopProbing();
      probeServer();
      probeTimer = setInterval(probeServer, SERVER_PROBE_MS);
    };
    startProbing();

                                                                                                 
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true;
      const cameOnline = online && onlineRef.current !== true;
      onlineRef.current = online;
      setIsOnline(online);
      if (!online) {
        setIsServerUp(null);
        stopProbing();
        return;
      }
      if (cameOnline) {
        retryIndex.current = 0;
        startProbing();
        runSync();
        downloadQuestionnaire().catch(() => undefined);
      }
    });

    const appStateSub = AppState.addEventListener('change', (status) => {
      if (status !== 'active') {
        stopProbing();
        return;
      }
      startProbing();
      runSync();
    });

    return () => {
      unsubscribeQueue();
      unsubscribeNet();
      appStateSub.remove();
      stopProbing();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [runSync, probeServer]);

  const submitVisit = useCallback(
    async (visit) => {
      await enqueueVisit(visit);
      retryIndex.current = 0;
      runSync();
    },
    [runSync],
  );

  const syncNow = useCallback(() => {
    retryIndex.current = 0;
    runSync();
  }, [runSync]);

  const discardVisit = useCallback((clientId) => removeVisits([clientId]), []);

  let connection = 'online';
  if (isOnline === false) connection = 'offline';
  else if (isServerUp === false) connection = 'server-down';
  else if (isServerUp === null) connection = 'checking';

  const value = useMemo(
    () => ({ queue, isOnline, isServerUp, connection, isSyncing, submitVisit, syncNow, reportServerUp, discardVisit }),
    [queue, isOnline, isServerUp, connection, isSyncing, submitVisit, syncNow, reportServerUp, discardVisit],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const value = useContext(SyncContext);
  if (!value) throw new Error('useSync must be used inside SyncProvider');
  return value;
}
