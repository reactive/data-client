import type { State } from '@data-client/core';

import { hasKeys, keysOf } from './wire.js';
import type {
  PieceSlots,
  WireEndpointMeta,
  WireEntityMeta,
  WireError,
} from './wire.js';

type Table = { readonly [key: string]: any };
type Tables = { readonly [key: string]: Table | undefined };

/** Slots of `next` that differ from `prev`, or undefined when none do */
export function diffState(
  prev: State<unknown>,
  next: State<unknown>,
): PieceSlots | undefined {
  const slots: PieceSlots = {};
  const entities = diffTables(
    prev.entities,
    next.entities,
    invalidAsZero<object>,
  );
  if (entities) slots.entities = entities;
  const entitiesMeta = diffTables(
    prev.entitiesMeta,
    next.entitiesMeta,
    toWireEntityMeta,
  );
  if (entitiesMeta) slots.entitiesMeta = entitiesMeta;
  if (prev.indexes !== next.indexes) {
    const indexes: NonNullable<PieceSlots['indexes']> = {};
    for (const key of keysOf(prev.indexes, next.indexes)) {
      const diff = removedOr(prev.indexes[key], next.indexes[key], (p, n) =>
        diffTables(p, n, invalidAsZero<string>),
      );
      if (diff !== undefined) indexes[key] = diff;
    }
    if (hasKeys(indexes)) slots.indexes = indexes;
  }
  diffEndpoints(prev, next, slots);
  return hasKeys(slots) ? slots : undefined;
}

/**
 * Writes the endpoint results and metas that changed to `slots`, and lists each key
 * whose result or meta was removed in `x`, sending again whichever of the two is left.
 */
function diffEndpoints(
  prev: State<unknown>,
  next: State<unknown>,
  slots: PieceSlots,
): void {
  if (prev.endpoints === next.endpoints && prev.meta === next.meta) return;
  const endpoints = changedValues(prev.endpoints, next.endpoints, identity);
  const meta = changedValues(prev.meta, next.meta, toWireEndpointMeta);
  const removed = new Set([
    ...removedKeys(prev.endpoints, next.endpoints),
    ...removedKeys(prev.meta, next.meta),
  ]);
  for (const key of removed) {
    if (next.endpoints[key] !== undefined) endpoints[key] = next.endpoints[key];
    if (next.meta[key] !== undefined)
      meta[key] = toWireEndpointMeta(next.meta[key]);
  }
  if (hasKeys(endpoints)) slots.endpoints = endpoints;
  if (hasKeys(meta)) slots.meta = meta;
  if (removed.size) slots.x = [...removed];
}

function changedValues<T>(
  prev: Table,
  next: Table,
  convert: (value: any) => T,
): { [key: string]: T } {
  const out: { [key: string]: T } = {};
  if (prev === next) return out;
  for (const key in next) {
    const value = next[key];
    if (value !== prev[key] && value !== undefined) out[key] = convert(value);
  }
  return out;
}

function removedKeys(prev: Table, next: Table): string[] {
  if (prev === next) return [];
  return Object.keys(prev).filter(
    key => prev[key] !== undefined && next[key] === undefined,
  );
}

/** `null` when `next` lost the table `prev` had; otherwise what `diff` finds between them */
function removedOr<P extends object, D>(
  prev: P | undefined,
  next: P | undefined,
  diff: (prev: P, next: P) => D | undefined,
): D | null | undefined {
  if (next === undefined) return prev === undefined ? undefined : null;
  return diff(prev ?? ({} as P), next);
}

function diffTables<T>(
  prev: Tables,
  next: Tables,
  convert: (value: any) => T,
): { [key: string]: { [pk: string]: T | null } | null } | undefined {
  if (prev === next) return undefined;
  let out: { [key: string]: { [pk: string]: T | null } | null } | undefined;
  for (const key of keysOf(prev, next)) {
    const diff = removedOr(prev[key], next[key], (p, n) =>
      diffTable(p, n, convert),
    );
    if (diff !== undefined) (out ??= {})[key] = diff;
  }
  return out;
}

function diffTable<T>(
  prev: Table,
  next: Table,
  convert: (value: any) => T,
): { [key: string]: T | null } | undefined {
  if (prev === next) return undefined;
  const out: { [key: string]: T | null } = changedValues(prev, next, convert);
  for (const key of removedKeys(prev, next)) out[key] = null;
  return hasKeys(out) ? out : undefined;
}

const identity = <T>(value: T) => value;

/** INVALID is the only symbol an entity or index table holds */
const invalidAsZero = <T>(value: T | symbol): T | 0 =>
  typeof value === 'symbol' ? 0 : value;

const toWireEntityMeta = (meta: WireEntityMeta): WireEntityMeta => ({
  fetchedAt: meta.fetchedAt,
  date: meta.date,
  expiresAt: meta.expiresAt,
});

function toWireEndpointMeta(meta: State<unknown>['meta'][string]) {
  const out: WireEndpointMeta = {
    date: meta.date,
    fetchedAt: meta.fetchedAt,
    expiresAt: meta.expiresAt,
  };
  if (meta.prevExpiresAt !== undefined) out.prevExpiresAt = meta.prevExpiresAt;
  if (meta.error !== undefined) out.error = toWireError(meta.error);
  if (meta.invalidated !== undefined) out.invalidated = meta.invalidated;
  if (meta.errorPolicy !== undefined) out.errorPolicy = meta.errorPolicy;
  return out;
}

function toWireError(error: any): WireError {
  const out: WireError = {
    name: String(error?.name ?? 'Error'),
    message: String(error?.message ?? error),
  };
  if (typeof error?.status === 'number') out.status = error.status;
  return out;
}
