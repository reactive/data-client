import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { nodeId, type StoreModel } from './model';

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
/** "Show all" past ROW_LIMIT in the group or section `container` */
export const showAllId = (container: string) => nodeId('a', container);
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
  const newGroups = model.tables
    .map(table => groupId(table.key))
    .filter(id => !groupDefaults.has(id));
  if (newGroups.length) {
    const next = new Map(groupDefaults);
    for (const id of newGroups) next.set(id, next.size < OPEN_GROUPS);
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
      // the containers a row can sit in, each opened along with what holds it
      const containers = [
        { path: [sectionId('endpoints')], rows: model.endpoints },
        ...model.tables.map(table => ({
          path: [sectionId('entities'), groupId(table.key)],
          rows: table.rows,
        })),
      ];
      for (const { path, rows } of containers) {
        const index = rows.findIndex(row => row.id === id);
        if (index < 0) continue;
        ancestors.push(...path);
        if (index >= ROW_LIMIT)
          ancestors.push(showAllId(path[path.length - 1]));
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
