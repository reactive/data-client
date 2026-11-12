import type { State } from '@data-client/core';

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
  let changed = false;

  const entities = diffTables(prev.entities, next.entities, toWireEntity);
  if (entities) {
    slots.entities = entities;
    changed = true;
  }
  const entitiesMeta = diffTables(
    prev.entitiesMeta,
    next.entitiesMeta,
    toWireEntityMeta,
  );
  if (entitiesMeta) {
    slots.entitiesMeta = entitiesMeta;
    changed = true;
  }
  if (prev.indexes !== next.indexes) {
    const indexes: NonNullable<PieceSlots['indexes']> = {};
    let any = false;
    for (const key of keysOf(prev.indexes, next.indexes)) {
      const diff = diffTables(
        prev.indexes[key] ?? {},
        next.indexes[key] ?? {},
        toWireIndex,
      );
      if (diff) {
        indexes[key] = diff;
        any = true;
      }
    }
    if (any) {
      slots.indexes = indexes;
      changed = true;
    }
  }
  if (diffEndpoints(prev, next, slots)) changed = true;
  return changed ? slots : undefined;
}

/**
 * Writes the endpoint results and metas that changed to `slots`, and lists each key
 * whose result or meta was removed in `x`, sending again whichever of the two is left.
 */
function diffEndpoints(
  prev: State<unknown>,
  next: State<unknown>,
  slots: PieceSlots,
): boolean {
  if (prev.endpoints === next.endpoints && prev.meta === next.meta)
    return false;
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
  let changed = false;
  if (Object.keys(endpoints).length) {
    slots.endpoints = endpoints;
    changed = true;
  }
  if (Object.keys(meta).length) {
    slots.meta = meta;
    changed = true;
  }
  if (removed.size) {
    slots.x = [...removed];
    changed = true;
  }
  return changed;
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

function keysOf(a: object, b: object): Set<string> {
  return new Set([...Object.keys(a), ...Object.keys(b)]);
}

function diffTables<T>(
  prev: Tables,
  next: Tables,
  convert: (value: any) => T,
): { [key: string]: { [pk: string]: T | null } } | undefined {
  if (prev === next) return undefined;
  let out: { [key: string]: { [pk: string]: T | null } } | undefined;
  for (const key of keysOf(prev, next)) {
    const diff = diffTable(prev[key] ?? {}, next[key] ?? {}, convert);
    if (diff) (out ??= {})[key] = diff;
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
  for (const _ in out) return out;
  return undefined;
}

const identity = <T>(value: T) => value;

/** INVALID is the only symbol an entity table holds */
const toWireEntity = (value: unknown): object | 0 =>
  typeof value === 'symbol' ? 0 : (value as object);

const toWireIndex = (value: unknown): string | 0 =>
  typeof value === 'symbol' ? 0 : (value as string);

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
