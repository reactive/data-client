// The Store drawer's model: which tab shows, and the quick look its other
// tab's hover opens. Light, as ../index.tsx provides it and is statically in
// every page chunk that embeds a Playground (see ./StoreToggle.tsx)

import {
  createContext,
  type PointerEvent,
  useContext,
  useSyncExternalStore,
} from 'react';

/** What the Store drawer shows: the store, or the actions that changed it.
 * Each has its own tab on the drawer's edge */
export type Inspect = 'store' | 'actions';
/** Shut, or open showing one */
export type InspectorOpen = Inspect | 'n';

/** Which of the drawer's tabs shows, and the quick look its other tab's
 * hover opens (`quickLook`); `select` shows a tab, opening the drawer if
 * shut. `listed` counts the Actions tab's handle pulled, each of which opens
 * the actions at their list */
export interface Inspector {
  readonly tab: Inspect;
  select(tab: Inspect): void;
  readonly quickLook: QuickLookStore;
  readonly listed: number;
}

export const InspectorContext = createContext<Inspector>({
  tab: 'store',
  select() {},
  quickLook: createQuickLook(),
  listed: 0,
});

/** Where the preview's header shows its toggles' quick look (stacked,
 * ./PreviewWrapper.tsx): over the code, above the header. Without one, the
 * header's toggles open none */
export const QuickLookHost = createContext<HTMLElement | null>(null);

/** The tab whose quick look shows */
export function useQuickLook(): Inspect | null {
  const { quickLook } = useContext(InspectorContext);
  return useSyncExternalStore(quickLook.subscribe, quickLook.get, noQuickLook);
}
const noQuickLook = () => null;

/** Whether a quick look shows, whichever tab's */
export function useQuickLookShown(): boolean {
  const { quickLook } = useContext(InspectorContext);
  return useSyncExternalStore(
    quickLook.subscribe,
    () => quickLook.get() !== null,
    () => false,
  );
}

/** How long the pointer rests on a tab before its quick look opens, and is
 * away from both before it closes (ms) */
const QUICK_LOOK_OPEN_MS = 150;
const QUICK_LOOK_CLOSE_MS = 300;

/** The quick look a drawer tab's hover opens: outside React state, so a
 * hover re-renders only what shows it (./StoreInspector.tsx), not the
 * playground. Mouse only: a tap on the tab opens the drawer itself */
export interface QuickLookStore {
  get(): Inspect | null;
  subscribe(onChange: () => void): () => void;
  /** The pointer came onto (`true`) or left a tab's handle or its quick look */
  hover(tab: Inspect, inside: boolean, e: PointerEvent): void;
  close(): void;
}
export function createQuickLook(): QuickLookStore {
  let shown: Inspect | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const set = (next: Inspect | null) => {
    clearTimeout(timer);
    if (next === shown) return;
    shown = next;
    listeners.forEach(listener => listener());
  };
  return {
    get: () => shown,
    subscribe(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    hover(tab, inside, e) {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(timer);
      // straight from one tab's quick look to the other's
      if (inside && shown !== null && shown !== tab) return set(tab);
      timer = setTimeout(
        () => set(inside ? tab : null),
        inside ? QUICK_LOOK_OPEN_MS : QUICK_LOOK_CLOSE_MS,
      );
    },
    close: () => set(null),
  };
}
