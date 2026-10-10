import React, { useMemo, useState } from 'react';

import { TIME_WIDTH } from './columns';
import { EntityDetail } from './Details';
import { byData, offsetIn, toggled } from './dom';
import {
  optimisticId,
  splitKey,
  type EntityRow,
  type EntityTable,
  type StoreModel,
} from './model';
import { useNav } from './nav';
import { plain } from './refs';
import { GroupLabel, Internals, SectionBlock } from './Sections';
import styles from './store.module.css';
import {
  endpointColumns,
  Pager,
  RowsTable,
  tableColumns,
  type Column,
} from './Table';
import { EndpointKey, Inline, Primitive } from './Value';

/** Rows a table shows before "N more"; tables this short show them all */
const PREVIEW_ROWS = 5;
const SHOW_ALL_UNDER = 8;
/** Tables needed before a jump list of them is worth its line */
const INDEX_OVER = 5;

const preview = <T,>(rows: readonly T[]) =>
  rows.length > SHOW_ALL_UNDER ? rows.slice(0, PREVIEW_ROWS) : rows;

/** The whole store at a glance: a few rows of everything */
export default function RootView({
  scroller,
}: {
  scroller: React.RefObject<HTMLElement | null>;
}) {
  const { model, width, push } = useNav()!;
  const [closed, setClosed] = useState<ReadonlySet<string>>(
    () => new Set(['Internals']),
  );
  const section = (title: string, count?: number) => ({
    title,
    count,
    open: !closed.has(title),
    onToggle: () => setClosed(prev => toggled(prev, title)),
  });
  const entityCount = model.tables.reduce((n, t) => n + t.rows.length, 0);
  const endpoints = preview(model.endpoints);
  const hiddenEndpoints = model.endpoints.length - endpoints.length;
  // stays once seen (holding a row's space), so an optimistic update
  // settling doesn't shove everything below back up
  const [showOptimistic, setShowOptimistic] = useState(false);
  if (model.optimistic.length > 0 && !showOptimistic) setShowOptimistic(true);
  return (
    <>
      {showOptimistic && (
        <SectionBlock {...section('Optimistic', model.optimistic.length)}>
          <RowsTable
            columns={optimisticColumns}
            rows={model.optimistic.map(o => ({ ...o, id: optimisticId(o) }))}
            foot={model.optimistic.length === 0 && 'None pending'}
          />
        </SectionBlock>
      )}
      <SectionBlock {...section('Endpoints', model.endpoints.length)}>
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
      </SectionBlock>
      <SectionBlock {...section('Entities', entityCount)}>
        {model.tables.length > INDEX_OVER && (
          <TableIndex model={model} scroller={scroller} />
        )}
        {model.tables.map(table => (
          <Group key={table.key} table={table} />
        ))}
      </SectionBlock>
      <SectionBlock {...section('Internals')}>
        <Internals model={model} />
      </SectionBlock>
    </>
  );
}

/** Jumps to a table further down */
function TableIndex({
  model,
  scroller,
}: {
  model: StoreModel;
  scroller: React.RefObject<HTMLElement | null>;
}) {
  return (
    <div className={styles.tableIndex}>
      {model.tables.map(table => (
        <button
          key={table.key}
          type="button"
          onClick={() => {
            const el = scroller.current;
            const group = el && byData(el, 'table', table.key);
            if (el && group)
              el.scrollTo({ top: offsetIn(el, group), behavior: 'smooth' });
          }}
        >
          <GroupLabel table={table} />
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
  const { columns, pages, more } = useMemo(
    () => tableColumns(table, table.rows, width, page),
    [table, width, page],
  );
  const hidden = table.rows.length - rows.length;
  return (
    <div
      className={styles.group}
      data-table={table.key}
      data-active={active || undefined}
    >
      <div className={styles.groupHeader} onClick={() => setActive(a => !a)}>
        <GroupLabel table={table} />
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
        record={row => <EntityDetail row={row} model={model} />}
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
const optimisticColumns: Column<Optimistic>[] = [
  {
    id: 'key',
    header: 'key',
    width: '40%',
    cell: ({ key }) => (
      <span className={styles.optimistic} title={key}>
        <EndpointKey {...splitKey(key)} />
      </span>
    ),
  },
  {
    id: 'args',
    header: 'args',
    cell: ({ args }) => <Inline node={plain(args)} />,
  },
  {
    id: 'fetchedAt',
    header: 'sent',
    width: TIME_WIDTH,
    cell: ({ fetchedAt }) => <Primitive value={fetchedAt} name="fetchedAt" />,
  },
];
