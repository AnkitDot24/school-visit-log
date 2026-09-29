import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readJson, removeKey, StorageKeys, writeJson } from '@/storage/storage';

export const DEMO_USERS = [
  { userId: 'U1001', userName: 'Asha Patra', role: 'Cluster coordinator' },
  { userId: 'U1002', userName: 'Ramesh Nayak', role: 'Cluster coordinator' },
  { userId: 'U1003', userName: 'Sunita Das', role: 'Block officer' },
];

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readJson(StorageKeys.user)
      .then((stored) => setUser(DEMO_USERS.find((u) => u.userId === stored?.userId) ?? null))
      .finally(() => setLoading(false));
  }, []);

  const chooseUser = useCallback(async (next) => {
    await writeJson(StorageKeys.user, next);
    setUser(next);
  }, []);

  const clearUser = useCallback(async () => {
    await removeKey(StorageKeys.user);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, chooseUser, clearUser }), [user, loading, chooseUser, clearUser]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const value = useContext(UserContext);
  if (!value) throw new Error('useUser must be used inside UserProvider');
  return value;
}
