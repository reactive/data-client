/// <reference types="jest" />
import {
  columnWidth,
  idWidth,
  MORE_WIDTH,
  NARROW_WIDTH,
  pageColumns,
} from '../store/columns';
import { entityId, type EntityRow } from '../store/model';
import { plain, type VNode } from '../store/refs';

const row = (pk: string, raw: unknown): EntityRow => ({
  id: entityId('T', pk),
  pk,
  table: 'T',
  raw,
  value: plain(raw),
  meta: undefined,
});
const field = (name: string) => (r: EntityRow) =>
  r.value.t === 'obj' ?
    r.value.entries.find(([k]) => k === name)?.[1]
  : undefined;

describe('store columns', () => {
  it('sizes a column by the widest sampled value, within bounds', () => {
    const rows = [
      row('1', { name: 'Al', createdAt: 1_700_000_000_000, n: 5 }),
      row('2', { name: 'A much longer name than the other', n: 123 }),
    ];
    // never narrower than 48, never wider than the cap
    expect(columnWidth(rows, field('n'), 'n', 560)).toBe(48);
    expect(columnWidth(rows, field('name'), 'name', 560)).toBe(232);
    expect(columnWidth(rows, field('name'), 'name', NARROW_WIDTH - 1)).toBe(
      150,
    );
    // a timestamp shows as a time of day, whatever its digits
    expect(columnWidth(rows, field('createdAt'), 'createdAt', 560)).toBe(
      Math.round(14 * 7.2 + 20),
    );
    // missing values and nested objects have a fixed size
    expect(columnWidth([], field('x'), 'x', 560)).toBe(48);
    expect(columnWidth([row('1', { o: { a: 1 } })], field('o'), 'o', 560)).toBe(
      232,
    );
  });

  it('sizes lists by their first items plus room for the rest', () => {
    const short: VNode = { t: 'arr', items: [{ t: 'val', v: 'a' }] };
    const long: VNode = {
      t: 'arr',
      items: Array.from({ length: 5 }, () => ({ t: 'val', v: 'a' })),
    };
    const refs: VNode = {
      t: 'arr',
      items: [{ t: 'ref', key: 'User', pk: '1' }],
    };
    const width = (node: VNode) =>
      columnWidth([row('1', {})], () => node, 'x', 560);
    expect(width(long)).toBeGreaterThan(width(short) + 44);
    expect(width(refs)).toBeGreaterThan(width(short));
  });

  it('sizes the id column by the prettiest key', () => {
    expect(idWidth([row('1', {})])).toBe(Math.round(7.2 + 32));
    expect(idWidth([row('{"userId":"1"}', {})])).toBe(
      Math.round('userId: 1'.length * 7.2 + 32),
    );
    expect(idWidth([row('x'.repeat(50), {})])).toBe(140);
  });

  it('pages columns to fit, leaving room for the +N column', () => {
    const cols = [{ want: 100 }, { want: 200 }, { want: 150 }, { want: 400 }];
    expect(pageColumns(cols, 50, 1000)).toEqual([cols]);
    const pages = pageColumns(cols, 50, 400);
    expect(pages.map(p => p.map(c => c.want))).toEqual([
      [100, 200],
      [150],
      [400],
    ]);
    // a column wider than a page still gets one
    expect(pageColumns([{ want: 900 }], 50, 400)).toEqual([[{ want: 900 }]]);
    expect(pageColumns([], 50, 400)).toEqual([[]]);
    expect(MORE_WIDTH).toBeGreaterThan(0);
  });
});
