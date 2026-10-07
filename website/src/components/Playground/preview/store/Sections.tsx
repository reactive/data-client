import clsx from 'clsx';
import React from 'react';

import type { EndpointRow, EntityTable, StoreModel } from './model';
import { splitKey } from './model';
import { plain } from './refs';
import styles from './store.module.css';
import { ROW_LIMIT, sectionId, showAllId, useStoreUI } from './StoreUI';
import { Field } from './Value';

/** Every view shows the same sections; only how rows lay out differs */
export function StoreSections({
  model,
  endpoints,
  renderTable,
}: {
  model: StoreModel;
  endpoints: React.ReactNode;
  renderTable: (table: EntityTable) => React.ReactNode;
}) {
  const entityCount = model.tables.reduce((n, t) => n + t.rows.length, 0);
  return (
    <>
      <OptimisticSection model={model} />
      <Section
        name="endpoints"
        title="Endpoints"
        count={model.endpoints.length}
      >
        {endpoints}
      </Section>
      <Section name="entities" title="Entities" count={entityCount}>
        {model.tables.map(renderTable)}
      </Section>
      <InternalsSection model={model} />
    </>
  );
}

export function EndpointLabel({
  row,
  open,
}: {
  row: EndpointRow;
  open: boolean;
}) {
  return (
    <>
      <Chevron open={open} />
      <span className={styles.method}>{row.method}</span>{' '}
      <span className={styles.trunc}>{row.path}</span>
    </>
  );
}

export function GroupLabel({
  table,
  open,
}: {
  table: EntityTable;
  open: boolean;
}) {
  return (
    <>
      <Chevron open={open} />
      <span className={styles.type}>{table.key}</span>
      <span className={styles.count}>{table.rows.length}</span>
      {table.kind === 'collection' && (
        <span className={styles.kind}>Collection</span>
      )}
    </>
  );
}

export function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<V, string>;
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <div className={styles.seg} role="group" aria-label={label}>
      {(Object.keys(options) as V[]).map(v => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={e => {
            e.stopPropagation();
            onChange(v);
          }}
        >
          {options[v]}
        </button>
      ))}
    </div>
  );
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <span className={clsx(styles.chevron, open && styles.chevronOpen)}>▶</span>
  );
}

/** Collapsible block with a sticky header */
export function Section({
  name,
  title,
  count,
  children,
}: {
  name: string;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const { isOpen, toggle } = useStoreUI();
  const id = sectionId(name);
  const open = isOpen(id);
  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.sectionHeader}
        aria-expanded={open}
        onClick={() => toggle(id)}
      >
        <Chevron open={open} />
        {title}
        {count !== undefined && <span className={styles.count}>{count}</span>}
      </button>
      {open && children}
    </section>
  );
}

/** Props making a row (tr or div) expand on click or Enter/Space */
export function useRowProps(id: string, className?: string) {
  const { isOpen, toggle, selected } = useStoreUI();
  const open = isOpen(id);
  return {
    open,
    props: {
      'data-id': id,
      tabIndex: 0,
      'aria-expanded': open,
      className: clsx(
        styles.row,
        className,
        selected === id && styles.selected,
      ),
      onClick: () => toggle(id),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(id);
        }
      },
    },
  };
}

/** Rows of a table, capped at ROW_LIMIT until "Show all" */
export function useLimitedRows<T>(tableKey: string, rows: readonly T[]) {
  const { isOpen, toggle } = useStoreUI();
  const all = isOpen(showAllId(tableKey));
  const shown = all ? rows : rows.slice(0, ROW_LIMIT);
  const footer =
    rows.length > ROW_LIMIT ?
      <button
        type="button"
        className={styles.showAll}
        onClick={() => toggle(showAllId(tableKey))}
      >
        {all ? 'Show fewer' : `Show all ${rows.length}`}
      </button>
    : null;
  return { shown, footer };
}

function OptimisticSection({ model }: { model: StoreModel }) {
  if (!model.optimistic.length) return null;
  return (
    <Section
      name="optimistic"
      title="Optimistic"
      count={model.optimistic.length}
    >
      {model.optimistic.map((action, i) => (
        <OptimisticRow key={`${action.key}${i}`} action={action} index={i} />
      ))}
    </Section>
  );
}

function OptimisticRow({
  action,
  index,
}: {
  action: StoreModel['optimistic'][number];
  index: number;
}) {
  const { open, props } = useRowProps(`o\u001f${index}`);
  const { method, path } = splitKey(action.key);
  return (
    <>
      <div {...props}>
        <Chevron open={open} />
        <span className={clsx(styles.method, styles.optimistic)}>{method}</span>
        <span className={styles.trunc}>{path}</span>
        <span className={clsx(styles.pill, styles.optimistic)}>
          waiting for server
        </span>
      </div>
      {open && (
        <div className={styles.detail}>
          <Field name="key" node={{ t: 'val', v: action.key }} />
          <Field name="args" node={plain(action.args)} />
          <Field
            name="fetchedAt"
            node={{ t: 'val', v: action.meta.fetchedAt }}
          />
        </div>
      )}
    </>
  );
}

/** Bookkeeping most people never need, collapsed by default */
function InternalsSection({ model }: { model: StoreModel }) {
  return (
    <Section name="internals" title="Internals">
      <div className={styles.detail}>
        <Field name="lastReset" node={{ t: 'val', v: model.lastReset }} />
        <Field name="indexes" node={plain(model.indexes)} />
      </div>
    </Section>
  );
}
