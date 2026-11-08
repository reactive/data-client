import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { whenIdle } from './monaco/whenIdle';

/** True anywhere under content not shown, nested ones included: a tab that
 * is not selected (theme/TabItem, PlaygroundTabs included), or a closed
 * `<details>` until its summary is clicked or the page is idle
 * (theme/Details). Playgrounds there run hidden (Playground `hidden`); code
 * blocks there are not highlighted until shown or the page is idle
 * (theme/CodeBlock). */
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

/** True once content has shown (`hidden` false) or the returned `show` ran,
 * and true from then on */
export function useShownOnce(hidden: boolean) {
  const [shown, setShown] = useState(!hidden);
  if (!hidden && !shown) setShown(true);
  const show = useCallback(() => setShown(true), []);
  return [shown, show] as const;
}

/**
 * True while `hidden`, until the page is idle after hydration (whenIdle):
 * then false, in a transition, which yields to input, so drawing hidden
 * content ahead of time never blocks the page. Showing it (`hidden` false,
 * or the returned reveal) draws it at once. Stays false after.
 */
export function useHiddenUntilIdle(hidden: boolean) {
  const [revealed, reveal] = useShownOnce(hidden);
  useEffect(() => {
    if (!revealed) return revealWhenIdle(reveal);
  }, [revealed, reveal]);
  return [!revealed, reveal] as const;
}

// Every reveal waiting for idle runs in one transition, so a page with many
// hidden blocks takes one idle period, not one each.
const waiting = new Set<() => void>();
let cancelDrain: (() => void) | undefined;

function revealWhenIdle(reveal: () => void) {
  waiting.add(reveal);
  cancelDrain ??= whenIdle(() => {
    cancelDrain = undefined;
    const reveals = [...waiting];
    waiting.clear();
    startTransition(() => reveals.forEach(run => run()));
  });
  return () => {
    waiting.delete(reveal);
    if (waiting.size) return;
    cancelDrain?.();
    cancelDrain = undefined;
  };
}
