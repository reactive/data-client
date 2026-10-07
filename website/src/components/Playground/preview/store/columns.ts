import { prettyPk, type EntityRow } from './model';
import type { VNode } from './refs';

/** Width of one character: 12px monospace values, 11px chips, 10px spaced
 * uppercase headers */
const CHAR = 7.2;
const CHIP_CHAR = 6.6;
const HEADER_CHAR = 7.5;
/** Cell padding (the outer columns have a little more) */
const PAD = 20;
/** The `+N` column that opens a row's other fields below it */
export const MORE_WIDTH = 38;
/** A time of day, `3:38:36.875 PM` */
export const TIME_WIDTH = 124;
/** A status pill, `fresh 57s` */
export const STATUS_WIDTH = 96;
/** Panels narrower than this get narrower columns (and one-column records,
 * the `@container` query in store.module.css) */
export const NARROW_WIDTH = 480;
/** Rows sampled to size columns */
const SAMPLE = 20;

/** Rough rendered width of a ref chip, in px */
export const chipWidth = (key: string, pk: string) =>
  (key.length + 1 + prettyPk(pk).length) * CHIP_CHAR + 14;

/** Natural single-line width of a value, in px */
function naturalWidth(node: VNode | undefined, name: string): number {
  if (!node) return 0;
  switch (node.t) {
    case 'ref':
      return chipWidth(node.key, node.pk);
    case 'val': {
      const { v } = node;
      if (typeof v === 'string') return (v.length + 2) * CHAR;
      // timestamps show as a time of day
      if (typeof v === 'number' && /(^date|At)$/.test(name)) return 14 * CHAR;
      return String(v).length * CHAR;
    }
    case 'arr': {
      const shown = node.items.slice(0, 3);
      const items = shown.reduce((w, i) => w + naturalWidth(i, '') + 16, 16);
      return node.items.length > shown.length ? items + 44 : items;
    }
    case 'obj':
      return 30 * CHAR;
  }
}

/** How wide a column of `rows`' values should be, capped so a few fit */
export function columnWidth(
  rows: readonly EntityRow[],
  value: (row: EntityRow) => VNode | undefined,
  name: string,
  width: number,
) {
  const narrow = width < NARROW_WIDTH;
  // room for the header too (10px uppercase, spaced)
  let widest = name.length * HEADER_CHAR;
  for (const row of rows.slice(0, SAMPLE))
    widest = Math.max(widest, naturalWidth(value(row), name));
  return Math.round(Math.min(Math.max(widest + PAD, 48), narrow ? 150 : 232));
}

/** Width of an entity table's id column */
export function idWidth(rows: readonly EntityRow[]) {
  let longest = 1;
  for (const row of rows.slice(0, SAMPLE))
    longest = Math.max(longest, prettyPk(row.pk).length);
  return Math.round(Math.min(longest * CHAR + PAD + 12, 140));
}

/**
 * Splits columns into pages that fit `available` px beside the key column;
 * every page holds at least one. Pages leave room for the `+N` column
 * whenever there is more than one.
 */
export function pageColumns<C extends { readonly want: number }>(
  columns: readonly C[],
  keyWidth: number,
  available: number,
): C[][] {
  const total = columns.reduce((w, c) => w + c.want, keyWidth);
  if (total <= available) return [[...columns]];
  const room = available - MORE_WIDTH;
  const pages: C[][] = [];
  let page: C[] = [];
  let used = keyWidth;
  for (const column of columns) {
    if (page.length && used + column.want > room) {
      pages.push(page);
      page = [];
      used = keyWidth;
    }
    page.push(column);
    used += column.want;
  }
  if (page.length) pages.push(page);
  return pages;
}
