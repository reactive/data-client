import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { isEndpointId, type StoreModel } from './model';

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

export const groupId = (key: string) => `g\u001f${key}`;
export const showAllId = (key: string) => `a\u001f${key}`;
export const sectionId = (name: string) => `s\u001f${name}`;

/** Sections (but Internals) and the first few Entity types start open;
 * rows start closed */
const OPEN_GROUPS = 3;
const openSections = ['optimistic', 'endpoints', 'entities'].map(sectionId);

export function StoreUIProvider({
  model,
  onReveal,
  children,
}: {
  model: StoreModel;
  onReveal: (id: string) => void;
  children: React.ReactNode;
}) {
  /** ids the user flipped away from their default */
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);

  const defaultOpen = useMemo(
    () =>
      new Set([
        ...openSections,
        ...model.tables.slice(0, OPEN_GROUPS).map(t => groupId(t.key)),
      ]),
    [model.tables],
  );
  const isOpen = useCallback(
    (id: string) => defaultOpen.has(id) !== flipped.has(id),
    [defaultOpen, flipped],
  );
  const toggle = useCallback((id: string) => {
    setFlipped(prev => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

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
      setFlipped(prev => {
        const next = new Set(prev);
        for (const a of ancestors)
          if (defaultOpen.has(a)) next.delete(a);
          else next.add(a);
        return next;
      });
      setSelected(id);
      onReveal(id);
    },
    [model, defaultOpen, onReveal],
  );

  const value = useMemo(
    () => ({ isOpen, toggle, selected, reveal }),
    [isOpen, toggle, selected, reveal],
  );
  return (
    <StoreUIContext.Provider value={value}>{children}</StoreUIContext.Provider>
  );
}
