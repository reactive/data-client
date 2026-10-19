import { createContext, useCallback, useContext } from 'react';

import { useTabStorage } from '../../../../utils/tabStorage';

export type StoreView = 'table' | 'tree';

/** Opens or closes the Store for a demo; opening in `view` shows that view
 * over the reader's while the Store stays open */
export type ShowStore = (open: boolean, view?: StoreView) => void;

/** A demo's Store view, shown over the reader's saved one without saving it
 * (see `useStoreOpen`); `drop()` gives theirs back */
export interface DemoView {
  view?: StoreView;
  drop(): void;
}
export const DemoViewContext = createContext<DemoView>({ drop() {} });

/** The table or tree view: the reader's choice, kept for every Playground,
 * unless a demo shows its own (`DemoViewContext`) */
export function useStoreView() {
  const [stored, setStored] = useTabStorage('playgroundStoreView');
  const { view: demoView, drop } = useContext(DemoViewContext);
  const view = demoView ?? (stored === 'tree' ? 'tree' : 'table');
  const setView = useCallback(
    (next: StoreView) => {
      setStored(next);
      drop();
    },
    [setStored, drop],
  );
  return [view, setView] as const;
}
