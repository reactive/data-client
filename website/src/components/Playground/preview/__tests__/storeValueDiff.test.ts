/// <reference types="jest" />
import type { VNode } from '../store/refs';
import { valueDiff, type Part } from '../store/valueDiff';

const ref = (pk: string): VNode => ({ t: 'ref', key: 'Todo', pk });
const list = (...pks: string[]): VNode => ({ t: 'arr', items: pks.map(ref) });
const obj = (entries: Record<string, number>): VNode => ({
  t: 'obj',
  entries: Object.entries(entries).map(([k, v]) => [k, { t: 'val', v }]),
});
/** `+3`, `-1`, `~2` (moved), `2` (same); `k:1>2` (changed) */
const show = (parts: readonly Part[] | undefined) =>
  parts?.map(p => {
    const label =
      p.key ?? (p.node.t === 'ref' ? p.node.pk : JSON.stringify(p.node));
    switch (p.kind) {
      case 'added':
        return `+${label}`;
      case 'removed':
        return `-${label}`;
      case 'moved':
        return `~${label}`;
      case 'changed':
        return `${label}:${(p.was as any).v}>${(p.node as any).v}`;
      default:
        return label;
    }
  });

describe('valueDiff', () => {
  it('shows a push or unshift as the one item', () => {
    expect(show(valueDiff(list('1', '2'), list('1', '2', '3')))).toEqual([
      '1',
      '2',
      '+3',
    ]);
    expect(show(valueDiff(list('1', '2'), list('0', '1', '2')))).toEqual([
      '+0',
      '1',
      '2',
    ]);
  });

  it('shows a removed item where it was, and a moved one where it is', () => {
    expect(show(valueDiff(list('1', '2', '3'), list('1', '3')))).toEqual([
      '1',
      '-2',
      '3',
    ]);
    expect(show(valueDiff(list('1', '2', '3'), list('3', '1', '2')))).toEqual([
      '~3',
      '1',
      '2',
    ]);
  });

  it('compares objects (Values) by key', () => {
    expect(
      show(valueDiff(obj({ a: 1, b: 2, c: 3 }), obj({ a: 1, c: 4, d: 5 }))),
    ).toEqual(['a', '-b', 'c:3>4', '+d']);
  });

  it('leaves a value that changed kind to be shown whole', () => {
    expect(valueDiff(list('1'), obj({ a: 1 }))).toBeUndefined();
    expect(valueDiff({ t: 'val', v: 1 }, { t: 'val', v: 2 })).toBeUndefined();
  });

  it('compares long lists without a quadratic table', () => {
    const many = (n: number, from = 0) =>
      list(...Array.from({ length: n }, (_, i) => `${i + from}`));
    const parts = valueDiff(many(1000), many(1000, 500))!;
    expect(parts.filter(p => p.kind === 'same')).toHaveLength(500);
    expect(parts.filter(p => p.kind === 'added')).toHaveLength(500);
    expect(parts.filter(p => p.kind === 'removed')).toHaveLength(500);
  });
});
