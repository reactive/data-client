import { useController } from '@rest-hooks/react';
import React, { createContext, useCallback, useMemo } from 'react';
import { setAuth, unAuth } from 'resources/Auth';
import UserResource from 'resources/User';

export const authdContext = createContext({
  login(data: { login: string; token: string }): void {
    throw new Error('context not set for auth');
  },
  logout(): void {
    throw new Error('context not set for auth');
  },
});

export function AuthdProvider({ children }: { children: React.ReactNode }) {
  const ctrl = useController();
  const logout = useCallback(() => {
    unAuth();
    // current user no longer exists
    ctrl.invalidate(UserResource.current);
  }, [ctrl]);
  const login = useCallback(
    (data: { login: string; token: string }) => {
      ctrl.fetch(UserResource.current);
      setAuth(data);
    },
    [ctrl],
  );
  const value = useMemo(() => ({ login, logout }), [login, logout]);
  return (
    <authdContext.Provider value={value}>{children}</authdContext.Provider>
  );
}
