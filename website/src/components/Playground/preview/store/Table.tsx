import clsx from 'clsx';
import React from 'react';

import {
  columnWidth,
  idWidth,
  MORE_WIDTH,
  pageColumns,
  STATUS_WIDTH,
  TIME_WIDTH,
} from './columns';
import { Status } from './Details';
import {
  errorText,
  prettyPk,
  rowLabel,
  type AnyRow,
  type EndpointRow,
  type EntityRow,
  type EntityTable,
} from './model';
import type { VNode } from './refs';
import styles from './store.module.css';
import { Cell, EndpointKey, Inline, Primitive, RowChip } from './Value';

export interface Column<R> {
  readonly id: string;
  readonly header: React.ReactNode;
  /** px, or a percentage; the column without one takes the rest */
  readonly width?: number | string;
  readonly className?: string;
  readonly cell: (row: R) => React.ReactNode;
}

/** Rows that open their record on click; `more` adds a `+N` column that
 * shows the fields not on screen below the row instead */
export function RowsTable<R extends { readonly id: string }>({
  columns,
  rows,
  onOpen,
  more,
  inline,
  onInline,
  record,
  foot,
  before = 0,
  after = 0,
  beforeRef,
}: {
  columns: readonly Column<R>[];
  rows: readonly R[];
  onOpen?: (row: R) => void;
  more?: (row: R) => number;
  inline?: string | null;
  onInline?: (id: string | null) => void;
  record?: (row: R) => React.ReactNode;
  foot?: React.ReactNode;
  /** Heights (px) of rows left out above and below a window, which
   * `beforeRef` measures from */
  before?: number;
  after?: number;
  beforeRef?: React.Ref<HTMLTableRowElement>;
}) {
  const span = columns.length + (more ? 1 : 0);
  return (
    <table className={styles.table}>
      <colgroup>
        {columns.map(c => (
          <col key={c.id} style={{ width: c.width }} />
        ))}
        {more && <col style={{ width: MORE_WIDTH }} />}
      </colgroup>
      <thead>
        <tr>
          {columns.map(c => (
            <th key={c.id} className={c.className}>
              {c.header}
            </th>
          ))}
          {more && <th />}
        </tr>
      </thead>
      <tbody>
        {beforeRef && (
          <tr
            ref={beforeRef}
            className={styles.spacer}
            style={{ height: before }}
          />
        )}
        {rows.map(row => {
          const open = inline === row.id;
          return (
            <React.Fragment key={row.id}>
              <tr
                data-id={row.id}
                tabIndex={onOpen ? 0 : undefined}
                className={clsx(
                  styles.row,
                  !onOpen && styles.inertRow,
                  open && styles.selected,
                )}
                onClick={onOpen && (() => onOpen(row))}
                onKeyDown={
                  onOpen &&
                  (e => {
                    if (e.target === e.currentTarget && e.key === 'Enter')
                      onOpen(row);
                  })
                }
              >
                {columns.map(c => (
                  <td key={c.id} className={c.className}>
                    {c.cell(row)}
                  </td>
                ))}
                {more && (
                  <MoreCell
                    count={more(row)}
                    open={open}
                    onClick={() => onInline?.(open ? null : row.id)}
                  />
                )}
              </tr>
              {open && record && (
                <tr className={styles.recordRow}>
                  <td colSpan={span}>{record(row)}</td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
        {beforeRef && (
          <tr className={styles.spacer} style={{ height: after }} />
        )}
        {foot && (
          <tr className={styles.foot}>
            <td colSpan={span}>{foot}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function MoreCell({
  count,
  open,
  onClick,
}: {
  count: number;
  open: boolean;
  onClick: () => void;
}) {
  if (!count && !open) return <td />;
  return (
    <td
      className={styles.moreCell}
      data-hint={open ? 'hide' : 'show below'}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={open ? 'Hide fields' : `Show ${count} more fields below`}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      {open ? '×' : `+${count}`}
    </td>
  );
}

/** `‹ 1–4 of 9 ›` */
export function Pager({
  pages,
  page,
  onChange,
}: {
  pages: readonly (readonly unknown[])[];
  page: number;
  onChange: (page: number) => void;
}) {
  if (pages.length < 2) return null;
  page = Math.min(page, pages.length - 1);
  const first = pages.slice(0, page).reduce((n, p) => n + p.length, 1);
  const total = pages.reduce((n, p) => n + p.length, 0);
  return (
    <span className={styles.pager}>
      <button
        type="button"
        aria-label="Previous fields"
        disabled={page === 0}
        onClick={e => {
          e.stopPropagation();
          onChange(page - 1);
        }}
      >
        ‹
      </button>
      {pages[page].length > 1 ?
        `${first}–${first + pages[page].length - 1}`
      : first}{' '}
      of {total}
      <button
        type="button"
        aria-label="Next fields"
        disabled={page === pages.length - 1}
        onClick={e => {
          e.stopPropagation();
          onChange(page + 1);
        }}
      >
        ›
      </button>
    </span>
  );
}

const keyLabel = {
  entity: 'id',
  collection: 'args',
  scalar: 'cell',
  unknown: 'key',
} as const;

/** A column before it is fitted: what it wants, and its cell at a width */
interface Spec {
  readonly id: string;
  readonly header: string;
  readonly want: number;
  readonly cell: (row: EntityRow, width: number) => React.ReactNode;
  /** Data the row has that this column shows (counted by `+N` when hidden) */
  readonly has?: (row: EntityRow) => boolean;
}

function field(node: VNode, name: string): VNode | undefined {
  if (node.t !== 'obj') return;
  return node.entries.find(([k]) => k === name)?.[1];
}

/** One column per field (entities) or for the whole value (other tables) */
function dataSpecs(
  table: EntityTable,
  rows: readonly EntityRow[],
  width: number,
): Spec[] {
  if (table.kind !== 'entity') {
    const name = table.kind === 'collection' ? 'items' : 'value';
    return [
      {
        id: name,
        header: name,
        want: columnWidth(rows, row => row.value, name, width),
        cell: (row, w) => (
          <Cell
            node={row.value}
            name={name}
            width={w}
            owner={rowLabel(row)}
            // a Collection holds nothing but its members, so its own record
            // (their table, with its meta) is the list to dive into
            dive={
              table.kind === 'collection' ?
                { kind: 'record', id: row.id }
              : undefined
            }
          />
        ),
        has: () => true,
      },
    ];
  }
  return table.fields.map(name => {
    const value = (row: EntityRow) => field(row.value, name);
    return {
      id: name,
      header: name,
      want: columnWidth(rows, value, name, width),
      cell: (row, w) => {
        const node = value(row);
        return (
          node && (
            <Cell node={node} name={name} width={w} owner={rowLabel(row)} />
          )
        );
      },
      has: row => value(row) !== undefined,
    };
  });
}

/** When each row was fetched and expires */
const metaSpecs: Spec[] = (
  [
    ['fetchedAt', 'fetched'],
    ['expiresAt', 'expires'],
  ] as const
).map(([name, header]) => ({
  id: name,
  header,
  want: TIME_WIDTH,
  cell: row => {
    const v = row.meta?.[name];
    return v === undefined ? null : <Primitive value={v} name={name} />;
  },
}));

/**
 * Columns of `table` that fit `width`, as pages; `withMeta` adds when each
 * row was fetched and expires.
 */
export function tableColumns(
  table: EntityTable,
  rows: readonly EntityRow[],
  width: number,
  page: number,
  withMeta = false,
) {
  const specs = dataSpecs(table, rows, width);
  if (withMeta) specs.push(...metaSpecs);
  const keyWidth =
    table.kind === 'entity' ?
      idWidth(rows)
    : Math.min(idWidth(rows) + 40, Math.round(width * 0.4));
  const pages = pageColumns(specs, keyWidth, width);
  const current = pages[Math.min(page, pages.length - 1)];
  // columns share the room left by the key (and +N) in proportion to what
  // they want; the last one has no width, so it absorbs rounding
  const room = width - keyWidth - (pages.length > 1 ? MORE_WIDTH : 0);
  const scale = room / current.reduce((w, c) => w + c.want, 0);
  const columns: Column<EntityRow>[] = [
    {
      id: 'key',
      header: keyLabel[table.kind],
      width: keyWidth,
      className: styles.key,
      cell: row => prettyPk(row.pk),
    },
    ...current.map((c, i) => {
      const w = c.want * scale;
      return {
        id: c.id,
        header: c.header,
        width: i === current.length - 1 ? undefined : w,
        cell: (row: EntityRow) => c.cell(row, w),
      };
    }),
  ];
  const hidden = specs.filter(c => c.has && !current.includes(c));
  const more =
    pages.length > 1 ?
      (row: EntityRow) => hidden.filter(c => c.has!(row)).length
    : undefined;
  return { columns, pages, more };
}

export function endpointColumns(width: number): Column<EndpointRow>[] {
  const keyWidth = Math.round(width * 0.4);
  return [
    {
      id: 'key',
      header: 'key',
      width: keyWidth,
      cell: row => (
        <span title={row.key}>
          <EndpointKey method={row.method} path={row.path} />
        </span>
      ),
    },
    {
      id: 'status',
      header: 'status',
      width: STATUS_WIDTH,
      cell: row => <Status meta={row.meta} />,
    },
    {
      id: 'value',
      header: 'value',
      cell: row =>
        row.meta?.error && row.value.t === 'val' && row.value.v === undefined ?
          <span className={styles.null}>{errorText(row.meta.error)}</span>
        : <Cell
            node={row.value}
            name="value"
            width={width - keyWidth - STATUS_WIDTH}
            owner={rowLabel(row)}
          />,
    },
  ];
}

/** For lists that mix tables: each row as a ref, then its value */
export function mixedColumns(width: number): Column<AnyRow>[] {
  return [
    {
      id: 'ref',
      header: 'row',
      width: Math.round(width * 0.35),
      cell: row => <RowChip row={row} />,
    },
    {
      id: 'value',
      header: 'value',
      cell: row => <Inline node={row.value} bare />,
    },
  ];
}
