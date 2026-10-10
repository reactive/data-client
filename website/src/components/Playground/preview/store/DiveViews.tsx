import React, {
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { EndpointBody, EndpointMeta, EntityDetail, RowMeta } from './Details';
import { offsetIn } from './dom';
import {
  findRow,
  isEndpointRow,
  prettyPk,
  type AnyRow,
  type EntityTable,
} from './model';
import { membersOf, useNav, type ListView as List } from './nav';
import styles from './store.module.css';
import {
  endpointColumns,
  mixedColumns,
  Pager,
  RowsTable,
  tableColumns,
  useChangedFields,
  type Column,
} from './Table';
import { Block } from './Value';

type Scroller = React.RefObject<HTMLElement | null>;
export type Header = (tools: React.ReactNode) => React.ReactNode;

/** Rows rendered beyond the visible ones, on each side */
const OVERSCAN = 20;
/** Row height until one is measured */
const ROW_GUESS = 28;

/** Every row of a table, or of a list of refs, with a filter. Only rows on
 * screen render, so it stays fast at any size */
export function ListView({
  view,
  scroller,
  header,
}: {
  view: List;
  scroller: Scroller;
  header: Header;
}) {
  const { model } = useNav()!;
  if ('table' in view) {
    const table = model.table(view.table);
    return table ?
        <TableList
          table={table}
          pks={view.pks}
          scroller={scroller}
          header={header}
        />
      : <>
          {header(null)}
          <Gone />
        </>;
  }
  return <IdList ids={view.ids} scroller={scroller} header={header} />;
}

/** Rows of one table: its columns, paged, with `+N` and meta columns */
function TableList({
  table,
  pks,
  scroller,
  header,
}: {
  table: EntityTable;
  pks: readonly string[] | undefined;
  scroller: Scroller;
  header: Header;
}) {
  const { model, width } = useNav()!;
  const [page, setPage] = useState(0);
  const rows = useMemo(
    () => (pks ? pks.flatMap(pk => table.get(pk) ?? []) : table.rows),
    [table, pks],
  );
  const changed = useChangedFields(rows);
  const { columns, pages, more } = useMemo(
    () => tableColumns(table, rows, width, page, { withMeta: true, changed }),
    [table, rows, width, page, changed],
  );
  return (
    <FilteredRows
      rows={rows}
      columns={columns}
      more={more}
      record={row => <EntityDetail row={row} model={model} />}
      scroller={scroller}
      header={header}
      tools={<Pager pages={pages} page={page} onChange={setPage} />}
    />
  );
}

/** Rows by id: endpoints, or a mix of tables */
function IdList({
  ids,
  scroller,
  header,
}: {
  ids: readonly string[];
  scroller: Scroller;
  header: Header;
}) {
  const { model, width } = useNav()!;
  const rows = useMemo(
    () => ids.flatMap(id => findRow(model, id) ?? []),
    [model, ids],
  );
  const columns = useMemo(
    () =>
      rows.every(isEndpointRow) ?
        (endpointColumns(width) as Column<AnyRow>[])
      : mixedColumns(width),
    [rows, width],
  );
  return (
    <FilteredRows
      rows={rows}
      columns={columns}
      scroller={scroller}
      header={header}
    />
  );
}

/** A filter box over a windowed table of `rows` */
function FilteredRows<R extends AnyRow>({
  rows,
  columns,
  more,
  record,
  scroller,
  header,
  tools,
}: {
  rows: readonly R[];
  columns: readonly Column<R>[];
  more?: (row: R) => number;
  record?: (row: R) => React.ReactNode;
  scroller: Scroller;
  header: Header;
  tools?: React.ReactNode;
}) {
  const { push } = useNav()!;
  const [filter, setFilter] = useState('');
  const query = useDeferredValue(filter.trim().toLowerCase());
  const [inline, setInline] = useState<string | null>(null);
  const matches = useMemo(
    () => (query ? rows.filter(row => searchText(row).includes(query)) : rows),
    [rows, query],
  );
  const openIndex = useMemo(
    () => (inline ? matches.findIndex(row => row.id === inline) : -1),
    [matches, inline],
  );
  const { start, end, before, after, spacer } = useWindow(
    scroller,
    matches.length,
    openIndex,
  );
  // a new filter starts from the top
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [scroller, query]);

  return (
    <>
      {header(
        <>
          <input
            className={styles.filter}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="filter"
            aria-label="Filter rows"
          />
          {tools}
        </>,
      )}
      <RowsTable
        columns={columns}
        rows={matches.slice(start, end)}
        before={before}
        after={after}
        beforeRef={spacer}
        onOpen={row => push({ kind: 'record', id: row.id })}
        more={more}
        inline={inline}
        onInline={setInline}
        record={record}
        foot={
          query ?
            <span>
              {matches.length ?
                `${matches.length.toLocaleString()} of ${rows.length.toLocaleString()}`
              : 'no matches'}
            </span>
          : null
        }
      />
    </>
  );
}

const Gone = () => (
  <div className={styles.record}>
    <span className={styles.dim}>No longer in the store</span>
  </div>
);

/** Lowercase text a filter matches against, cached with the stored object */
const searchCache = new WeakMap<object, string>();
/** JSON for searching; values JSON can't encode (bigint, cycles) fall back
 * to their pk alone */
function stringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function searchText(row: AnyRow) {
  if (isEndpointRow(row)) return row.key.toLowerCase();
  const key = row.raw && typeof row.raw === 'object' ? row.raw : null;
  let text = key && searchCache.get(key);
  if (text) return text;
  text = `${prettyPk(row.pk)} ${stringify(row.raw)}`.toLowerCase();
  if (key) searchCache.set(key, text);
  return text;
}

/** Which of `count` rows are on screen in `scroller`; an open record
 * (below row `openIndex`) adds its measured height */
function useWindow(
  scroller: React.RefObject<HTMLElement | null>,
  count: number,
  openIndex: number,
) {
  const spacer = useRef<HTMLTableRowElement>(null);
  const rowHeight = useRef(ROW_GUESS);
  const extra = useRef(0);
  const [[start, end], setRange] = useState([0, 2 * OVERSCAN]);

  // measure after each render: a row's height, and the open record's
  useLayoutEffect(() => {
    const row = spacer.current?.nextElementSibling as HTMLElement | null;
    if (row?.dataset.id && row.offsetHeight)
      rowHeight.current = row.offsetHeight;
    const record = spacer.current?.parentElement?.querySelector<HTMLElement>(
      `.${styles.recordRow}`,
    );
    if (record) extra.current = record.offsetHeight;
  });

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      const top = spacer.current;
      if (!top) return;
      const y = el.scrollTop - offsetIn(el, top);
      const h = rowHeight.current;
      let first = y / h;
      if (openIndex >= 0 && first > openIndex + 1)
        first = (y - extra.current) / h;
      const from = Math.min(
        Math.max(0, Math.floor(first) - OVERSCAN),
        Math.max(0, count - 1),
      );
      const to = Math.min(
        count,
        from + Math.ceil(el.clientHeight / h) + 2 * OVERSCAN,
      );
      setRange(prev =>
        prev[0] === from && prev[1] === to ? prev : [from, to],
      );
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [scroller, count, openIndex]);

  const h = rowHeight.current;
  return {
    start,
    end,
    before:
      start * h + (openIndex >= 0 && openIndex < start ? extra.current : 0),
    after:
      Math.max(0, count - end) * h + (openIndex >= end ? extra.current : 0),
    spacer,
  };
}

/** A row's own level: its record, or a Collection's members as a table,
 * with the row's meta at the bottom */
export function RecordLevel({
  id,
  scroller,
  header,
}: {
  id: string;
  scroller: Scroller;
  header: Header;
}) {
  const { model } = useNav()!;
  const row = findRow(model, id);
  const members = useMemo(() => row && membersOf(model, row), [model, row]);
  if (!row)
    return (
      <>
        {header(null)}
        <Gone />
      </>
    );
  return (
    <>
      {members ?
        <ListView view={members} scroller={scroller} header={header} />
      : <>
          {header(null)}
          <div className={styles.record}>
            <div className={styles.detail}>
              {isEndpointRow(row) ?
                <EndpointBody row={row} />
              : <Block node={row.value} />}
            </div>
          </div>
        </>
      }
      <div className={styles.levelFoot}>
        {isEndpointRow(row) ?
          <EndpointMeta row={row} />
        : <RowMeta row={row} model={model} />}
      </div>
    </>
  );
}
