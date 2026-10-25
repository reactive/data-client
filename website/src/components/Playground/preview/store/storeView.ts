import { useCallback, useContext } from 'react';

import { useTabStorage } from '../../../../utils/tabStorage';
import { DemoViewContext } from '../StoreToggle';

export type StoreView = 'table' | 'tree';

/** Opens or closes the Store for a demo; opening in `view` shows that view
 * over the reader's while the Store stays open */
export type ShowStore = (open: boolean, view?: StoreView) => void;

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
