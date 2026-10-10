import type { VNode } from './refs';

/** One item of a list (or entry of an object) compared to before */
export type Part =
  | { readonly kind: 'same'; readonly node: VNode; readonly key?: string }
  | { readonly kind: 'added'; readonly node: VNode; readonly key?: string }
  | { readonly kind: 'removed'; readonly node: VNode; readonly key?: string }
  /** In both, at another place among the others */
  | { readonly kind: 'moved'; readonly node: VNode; readonly key?: string }
  /** An object's entry whose value changed */
  | {
      readonly kind: 'changed';
      readonly key: string;
      readonly was: VNode;
      readonly node: VNode;
    };

/** How a list or object changed item by item, in its new order with removed
 * items where they were; undefined when the two aren't both lists or both
 * objects (the whole value replaced) */
export function valueDiff(was: VNode, now: VNode): readonly Part[] | undefined {
  if (was.t === 'arr' && now.t === 'arr') return listDiff(was.items, now.items);
  if (was.t === 'obj' && now.t === 'obj')
    return entriesDiff(was.entries, now.entries);
}

/** Same data: refs by row, values by what they hold */
export function sameNode(a: VNode, b: VNode): boolean {
  return a === b || nodeKey(a) === nodeKey(b);
}

const keys = new WeakMap<VNode, string>();
/** Identity of an item for matching across the two lists */
function nodeKey(node: VNode): string {
  let key = keys.get(node);
  if (key !== undefined) return key;
  switch (node.t) {
    case 'ref':
      key = `r${node.key}\0${node.pk}`;
      break;
    case 'val':
      key = `v${typeof node.v}\0${String(node.v)}`;
      break;
    case 'arr':
      key = `a[${node.items.map(nodeKey).join(',')}]`;
      break;
    case 'obj':
      key = `o{${node.entries.map(([k, v]) => `${k}:${nodeKey(v)}`).join(',')}}`;
  }
  keys.set(node, key);
  return key;
}

function listDiff(was: readonly VNode[], now: readonly VNode[]): Part[] {
  // the common ends first: a push or unshift leaves little in between
  let start = 0;
  while (
    start < was.length &&
    start < now.length &&
    sameNode(was[start], now[start])
  )
    start++;
  let end = 0;
  while (
    end < was.length - start &&
    end < now.length - start &&
    sameNode(was[was.length - 1 - end], now[now.length - 1 - end])
  )
    end++;
  const a = was.slice(start, was.length - end);
  const b = now.slice(start, now.length - end);
  const middle = middleDiff(a, b);
  // an item both removed and added moved: it shows once, where it is now
  const added = new Set(
    middle.filter(p => p.kind === 'added').map(p => nodeKey(p.node)),
  );
  const removed = new Set(
    middle.filter(p => p.kind === 'removed').map(p => nodeKey(p.node)),
  );
  const parts: Part[] = [];
  for (const p of middle) {
    const key = nodeKey(p.node);
    if (p.kind === 'removed' && added.has(key)) continue;
    parts.push(
      p.kind === 'added' && removed.has(key) ?
        { kind: 'moved', node: p.node }
      : p,
    );
  }
  return [
    ...now.slice(0, start).map(node => ({ kind: 'same', node }) as const),
    ...parts,
    ...now
      .slice(now.length - end)
      .map(node => ({ kind: 'same', node }) as const),
  ];
}

/** What stayed, went and came: each item of `b` matched to one equal item
 * of `a` (in order, for repeats), and the most matches still in order (the
 * longest increasing run of their places in `a`) stayed. O(n log n), so a
 * long list compares item by item too */
function middleDiff(a: readonly VNode[], b: readonly VNode[]): Part[] {
  const places = new Map<string, number[]>();
  a.forEach((node, i) => {
    const key = nodeKey(node);
    const list = places.get(key);
    if (list) list.push(i);
    else places.set(key, [i]);
  });
  const from = b.map(node => places.get(nodeKey(node))?.shift() ?? -1);
  const stayed = increasingRun(from);
  const parts: Part[] = [];
  let i = 0;
  b.forEach((node, j) => {
    if (!stayed.has(j)) {
      parts.push({ kind: 'added', node });
      return;
    }
    for (; i < from[j]; i++) parts.push({ kind: 'removed', node: a[i] });
    parts.push({ kind: 'same', node });
    i++;
  });
  for (; i < a.length; i++) parts.push({ kind: 'removed', node: a[i] });
  // only the ones that didn't stay are removed
  const kept = new Set([...stayed].map(j => from[j]));
  return parts.filter(
    p => p.kind !== 'removed' || !kept.has(a.indexOf(p.node)),
  );
}

/** Indexes of the longest strictly increasing run of `values` (ignoring
 * negatives), by patience sorting */
function increasingRun(values: readonly number[]): Set<number> {
  const tails: number[] = [];
  const prev = new Array<number>(values.length).fill(-1);
  values.forEach((v, j) => {
    if (v < 0) return;
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (values[tails[mid]] < v) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[j] = tails[lo - 1];
    tails[lo] = j;
  });
  const run = new Set<number>();
  for (let j = tails[tails.length - 1] ?? -1; j >= 0; j = prev[j]) run.add(j);
  return run;
}

/** An object's entries by key, in its new order; a dropped key after the
 * one before it */
function entriesDiff(
  was: readonly (readonly [string, VNode])[],
  now: readonly (readonly [string, VNode])[],
): Part[] {
  const before = new Map(was);
  const parts: Part[] = now.map(([key, node]) => {
    const old = before.get(key);
    return (
      old === undefined ? { kind: 'added', key, node }
      : sameNode(old, node) ? { kind: 'same', key, node }
      : { kind: 'changed', key, was: old, node }
    );
  });
  const kept = new Set(now.map(([key]) => key));
  let at = 0;
  for (const [key, node] of was) {
    if (kept.has(key)) {
      at = parts.findIndex(p => p.key === key) + 1;
      continue;
    }
    parts.splice(at++, 0, { kind: 'removed', key, node });
  }
  return parts;
}
