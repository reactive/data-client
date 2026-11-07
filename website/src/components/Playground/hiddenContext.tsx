import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { whenIdle } from './monaco/whenIdle';

/** True anywhere under content not shown: a tab that is not selected
 * (theme/TabItem, PlaygroundTabs included), or a closed `<details>` until
 * the page is idle (theme/Details), nested ones included. Playgrounds there
 * run hidden (Playground `hidden`); code blocks there are plain text until
 * the page is idle (theme/CodeBlock). */
export const HiddenContext = createContext(false);

/** Marks its children hidden while `hidden`, or while an ancestor is */
export function HiddenProvider({
  hidden,
  children,
}: {
  hidden: boolean;
  children: React.ReactNode;
}) {
  const inherited = useContext(HiddenContext);
  return (
    <HiddenContext.Provider value={inherited || hidden}>
      {children}
    </HiddenContext.Provider>
  );
}

/**
 * True while `hidden`, until the page is idle after hydration (whenIdle):
 * then false, in a transition, which yields to input, so drawing hidden
 * content ahead of time never blocks the page. Showing it (`hidden` false,
 * or the returned reveal) draws it at once. Stays false after.
 */
export function useHiddenUntilIdle(hidden: boolean) {
  const [revealed, setRevealed] = useState(!hidden);
  if (!hidden && !revealed) setRevealed(true);
  useEffect(() => {
    if (revealed) return;
    return whenIdle(() => startTransition(() => setRevealed(true)));
  }, [revealed]);
  const reveal = useCallback(() => setRevealed(true), []);
  return [!revealed, reveal] as const;
}
