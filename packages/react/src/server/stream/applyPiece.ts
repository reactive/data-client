import { __INTERNAL__ } from '@data-client/core';
import type { Mergeable, State } from '@data-client/core';

import { keysOf } from './wire.js';
import type { PieceMessage, WireEntityMeta } from './wire.js';

/** Core's reducer applies an action of this type by calling its `apply` */
export const APPLY = 'rdc/apply' as const;
/** One server piece, carried for devtools, with the reducer that merges it */
export interface PieceAction {
  type: typeof APPLY;
  piece: PieceMessage;
  apply(state: State<unknown>): State<unknown>;
}
type EntityClass = Mergeable & { indexes?: readonly string[] };
/** Entity key to the class that wrote it */
export type ClassMap = Map<string, EntityClass>;

type Table = { [key: string]: any };
type Root = 'entities' | 'entitiesMeta' | 'indexes' | 'endpoints' | 'meta';

const INVALID = __INTERNAL__.INVALID;
const fromWire = (value: unknown) => (value === 0 ? INVALID : value);

/** Merges one piece into live state. Copy-on-write per touched table. */
export function applyPiece(
  state: State<unknown>,
  piece: PieceMessage,
  classes: ClassMap,
  /** `ledger.placed` */
  placed: WeakSet<object>,
  /** `ledger.openedAt`. A state reset at or after it ignores the piece. */
  openedAt: number,
  /** `ledger.noteUnknown`: a client-written record whose class was not learned */
  onUnknown?: (key: string, pk: string) => void,
): State<unknown> {
  if (state.lastReset >= openedAt) return state;
  const w = new Writer(state);
  /** Absent, or still the object a piece placed: no client write to keep */
  const isServerOwned = (held: unknown) =>
    held === undefined ||
    (typeof held === 'object' && held !== null && placed.has(held));
  /** Whether the piece's value was written as sent, per entity key and pk, for the index rows */
  const taken = new Map<string, Map<string, boolean>>();
  const merged: [EntityClass, string, any, any][] = [];
  let keptUnknown = false;

  for (const key of keysOf(piece.entities, piece.entitiesMeta)) {
    const incomingTable = piece.entities?.[key] ?? {};
    const incomingMetaTable = piece.entitiesMeta?.[key] ?? {};
    const cls = classes.get(key);
    const keyTaken = new Map<string, boolean>();
    taken.set(key, keyTaken);
    for (const pk of keysOf(incomingTable, incomingMetaTable)) {
      const incoming = incomingTable[pk];
      const meta = incomingMetaTable[pk];
      const held = state.entities[key]?.[pk];
      const heldMeta = state.entitiesMeta[key]?.[pk];
      const serverOwned = isServerOwned(held);
      const newer = (strict: boolean) =>
        meta != null &&
        (heldMeta === undefined ||
          (strict ?
            meta.fetchedAt > heldMeta.fetchedAt
          : meta.fetchedAt >= heldMeta.fetchedAt));

      let asSent = true;
      if (incoming === undefined) {
        // meta only
        if (serverOwned) w.setMeta(key, pk, meta);
        else asSent = false;
      } else if (incoming === null) {
        if (serverOwned) w.remove(key, pk);
        else asSent = false;
      } else if (incoming === 0) {
        if (serverOwned || held === INVALID || newer(true))
          w.set(key, pk, INVALID, meta ?? heldMeta);
        else asSent = false;
      } else if (serverOwned) {
        w.set(key, pk, incoming, meta ?? heldMeta);
      } else if (held === INVALID) {
        if (newer(false)) w.set(key, pk, incoming, meta);
        else asSent = false;
      } else {
        asSent = false;
        if (cls !== undefined) {
          const incomingMeta = meta ?? heldMeta;
          const next = cls.mergeWithStore(
            heldMeta,
            incomingMeta,
            held,
            incoming,
          );
          w.set(
            key,
            pk,
            next,
            cls.mergeMetaWithStore(heldMeta, incomingMeta, held, incoming),
          );
          merged.push([cls, pk, held, next]);
        } else {
          keptUnknown = true;
          onUnknown?.(key, pk);
        }
      }
      keyTaken.set(pk, asSent);
    }
  }

  const pieceIndexes = piece.indexes ?? {};
  for (const key in pieceIndexes) {
    const keyTaken = taken.get(key);
    for (const indexName in pieceIndexes[key]) {
      const entries = pieceIndexes[key][indexName];
      const current = state.indexes[key]?.[indexName];
      for (const value in entries) {
        const pk = entries[value];
        const target = typeof pk === 'string' ? pk : current?.[value];
        if (
          target !== undefined &&
          !(
            keyTaken?.get(target) ??
            isServerOwned(state.entities[key]?.[target])
          )
        )
          continue;
        if (pk === null) w.removeIndex(key, indexName, value);
        else w.setIndex(key, indexName, value, fromWire(pk));
      }
    }
  }
  // as normalize does for a merged record
  for (const [cls, pk, held, next] of merged) {
    if (!cls.indexes) continue;
    for (const indexName of cls.indexes) {
      const before = held[indexName];
      if (before !== undefined && before !== next[indexName]) {
        w.setIndex(cls.key, indexName, before, INVALID);
      }
      if (indexName in next)
        w.setIndex(cls.key, indexName, next[indexName], pk);
    }
  }

  const removed = new Set(piece.x);
  for (const key of new Set([
    ...removed,
    ...keysOf(piece.endpoints, piece.meta),
  ])) {
    const meta = piece.meta?.[key];
    const clientMeta = state.meta[key];
    // without a meta (another endpoint's update(), a removal), the change is as old as the piece
    if (
      clientMeta !== undefined &&
      clientMeta.fetchedAt > (meta ? meta.fetchedAt : piece.at)
    )
      continue;
    if (removed.has(key)) {
      delete w.top('endpoints')[key];
      delete w.top('meta')[key];
    }
    if (piece.endpoints && key in piece.endpoints)
      w.top('endpoints')[key] = piece.endpoints[key];
    if (meta !== undefined)
      w.top('meta')[key] = keptUnknown ? { ...meta, expiresAt: 0 } : meta;
  }
  return w.done();
}

/** Server state at `rev`: pieces up to `rev` applied as is to empty tables */
export function foldPieces(
  pieces: readonly PieceMessage[],
  rev: number,
  unexpired = false,
): State<unknown> {
  const entities: { [key: string]: Table } = {};
  const entitiesMeta: { [key: string]: Table } = {};
  const indexes: { [key: string]: { [name: string]: Table } } = {};
  const endpoints: Table = {};
  const meta: Table = {};
  const table = (root: { [key: string]: Table }, key: string) =>
    (root[key] ??= {});
  for (const piece of pieces) {
    if (piece.rev > rev) break;
    for (const key in piece.entities) {
      const incoming = piece.entities[key];
      for (const pk in incoming) {
        const value = incoming[pk];
        if (value === null) {
          delete table(entities, key)[pk];
          delete table(entitiesMeta, key)[pk];
        } else table(entities, key)[pk] = fromWire(value);
      }
    }
    for (const key in piece.entitiesMeta) {
      const incoming = piece.entitiesMeta[key];
      for (const pk in incoming) {
        const value = incoming[pk];
        if (value === null) delete table(entitiesMeta, key)[pk];
        else table(entitiesMeta, key)[pk] = value;
      }
    }
    for (const key in piece.indexes) {
      const byName = (indexes[key] ??= {});
      for (const name in piece.indexes[key]) {
        const entries = piece.indexes[key][name];
        const index = (byName[name] ??= {});
        for (const value in entries) {
          const pk = entries[value];
          if (pk === null) delete index[value];
          else index[value] = fromWire(pk);
        }
      }
    }
    for (const key of piece.x ?? []) {
      delete endpoints[key];
      delete meta[key];
    }
    for (const key in piece.endpoints) endpoints[key] = piece.endpoints[key];
    for (const key in piece.meta) meta[key] = piece.meta[key];
  }
  if (unexpired) {
    for (const key in entitiesMeta) {
      const metas = entitiesMeta[key];
      for (const pk in metas)
        metas[pk] = { ...metas[pk], expiresAt: Infinity } as WireEntityMeta;
    }
    for (const key in meta) meta[key] = { ...meta[key], expiresAt: Infinity };
  }
  return {
    entities,
    entitiesMeta,
    indexes,
    endpoints,
    meta,
    optimistic: [],
    lastReset: 0,
  } as any;
}

/** Copy-on-write over the tables a piece touches; untouched tables and records keep identity */
class Writer {
  declare protected state: State<unknown>;
  protected entities: Table;
  protected entitiesMeta: Table;
  protected indexes: Table;
  protected endpoints: Table;
  protected meta: Table;
  protected cloned = new Set<object>();

  constructor(state: State<unknown>) {
    this.state = state;
    this.entities = state.entities;
    this.entitiesMeta = state.entitiesMeta;
    this.indexes = state.indexes;
    this.endpoints = state.endpoints;
    this.meta = state.meta;
  }

  protected copy<T extends object>(value: T | undefined): T {
    if (value !== undefined && this.cloned.has(value)) return value;
    const next = { ...value } as T;
    this.cloned.add(next);
    return next;
  }

  /** Own (cloned once) copy of `this[root]` */
  top(root: Root): Table {
    return (this[root] = this.copy(this[root]));
  }

  /** Own (cloned once) copy of `this[root][key]` */
  protected own(root: Root, key: string): Table {
    const parent = this.top(root);
    return (parent[key] = this.copy(parent[key]));
  }

  set(key: string, pk: string, entity: unknown, meta: unknown) {
    this.own('entities', key)[pk] = entity;
    if (meta !== undefined) this.own('entitiesMeta', key)[pk] = meta;
  }

  setMeta(key: string, pk: string, meta: unknown) {
    if (meta === null) delete this.own('entitiesMeta', key)[pk];
    else this.own('entitiesMeta', key)[pk] = meta;
  }

  remove(key: string, pk: string) {
    delete this.own('entities', key)[pk];
    delete this.own('entitiesMeta', key)[pk];
  }

  protected ownIndex(key: string, indexName: string): Table {
    const byName = this.own('indexes', key);
    return (byName[indexName] = this.copy(byName[indexName]));
  }

  setIndex(key: string, indexName: string, value: string, pk: unknown) {
    this.ownIndex(key, indexName)[value] = pk;
  }

  removeIndex(key: string, indexName: string, value: string) {
    delete this.ownIndex(key, indexName)[value];
  }

  done(): State<unknown> {
    const s = this.state;
    if (this.cloned.size === 0) return s;
    return {
      ...s,
      entities: this.entities as any,
      entitiesMeta: this.entitiesMeta as any,
      indexes: this.indexes as any,
      endpoints: this.endpoints,
      meta: this.meta as any,
    };
  }
}
