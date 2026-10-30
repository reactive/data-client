import React, { useMemo, useState } from 'react';

import { TIME_WIDTH } from './columns';
import { EntityDetail } from './Details';
import { byData, offsetIn, type Scroller } from './dom';
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
  preview,
  SectionBlock,
  useSectionToggles,
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

/** Tables needed before a jump list of them is worth its line */
const INDEX_OVER = 5;

/** The whole store at a glance: a few rows of everything */
export default function RootView({ scroller }: { scroller: Scroller }) {
  const { model, width, push } = useNav()!;
  const shown = useShownSections(model);
  const section = useSectionToggles();
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
      {shown.internals && (
        <SectionBlock {...section('Internals')}>
          <Internals model={model} />
        </SectionBlock>
      )}
    </>
  );
}

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
