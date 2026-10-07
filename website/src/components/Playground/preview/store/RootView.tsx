import clsx from 'clsx';
import React, { useState } from 'react';

import { EntityDetail } from './Details';
import {
  referrersOf,
  splitKey,
  type EntityRow,
  type EntityTable,
  type StoreModel,
} from './model';
import { useNav } from './nav';
import { plain } from './refs';
import styles from './store.module.css';
import {
  endpointColumns,
  Pager,
  RowsTable,
  tableColumns,
  type Column,
} from './Table';
import { Field, Inline, Primitive } from './Value';

/** Rows a table shows before "N more"; tables this short show them all */
const PREVIEW_ROWS = 5;
const SHOW_ALL_UNDER = 8;
/** Tables needed before a jump list of them is worth its line */
const INDEX_OVER = 5;

const preview = <T,>(rows: readonly T[]) =>
  rows.length > SHOW_ALL_UNDER ? rows.slice(0, PREVIEW_ROWS) : rows;

/** The whole store at a glance: a few rows of everything */
export default function RootView() {
  const { model, width, push } = useNav()!;
  const [closed, setClosed] = useState<ReadonlySet<string>>(
    () => new Set(['internals']),
  );
  const section = (name: string, title: string, count: number | undefined) => ({
    name,
    title,
    count,
    open: !closed.has(name),
    onToggle: () =>
      setClosed(prev => {
        const next = new Set(prev);
        if (!next.delete(name)) next.add(name);
        return next;
      }),
  });
  const entityCount = model.tables.reduce((n, t) => n + t.rows.length, 0);
  const endpoints = preview(model.endpoints);
  const hiddenEndpoints = model.endpoints.length - endpoints.length;
  return (
    <>
      {model.optimistic.length > 0 && (
        <Section
          {...section('optimistic', 'Optimistic', model.optimistic.length)}
        >
          <OptimisticTable model={model} />
        </Section>
      )}
      <Section {...section('endpoints', 'Endpoints', model.endpoints.length)}>
        {endpoints.length > 0 && (
          <RowsTable
            columns={endpointColumns(width)}
            rows={endpoints}
            onOpen={row => push({ kind: 'record', id: row.id })}
            foot={
              hiddenEndpoints > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    push({
                      kind: 'list',
                      label: 'Endpoints',
                      ids: model.endpoints.map(e => e.id),
                    })
                  }
                >
                  {hiddenEndpoints.toLocaleString()} more
                </button>
              )
            }
          />
        )}
      </Section>
      <Section {...section('entities', 'Entities', entityCount)}>
        {model.tables.length > INDEX_OVER && <TableIndex model={model} />}
        {model.tables.map(table => (
          <Group key={table.key} table={table} />
        ))}
      </Section>
      <Section {...section('internals', 'Internals', undefined)}>
        <div className={styles.detail}>
          <Field name="lastReset" node={{ t: 'val', v: model.lastReset }} />
          <Field name="indexes" node={plain(model.indexes)} />
        </div>
      </Section>
    </>
  );
}

function Section({
  name,
  title,
  count,
  open,
  onToggle,
  children,
}: {
  name: string;
  title: string;
  count: number | undefined;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section} data-section={name}>
      <button
        type="button"
        className={clsx(styles.sectionHeader, !open && styles.closed)}
        aria-expanded={open}
        onClick={onToggle}
      >
        {title}
        {count !== undefined && (
          <span className={styles.count}>{count.toLocaleString()}</span>
        )}
      </button>
      {open && children}
    </section>
  );
}

/** Jumps to a table further down */
function TableIndex({ model }: { model: StoreModel }) {
  return (
    <div className={styles.tableIndex}>
      {model.tables.map(table => (
        <button
          key={table.key}
          type="button"
          onClick={e => {
            const scroller =
              e.currentTarget.closest<HTMLElement>('[data-level]');
            const group = scroller?.querySelector<HTMLElement>(
              `[data-table="${CSS.escape(table.key)}"]`,
            );
            if (!scroller || !group) return;
            scroller.scrollTo({
              top:
                group.getBoundingClientRect().top -
                scroller.getBoundingClientRect().top +
                scroller.scrollTop,
              behavior: 'smooth',
            });
          }}
        >
          {table.key}
          <span className={styles.count}>
            {table.rows.length.toLocaleString()}
          </span>
        </button>
      ))}
    </div>
  );
}

/** One table: a few rows, its fields paged to fit (the pager shows on hover,
 * or after tapping the header on touch) */
function Group({ table }: { table: EntityTable }) {
  const { model, width, push } = useNav()!;
  const [page, setPage] = useState(0);
  const [inline, setInline] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const rows = preview(table.rows);
  const { columns, pages, more } = tableColumns(table, table.rows, width, page);
  const hidden = table.rows.length - rows.length;
  return (
    <div
      className={styles.group}
      data-table={table.key}
      data-active={active || undefined}
    >
      <div className={styles.groupHeader} onClick={() => setActive(a => !a)}>
        <span className={styles.type}>{table.key}</span>
        <span className={styles.count}>
          {table.rows.length.toLocaleString()}
        </span>
        {table.kind === 'collection' && (
          <span className={styles.kind}>Collection</span>
        )}
        <span className={styles.tool}>
          <Pager pages={pages} page={page} onChange={setPage} />
        </span>
      </div>
      <RowsTable<EntityRow>
        columns={columns}
        rows={rows}
        onOpen={row => push({ kind: 'record', id: row.id })}
        more={more}
        inline={inline}
        onInline={setInline}
        record={row => (
          <EntityDetail row={row} referrers={referrersOf(model).get(row.id)} />
        )}
        foot={
          hidden > 0 && (
            <button
              type="button"
              onClick={() =>
                push({ kind: 'list', table: table.key, label: table.key })
              }
            >
              {hidden.toLocaleString()} more
            </button>
          )
        }
      />
    </div>
  );
}

type Optimistic = StoreModel['optimistic'][number] & { id: string };

/** Updates applied ahead of their response */
function OptimisticTable({ model }: { model: StoreModel }) {
  const columns: Column<Optimistic>[] = [
    {
      id: 'key',
      header: 'key',
      width: '40%',
      cell: ({ key }) => {
        const { method, path } = splitKey(key);
        return (
          <span title={key}>
            <span className={clsx(styles.method, styles.optimistic)}>
              {method}
            </span>{' '}
            {path}
          </span>
        );
      },
    },
    {
      id: 'args',
      header: 'args',
      cell: ({ args }) => <Inline node={plain(args)} />,
    },
    {
      id: 'fetchedAt',
      header: 'sent',
      width: 124,
      cell: ({ fetchedAt }) => <Primitive value={fetchedAt} name="fetchedAt" />,
    },
  ];
  return (
    <RowsTable
      columns={columns}
      rows={model.optimistic.map((o, i) => ({ ...o, id: `o\u001f${i}` }))}
    />
  );
}
