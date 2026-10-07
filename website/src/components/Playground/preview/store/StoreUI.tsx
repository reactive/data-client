import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { isEndpointId, nodeId, type StoreModel } from './model';

/** Rows shown per table before "Show all" */
export const ROW_LIMIT = 8;

interface StoreUIValue {
  readonly isOpen: (id: string) => boolean;
  readonly toggle: (id: string) => void;
  readonly selected: string | null;
  /** Opens everything leading to `id`, selects it and scrolls it into view */
  readonly reveal: (id: string) => void;
}

const StoreUIContext = createContext<StoreUIValue>({
  isOpen: () => false,
  toggle: () => {},
  selected: null,
  reveal: () => {},
});
export const useStoreUI = () => useContext(StoreUIContext);

export const groupId = (key: string) => nodeId('g', key);
export const showAllId = (key: string) => nodeId('a', key);
export const sectionId = (name: string) => nodeId('s', name);

/** Sections (but Internals) and the first few Entity types to appear start
 * open; rows start closed */
const OPEN_GROUPS = 3;
const openSections = new Set(
  ['optimistic', 'endpoints', 'entities'].map(sectionId),
);

export function StoreUIProvider({
  model,
  onReveal,
  children,
}: {
  model: StoreModel;
  onReveal: (id: string) => void;
  children: React.ReactNode;
}) {
  /** the user's explicit open/closed choices */
  const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  );
  const [selected, setSelected] = useState<string | null>(null);

  // A group's default is fixed when it first appears, so tables arriving
  // later (Suspense loads them one by one) never reshuffle what is open
  const [groupDefaults, setGroupDefaults] = useState<
    ReadonlyMap<string, boolean>
  >(new Map());
  if (model.tables.some(table => !groupDefaults.has(groupId(table.key)))) {
    const next = new Map(groupDefaults);
    for (const table of model.tables) {
      const id = groupId(table.key);
      if (!next.has(id)) next.set(id, next.size < OPEN_GROUPS);
    }
    setGroupDefaults(next);
  }

  const isOpen = useCallback(
    (id: string) =>
      overrides.get(id) ?? (openSections.has(id) || !!groupDefaults.get(id)),
    [overrides, groupDefaults],
  );
  const setOpen = useCallback(
    (ids: readonly string[], open: boolean) =>
      setOverrides(prev => {
        const next = new Map(prev);
        for (const id of ids) next.set(id, open);
        return next;
      }),
    [],
  );
  const toggle = useCallback(
    (id: string) => setOpen([id], !isOpen(id)),
    [setOpen, isOpen],
  );

  const reveal = useCallback(
    (id: string) => {
      const ancestors = [id];
      if (isEndpointId(id)) ancestors.push(sectionId('endpoints'));
      for (const table of model.tables) {
        const index = table.rows.findIndex(row => row.id === id);
        if (index < 0) continue;
        ancestors.push(sectionId('entities'), groupId(table.key));
        if (index >= ROW_LIMIT) ancestors.push(showAllId(table.key));
      }
      setOpen(ancestors, true);
      setSelected(id);
      onReveal(id);
    },
    [model, setOpen, onReveal],
  );

  const value = useMemo(
    () => ({ isOpen, toggle, selected, reveal }),
    [isOpen, toggle, selected, reveal],
  );
  return (
    <StoreUIContext.Provider value={value}>{children}</StoreUIContext.Provider>
  );
}
