import { createContext, useCallback, useContext } from 'react';

import { useTabStorage } from '../../../../utils/tabStorage';
import {
  ActionsByContext,
  DemoViewContext,
  type ActionsBy,
  type Inspect,
} from '../StoreToggle';

export type StoreView = 'table' | 'tree';

/** The view the Store tab's store level lays out in */
export const StoreViewContext = createContext<StoreView>('table');

/** Opens or closes the Store for a demo; opening on `tab`, or in `view`,
 * shows that over the reader's while the Store stays open */
export type ShowStore = (
  open: boolean,
  view?: StoreView,
  tab?: Inspect,
) => void;

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

/** How the Actions tab lists actions: the reader's choice, kept per
 * playground group, else the playground's default */
export function useActionsBy() {
  const { groupId, defaultBy } = useContext(ActionsByContext);
  const [stored, setStored] = useTabStorage(`${groupId}.actionsBy`);
  const by: ActionsBy =
    stored === 'interaction' || stored === 'action' ? stored : defaultBy;
  const setBy = useCallback((next: ActionsBy) => setStored(next), [setStored]);
  return [by, setBy] as const;
}
