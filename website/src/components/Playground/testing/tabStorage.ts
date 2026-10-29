// Jest stand-in for utils/tabStorage: storage shared by every hook, by key,
// so a choice made in one place shows wherever it's read, as on the page
import { useCallback, useSyncExternalStore } from 'react';

const stored = new Map<string, string>();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useTabStorage(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => stored.get(key) ?? null,
    () => null,
  );
  const set = useCallback(
    (next: string) => {
      stored.set(key, next);
      listeners.forEach(listener => listener());
    },
    [key],
  );
  return [value, set] as const;
}

/** Empties it, for the next test */
export const clearTabStorage = () => stored.clear();
