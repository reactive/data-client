import clsx from 'clsx';
import React from 'react';

import {
  columnWidth,
  idWidth,
  MORE_WIDTH,
  pageColumns,
  type ColumnSize,
} from './columns';
import { Status } from './Details';
import {
  isEndpointId,
  prettyPk,
  type EndpointRow,
  type EntityRow,
  type EntityTable,
} from './model';
import type { VNode } from './refs';
import styles from './store.module.css';
import { Cell, Inline, Primitive, RefChip } from './Value';

export type AnyRow = EndpointRow | EntityRow;

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
  /** Heights (px) of rows left out above and below a window */
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
        <tr
          ref={beforeRef}
          className={styles.spacer}
          style={{ height: before }}
        />
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
        <tr className={styles.spacer} style={{ height: after }} />
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

const VALUE = '';
/** A time of day, `3:38:36.875 PM` */
const TIME_WIDTH = 124;
const META = 'meta\u001f';
const metaFields = { fetchedAt: 'fetched', expiresAt: 'expires' } as const;
const keyLabel = {
  entity: 'id',
  collection: 'args',
  scalar: 'cell',
  unknown: 'key',
} as const;

function field(node: VNode, name: string): VNode | undefined {
  if (name === VALUE) return node;
  if (node.t !== 'obj') return;
  return node.entries.find(([k]) => k === name)?.[1];
}

/**
 * Columns of `table` that fit `width`, as pages. Entities get a column per
 * field, other tables one value column; `withMeta` adds when each row was
 * fetched and expires.
 */
export function tableColumns(
  table: EntityTable,
  rows: readonly EntityRow[],
  width: number,
  page: number,
  withMeta = false,
) {
  const narrow = width < 480;
  const fields = table.kind === 'entity' ? table.fields : [VALUE];
  const sizes: ColumnSize[] = fields.map(f => ({
    id: f,
    width: columnWidth(rows, row => field(row.value, f), f, narrow),
  }));
  if (withMeta)
    for (const f of Object.keys(metaFields))
      sizes.push({ id: META + f, width: TIME_WIDTH });
  const keyWidth =
    table.kind === 'entity' ?
      idWidth(rows)
    : Math.min(idWidth(rows) + 40, Math.round(width * 0.4));
  const pages = pageColumns(sizes, keyWidth, width);
  const current = pages[Math.min(page, pages.length - 1)];
  // columns share the room left by the key (and +N) in proportion to what
  // they want; the last one has no width, so it absorbs rounding
  const room = width - keyWidth - (pages.length > 1 ? MORE_WIDTH : 0);
  const scale = room / current.reduce((w, c) => w + c.width, 0);
  const shown = new Set(current.map(c => c.id));
  const columns: Column<EntityRow>[] = [
    {
      id: 'key',
      header: keyLabel[table.kind],
      width: keyWidth,
      className: styles.key,
      cell: row => prettyPk(row.pk),
    },
    ...current.map((c): Column<EntityRow> => ({
      id: c.id,
      header:
        c.id.startsWith(META) ?
          metaFields[c.id.slice(META.length) as keyof typeof metaFields]
        : c.id || (table.kind === 'collection' ? 'items' : 'value'),
      width: c === current[current.length - 1] ? undefined : c.width * scale,
      cell:
        c.id.startsWith(META) ?
          row => {
            const name = c.id.slice(META.length);
            const v = row.meta?.[name as keyof typeof metaFields];
            return v === undefined ? null : <Primitive value={v} name={name} />;
          }
        : row => {
            const node = field(row.value, c.id);
            return (
              node && (
                <Cell
                  node={node}
                  name={c.id || 'items'}
                  width={c.width * scale}
                  owner={`${table.key} ${prettyPk(row.pk)}`}
                />
              )
            );
          },
    })),
  ];
  const more =
    pages.length > 1 ?
      (row: EntityRow) => {
        if (table.kind !== 'entity') return shown.has(VALUE) ? 0 : 1;
        if (row.value.t !== 'obj') return 0;
        return row.value.entries.filter(([k]) => k !== 'id' && !shown.has(k))
          .length;
      }
    : undefined;
  return { columns, pages, more };
}

export function endpointColumns(width: number): Column<EndpointRow>[] {
  const keyWidth = Math.round(width * 0.4);
  const statusWidth = 96;
  return [
    {
      id: 'key',
      header: 'key',
      width: keyWidth,
      cell: row => (
        <span title={row.key}>
          <span className={styles.method}>{row.method}</span> {row.path}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'status',
      width: statusWidth,
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
            width={width - keyWidth - statusWidth}
            owner={`${row.method} ${row.path}`}
          />,
    },
  ];
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/** For lists that mix tables: each row as a ref, then its value */
export function mixedColumns(width: number): Column<AnyRow>[] {
  return [
    {
      id: 'ref',
      header: 'row',
      width: Math.round(width * 0.35),
      cell: row =>
        isEndpointId(row.id) ?
          <RefChip
            id={row.id}
            className={styles.endpointRef}
            label={`${(row as EndpointRow).method} ${(row as EndpointRow).path}`}
          />
        : <RefChip
            id={row.id}
            label={
              <>
                {(row as EntityRow).table}{' '}
                <b>{prettyPk((row as EntityRow).pk)}</b>
              </>
            }
          />,
    },
    {
      id: 'value',
      header: 'value',
      cell: row => <Inline node={row.value} bare />,
    },
  ];
}
