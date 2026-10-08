import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Person } from '../../shared/types';
import { api, setUnauthenticatedHandler } from '../api/client';

export interface SessionValue {
  /** 'loading' until GET /api/session has answered once. */
  status: 'loading' | 'ready';
  authenticated: boolean;
  admin: boolean;
  /** The person this device currently acts as. */
  person: Person | null;
  /** True when the session check itself failed (network). */
  failed: boolean;
  refresh: () => Promise<void>;
  login: (passcode: string) => Promise<void>;
  logout: () => Promise<void>;
  adminLogin: (passcode: string) => Promise<void>;
  adminLogout: () => Promise<void>;
  setActingPerson: (person: Person | null) => void;
  forgetPerson: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

interface State {
  status: 'loading' | 'ready';
  authenticated: boolean;
  admin: boolean;
  person: Person | null;
  failed: boolean;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    status: 'loading',
    authenticated: false,
    admin: false,
    person: null,
    failed: false,
  });

  const refresh = useCallback(async () => {
    try {
      const info = await api.getSession();
      setState({ status: 'ready', authenticated: info.authenticated, admin: info.admin, person: info.person, failed: false });
    } catch {
      setState((s) => ({ ...s, status: 'ready', failed: true }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getSession()
      .then((info) => {
        if (!cancelled) {
          setState({ status: 'ready', authenticated: info.authenticated, admin: info.admin, person: info.person, failed: false });
        }
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, status: 'ready', failed: true }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(() => setState((s) => ({ ...s, authenticated: false, admin: false, person: null })));
    return () => setUnauthenticatedHandler(null);
  }, []);

  const login = useCallback(async (passcode: string) => {
    const info = await api.login(passcode);
    setState({ status: 'ready', authenticated: info.authenticated, admin: info.admin, person: info.person, failed: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({ status: 'ready', authenticated: false, admin: false, person: null, failed: false });
    }
  }, []);

  const adminLogin = useCallback(async (passcode: string) => {
    await api.adminLogin(passcode);
    setState((s) => ({ ...s, admin: true }));
  }, []);

  const adminLogout = useCallback(async () => {
    await api.adminLogout();
    setState((s) => ({ ...s, admin: false }));
  }, []);

  const setActingPerson = useCallback((person: Person | null) => {
    setState((s) => ({ ...s, person }));
  }, []);

  const forgetPerson = useCallback(async () => {
    await api.forgetPerson();
    setState((s) => ({ ...s, person: null }));
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ ...state, refresh, login, logout, adminLogin, adminLogout, setActingPerson, forgetPerson }),
    [state, refresh, login, logout, adminLogin, adminLogout, setActingPerson, forgetPerson],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
