import { useCallback, useContext } from 'react';

import { useTabStorage } from '../../../../utils/tabStorage';
import {
  ActionsByContext,
  DemoViewContext,
  type ActionsBy,
} from '../StoreToggle';

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

/** How the Action tab lists actions: the reader's choice, kept per
 * playground group, else the playground's default */
export function useActionsBy() {
  const { groupId, defaultBy } = useContext(ActionsByContext);
  const [stored, setStored] = useTabStorage(`${groupId}.actionsBy`);
  const by: ActionsBy =
    stored === 'request' || stored === 'interaction' ? stored : defaultBy;
  const setBy = useCallback((next: ActionsBy) => setStored(next), [setStored]);
  return [by, setBy] as const;
}
