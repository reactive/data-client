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
  const endpoints = diffTable(prev.endpoints, next.endpoints, identity);
  if (endpoints) {
    slots.endpoints = endpoints;
    changed = true;
  }
  const meta = diffTable(prev.meta, next.meta, toWireEndpointMeta);
  if (meta) {
    slots.meta = meta;
    changed = true;
  }
  return changed ? slots : undefined;
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
  let out: { [key: string]: T | null } | undefined;
  for (const key in next) {
    const value = next[key];
    if (value !== prev[key] && value !== undefined)
      (out ??= {})[key] = convert(value);
  }
  for (const key in prev) {
    if (prev[key] !== undefined && next[key] === undefined)
      (out ??= {})[key] = null;
  }
  return out;
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
