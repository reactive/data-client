import React, { createContext, useState, useCallback, useMemo } from 'react';
import { getAuth, setAuth, unAuth } from 'resources/Auth';
import UserResource from 'resources/User';
import { useController } from 'rest-hooks';

export const authdContext = createContext({
  authed: false,
  login(data: { login: string; token: string }): void {
    throw new Error('context not set for auth');
  },
  logout(): void {
    throw new Error('context not set for auth');
  },
});

export function AuthdProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => !!getAuth());
  const { invalidate, fetch } = useController();
  const logout = useCallback(() => {
    unAuth();
    // current user no longer exists
    invalidate(UserResource.current);
    setAuthed(false);
  }, []);
  const login = useCallback((data: { login: string; token: string }) => {
    fetch(UserResource.current);
    setAuth(data);
    setAuthed(true);
  }, []);
  const value = useMemo(
    () => ({ authed, login, logout }),
    [authed, login, logout],
  );
  return (
    <authdContext.Provider value={value}>{children}</authdContext.Provider>
  );
}
