import React, { useMemo, useState } from 'react';

import type { LogEntry } from './actionLog';
import { Time, useActions } from './actionParts';
import { isLibraryManager, managerRows, type ManagerRow } from './attribution';
import { NARROW_WIDTH, TIME_WIDTH } from './columns';
import { EntityDetail } from './Details';
import { byData, offsetIn, toggled, type Scroller } from './dom';
import {
  optimisticId,
  type EntityRow,
  type EntityTable,
  type StoreModel,
} from './model';
import { useNav } from './nav';
import { plain } from './refs';
import {
  GroupLabel,
  Internals,
  SectionBlock,
  useShownSections,
} from './Sections';
import styles from './store.module.css';
import {
  endpointColumns,
  Pager,
  RowsTable,
  tableColumns,
  useChangedFields,
  type Column,
} from './Table';
import { EndpointKey, Inline, Primitive } from './Value';
import { splitKey } from '../../splitKey';

/** Rows a table shows before "N more"; tables this short show them all */
const PREVIEW_ROWS = 5;
const SHOW_ALL_UNDER = 8;
/** Tables needed before a jump list of them is worth its line */
const INDEX_OVER = 5;

const preview = <T,>(rows: readonly T[]) =>
  rows.length > SHOW_ALL_UNDER ? rows.slice(0, PREVIEW_ROWS) : rows;

/** The whole store at a glance: a few rows of everything */
export default function RootView({ scroller }: { scroller: Scroller }) {
  const { model, width, push } = useNav()!;
  const shown = useShownSections(model);
  const { history, until } = useActions();
  const chain = history.managers ?? NO_MANAGERS;
  // sections toggled from how they start
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(new Set());
  const startsOpen = (title: string) =>
    title === 'Internals' ? false
      // the managers matter at first glance when the code brought its own
    : title === 'Managers' ? !chain.every(isLibraryManager)
    : true;
  const section = (title: string, count?: number) => ({
    title,
    count,
    open: flipped.has(title) !== startsOpen(title),
    onToggle: () => setFlipped(prev => toggled(prev, title)),
  });
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
      {shown.endpoints && (
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
      )}
      {shown.entities && (
        <SectionBlock {...section('Entities', shown.entityCount)}>
          {model.tables.length > INDEX_OVER && (
            <TableIndex model={model} scroller={scroller} />
          )}
          {model.tables.map(table => (
            <Group key={table.key} table={table} />
          ))}
        </SectionBlock>
      )}
      {shown.managers && chain.length > 0 && (
        <SectionBlock {...section('Managers', chain.length)}>
          <Managers chain={chain} entries={history.entries} until={until} />
        </SectionBlock>
      )}
      {shown.internals && (
        <SectionBlock {...section('Internals')}>
          <Internals model={model} />
        </SectionBlock>
      )}
    </>
  );
}

const NO_MANAGERS: readonly string[] = [];

/** The store's managers in chain order, with what each sent and kept from
 * the rest of the chain up to the moment; a row opens its actions */
function Managers({
  chain,
  entries,
  until,
}: {
  chain: readonly string[];
  entries: readonly LogEntry[];
  until?: number;
}) {
  const { width, push } = useNav()!;
  const rows = useMemo(
    () => managerRows(chain, entries, until),
    [chain, entries, until],
  );
  const columns =
    width < NARROW_WIDTH ? managerColumns.slice(0, -1) : managerColumns;
  return (
    <RowsTable
      columns={columns}
      rows={rows}
      onOpen={row => push({ kind: 'manager', name: row.id })}
    />
  );
}

/** A count, dim when there is none */
const Count = ({ n }: { n: number }) =>
  n ?
    <Primitive value={n} name="count" />
  : <span className={styles.dim}>0</span>;

const managerColumns: Column<ManagerRow>[] = [
  {
    id: 'position',
    header: '#',
    width: 32,
    cell: ({ position }) => <span className={styles.dim}>{position}</span>,
  },
  {
    id: 'manager',
    header: 'manager',
    cell: ({ id }) => <span className={styles.type}>{id}</span>,
  },
  {
    id: 'sent',
    header: 'sent',
    width: 64,
    cell: ({ sent }) => <Count n={sent} />,
  },
  {
    id: 'handled',
    header: 'handled',
    width: 88,
    cell: ({ handled }) => <Count n={handled} />,
  },
  {
    id: 'last',
    header: 'last',
    width: TIME_WIDTH,
    cell: ({ last }) =>
      last === undefined ?
        <span className={styles.dim}>—</span>
      : <Time at={last} />,
  },
];

/** Jumps to a table further down */
function TableIndex({
  model,
  scroller,
}: {
  model: StoreModel;
  scroller: Scroller;
}) {
  return (
    <div className={styles.tableIndex}>
      {model.tables.map(table => (
        <button
          key={table.key}
          type="button"
          onClick={() => {
            if (!scroller) return;
            const group = byData(scroller, 'table', table.key);
            if (group)
              scroller.scrollTo({
                top: offsetIn(scroller, group),
                behavior: 'smooth',
              });
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
  const changed = useChangedFields(table.rows);
  const { columns, pages, more } = useMemo(
    () => tableColumns(table, table.rows, width, page, { changed }),
    [table, width, page, changed],
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
