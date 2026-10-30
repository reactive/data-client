import React, {
  useContext,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { EndpointBody, EndpointMeta, EntityDetail, RowMeta } from './Details';
import { offsetIn, type Scroller } from './dom';
import {
  findRow,
  isEndpointRow,
  prettyPk,
  type AnyRow,
  type EntityTable,
  type StoreModel,
} from './model';
import { membersOf, useNav, type ListView as List } from './nav';
import styles from './store.module.css';
import { StoreViewContext } from './storeView';
import {
  endpointColumns,
  mixedColumns,
  Pager,
  RowsTable,
  tableColumns,
  useChangedFields,
  type Column,
} from './Table';
import { EndpointTreeRow, EntityTreeRow } from './TreeView';
import { Block } from './Value';

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
  const { model } = useNav();
  // the State tab's tree view lays out every list as a tree too
  const tree = useContext(StoreViewContext) === 'tree';
  if ('table' in view) {
    const table = model.table(view.table);
    return (
      !table ?
        <>
          {header(null)}
          <Gone />
        </>
      : tree ?
        <TreeList
          view={view}
          table={table}
          scroller={scroller}
          header={header}
        />
      : <TableList
          table={table}
          pks={view.pks}
          scroller={scroller}
          header={header}
        />
    );
  }
  return tree ?
      <TreeList view={view} scroller={scroller} header={header} />
    : <IdList view={view} scroller={scroller} header={header} />;
}

const tableRows = (table: EntityTable, pks: readonly string[] | undefined) =>
  pks ? pks.flatMap(pk => table.get(pk) ?? []) : table.rows;
/** Rows of a list that isn't one table's */
const idRows = (model: StoreModel, view: List): readonly AnyRow[] =>
  'endpoints' in view ? model.endpoints
  : 'ids' in view ? view.ids.flatMap(id => findRow(model, id) ?? [])
  : [];

/** Rows a tree list shows at first, and adds per "N more" */
const TREE_PAGE = 100;

/** A list as tree rows that expand in place, with a filter */
function TreeList({
  view,
  table,
  scroller,
  header,
}: {
  view: List;
  /** The one table a list of `pks` holds */
  table?: EntityTable;
  scroller: Scroller;
  header: Header;
}) {
  const { model } = useNav();
  const [shown, setShown] = useState(TREE_PAGE);
  const all = useMemo(
    (): readonly AnyRow[] =>
      table ?
        tableRows(table, 'pks' in view ? view.pks : undefined)
      : idRows(model, view),
    [model, view, table],
  );
  const { matches, input, status } = useRowFilter(all, scroller);
  return (
    <>
      {header(input)}
      {matches.slice(0, shown).map(row => {
        if (isEndpointRow(row))
          return <EndpointTreeRow key={row.id} row={row} />;
        const rowTable = table ?? model.table(row.table);
        return (
          rowTable && (
            <EntityTreeRow
              key={row.id}
              row={row}
              table={rowTable}
              // among rows of several tables, each names its own
              withTable={!table}
            />
          )
        );
      })}
      {matches.length > shown && (
        <button
          type="button"
          className={styles.treeMore}
          onClick={() => setShown(n => n + TREE_PAGE)}
        >
          {(matches.length - shown).toLocaleString()} more
        </button>
      )}
      {status && <div className={styles.dim}>{status}</div>}
    </>
  );
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
  const { model, width } = useNav();
  const [page, setPage] = useState(0);
  const rows = useMemo(() => tableRows(table, pks), [table, pks]);
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
  view,
  scroller,
  header,
}: {
  view: List;
  scroller: Scroller;
  header: Header;
}) {
  const { model, width } = useNav();
  const rows = useMemo(() => idRows(model, view), [model, view]);
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
  const { push } = useNav();
  const { matches, input, status } = useRowFilter(rows, scroller);
  const [inline, setInline] = useState<string | null>(null);
  const openIndex = useMemo(
    () => (inline ? matches.findIndex(row => row.id === inline) : -1),
    [matches, inline],
  );
  const { start, end, before, after, spacer } = useWindow(
    scroller,
    matches.length,
    openIndex,
  );
  return (
    <>
      {header(
        <>
          {input}
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
        foot={status && <span>{status}</span>}
      />
    </>
  );
}

/** The filter box over `rows`: its input, the rows that match, and how
 * many while a filter is set */
function useRowFilter<R extends AnyRow>(
  rows: readonly R[],
  scroller: Scroller,
) {
  const [filter, setFilter] = useState('');
  const query = useDeferredValue(filter.trim().toLowerCase());
  const matches = useMemo(
    () => (query ? rows.filter(row => searchText(row).includes(query)) : rows),
    [rows, query],
  );
  // a new filter starts from the top
  useLayoutEffect(() => {
    if (scroller) scroller.scrollTop = 0;
  }, [scroller, query]);
  const input = (
    <input
      className={styles.filter}
      value={filter}
      onChange={e => setFilter(e.target.value)}
      placeholder="filter"
      aria-label="Filter rows"
    />
  );
  const status =
    !query ? null
    : matches.length ?
      `${matches.length.toLocaleString()} of ${rows.length.toLocaleString()}`
    : 'no matches';
  return { matches, input, status };
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
function useWindow(scroller: Scroller, count: number, openIndex: number) {
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
    const el = scroller;
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
  const { model } = useNav();
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
              : <Block node={row.value} of={row.id} />}
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
