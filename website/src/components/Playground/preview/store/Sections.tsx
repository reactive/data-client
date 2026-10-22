import clsx from 'clsx';
import React, { useContext } from 'react';

import type { EntityTable, StoreModel } from './model';
import { DiffContext } from './nav';
import { plain } from './refs';
import styles from './store.module.css';
import { Field } from './Value';

/** `Post 312`, with a disclosure arrow when `open` is given */
export function GroupLabel({
  table,
  open,
}: {
  table: EntityTable;
  open?: boolean;
}) {
  return (
    <>
      {open !== undefined && <Chevron open={open} />}
      <span className={styles.type}>{table.key}</span>
      <span className={styles.count}>{table.rows.length.toLocaleString()}</span>
      {table.kind === 'collection' && (
        <span className={styles.kind}>Collection</span>
      )}
    </>
  );
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <span className={clsx(styles.chevron, open && styles.chevronOpen)}>▶</span>
  );
}

/** Collapsible block with a sticky header */
export function SectionBlock({
  title,
  count,
  open,
  onToggle,
  chevron = false,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  chevron?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <button
        type="button"
        className={clsx(styles.sectionHeader, !open && styles.closed)}
        aria-expanded={open}
        onClick={onToggle}
      >
        {chevron && <Chevron open={open} />}
        {title}
        {count !== undefined && (
          <span className={styles.count}>{count.toLocaleString()}</span>
        )}
      </button>
      {open && children}
    </section>
  );
}

/** Bookkeeping most people never need */
export function Internals({ model }: { model: StoreModel }) {
  return (
    <div className={styles.detail}>
      <Field name="lastReset" node={{ t: 'val', v: model.lastReset }} />
      <Field name="indexes" node={plain(model.indexes)} />
    </div>
  );
}

/** Which of the store's sections to show, and how many rows its entities
 * hold: a diff leaves out what it has nothing of, and the internals */
export function useShownSections(model: StoreModel) {
  const diff = useContext(DiffContext) !== null;
  const entityCount = model.tables.reduce((n, t) => n + t.rows.length, 0);
  return {
    entityCount,
    endpoints: !diff || model.endpoints.length > 0,
    entities: !diff || entityCount > 0,
    internals: !diff,
  };
}
