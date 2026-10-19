import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { useTabStorage } from '../../../../utils/tabStorage';

export type StoreView = 'table' | 'tree';

/** Opens or closes the Store for a demo; opening in `view` shows that view
 * over the reader's while the Store stays open */
export type ShowStore = (open: boolean, view?: StoreView) => void;

/** A demo's Store view (see ../autorun), shown over the reader's saved one
 * without saving it, until they pick a view; `show(null)` gives theirs back */
export const DemoViewContext = createContext<{
  view: StoreView | null;
  show: (view: StoreView | null) => void;
}>({ view: null, show: () => {} });

/** The table or tree view: the reader's choice, kept for every Playground,
 * unless a demo shows its own (`DemoViewContext`) */
export function useStoreView() {
  const [stored, setStored] = useTabStorage('playgroundStoreView');
  const { view: demoView, show } = useContext(DemoViewContext);
  const view = demoView ?? (stored === 'tree' ? 'tree' : 'table');
  const setView = useCallback(
    (next: StoreView) => {
      setStored(next);
      show(null);
    },
    [setStored, show],
  );
  return [view, setView] as const;
}

/** A `DemoViewContext` provider's value, and the demo's `showStore`, which
 * opens or closes the Store with `openStore`. A step's view holds while the
 * Store stays `open`: once it closes, by the demo or the reader, the
 * reader's view is back */
export function useDemoView(open: boolean, openStore: (open: boolean) => void) {
  const [view, show] = useState<StoreView | null>(null);
  if (!open && view) show(null);
  const value = useMemo(() => ({ view, show }), [view]);
  const showDemoStore = useCallback<ShowStore>(
    (nextOpen, nextView) => {
      if (nextOpen && nextView) show(nextView);
      openStore(nextOpen);
    },
    [openStore],
  );
  return [value, showDemoStore] as const;
}
