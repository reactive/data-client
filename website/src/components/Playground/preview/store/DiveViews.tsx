import React, {
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { EndpointDetail, EntityDetail } from './Details';
import {
  findRow,
  isEndpointId,
  prettyPk,
  referrersOf,
  type EndpointRow,
  type EntityRow,
  type StoreModel,
} from './model';
import { useNav, type View } from './nav';
import styles from './store.module.css';
import {
  endpointColumns,
  mixedColumns,
  Pager,
  RowsTable,
  tableColumns,
  type AnyRow,
  type Column,
} from './Table';

type ListViewProps = Extract<View, { kind: 'list' }>;
type Header = (tools?: React.ReactNode) => React.ReactNode;

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
  view: ListViewProps;
  scroller: React.RefObject<HTMLElement | null>;
  header: Header;
}) {
  const { model, width, push } = useNav()!;
  const [filter, setFilter] = useState('');
  const query = useDeferredValue(filter.trim().toLowerCase());
  const [page, setPage] = useState(0);
  const [inline, setInline] = useState<string | null>(null);

  const table = model.tables.find(
    t => t.key === (view.table ?? tableOf(view.ids)),
  );
  const rows = useMemo(
    () =>
      view.ids ?
        view.ids.flatMap(id => findRow(model, id) ?? [])
      : (table?.rows ?? []),
    [model, view.ids, table],
  );
  const matches = useMemo(
    () => (query ? rows.filter(row => searchText(row).includes(query)) : rows),
    [rows, query],
  );

  let columns: readonly Column<AnyRow>[];
  let more: ((row: AnyRow) => number) | undefined;
  let pages: readonly (readonly unknown[])[] = [];
  if (table) {
    const fit = tableColumns(table, rows as EntityRow[], width, page, true);
    columns = fit.columns as unknown as Column<AnyRow>[];
    more = fit.more as ((row: AnyRow) => number) | undefined;
    pages = fit.pages;
  } else if (rows.every(row => isEndpointId(row.id))) {
    columns = endpointColumns(width) as Column<AnyRow>[];
  } else {
    columns = mixedColumns(width);
  }

  const openIndex = inline ? matches.findIndex(row => row.id === inline) : -1;
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
          <Pager pages={pages} page={page} onChange={setPage} />
        </>,
      )}
      <RowsTable<AnyRow>
        columns={columns}
        rows={matches.slice(start, end)}
        before={before}
        after={after}
        beforeRef={spacer}
        onOpen={row => push({ kind: 'record', id: row.id })}
        more={more}
        inline={inline}
        onInline={setInline}
        record={row => (
          <EntityDetail
            row={row as EntityRow}
            referrers={referrersOf(model).get(row.id)}
          />
        )}
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

/** The one table every id of `ids` is in, if they share one */
function tableOf(ids: readonly string[] | undefined) {
  const [first] = ids ?? [];
  if (!first || isEndpointId(first)) return;
  const prefix = first.slice(0, first.indexOf('\u001f', 2) + 1);
  if (ids!.every(id => id.startsWith(prefix))) return prefix.slice(2, -1);
}

/** Lowercase text a filter matches against, cached with the stored object */
const searchCache = new WeakMap<object, string>();
function searchText(row: AnyRow) {
  if ('key' in row) return row.key.toLowerCase();
  const key = row.raw && typeof row.raw === 'object' ? row.raw : null;
  let text = key && searchCache.get(key);
  if (text) return text;
  text = `${prettyPk(row.pk)} ${JSON.stringify(row.raw)}`.toLowerCase();
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
    if (row?.offsetHeight) rowHeight.current = row.offsetHeight;
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
      const base =
        top.getBoundingClientRect().top -
        el.getBoundingClientRect().top +
        el.scrollTop;
      const y = el.scrollTop - base;
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

/** One row with everything about it */
export function RecordView({ id, header }: { id: string; header: Header }) {
  const { model } = useNav()!;
  const row = findRow(model, id);
  return (
    <>
      {header()}
      <div className={styles.record}>
        {!row ?
          <span className={styles.dim}>No longer in the store</span>
        : isEndpointId(id) ?
          <EndpointDetail row={row as EndpointRow} />
        : <EntityDetail
            row={row as EntityRow}
            referrers={referrersOf(model).get(id)}
          />
        }
      </div>
    </>
  );
}

/** What a breadcrumb shows for a view */
export function crumbLabel(view: View, model: StoreModel): React.ReactNode {
  switch (view.kind) {
    case 'root':
      return 'State';
    case 'list': {
      const count =
        view.ids?.length ??
        model.tables.find(t => t.key === view.table)?.rows.length ??
        0;
      return (
        <>
          <span className={styles.crumbName}>{view.label}</span>
          <span className={styles.count}>{count.toLocaleString()}</span>
        </>
      );
    }
    case 'record': {
      const row = findRow(model, view.id);
      if (!row) return '…';
      if ('key' in row)
        return (
          <>
            <span className={styles.method}>{row.method}</span> {row.path}
          </>
        );
      return (
        <>
          <span className={styles.crumbName}>{row.table}</span>{' '}
          <b>{prettyPk(row.pk)}</b>
        </>
      );
    }
  }
}
