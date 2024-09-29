import { useController } from '@data-client/react';
import React, { createContext, useCallback, useMemo } from 'react';

import { setAuth, unAuth } from '@/resources/Auth';
import UserResource, { User } from '@/resources/User';

export const authdContext = createContext({
  async login(data: { login: string; token: string }): Promise<User> {
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
    async (data: { login: string; token: string }) => {
      setAuth(data);
      return await ctrl.fetch(UserResource.current);
    },
    [ctrl],
  );
  const value = useMemo(() => ({ login, logout }), [login, logout]);
  return (
    <authdContext.Provider value={value}>{children}</authdContext.Provider>
  );
}
