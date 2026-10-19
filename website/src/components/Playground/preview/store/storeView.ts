import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { useTabStorage } from '../../../../utils/tabStorage';
import type { ShowStore } from '../autorun/player';

export type StoreView = 'table' | 'tree';

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

/** A `DemoViewContext` provider's value, and the demo's `showStore`: it
 * opens the Store (with `openStore`) in a view, unsaved, and closing it
 * gives the reader's view back */
export function useDemoView(openStore: (open: boolean) => void) {
  const [view, show] = useState<StoreView | null>(null);
  const value = useMemo(() => ({ view, show }), [view]);
  const showStore = useCallback<ShowStore>(
    (open, next) => {
      if (!open) show(null);
      else if (next) show(next);
      openStore(open);
    },
    [openStore],
  );
  return [value, showStore] as const;
}
