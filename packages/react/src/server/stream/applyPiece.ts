import { __INTERNAL__ } from '@data-client/core';
import type { EntityInterface, State } from '@data-client/core';

import type { PieceMessage, WireEntityMeta } from './wire.js';

/** Core's reducer applies an action of this type by calling its `apply` */
export const APPLY = 'rdc/apply' as const;
/** One server piece, carried for devtools, with the reducer that merges it */
export interface PieceAction {
  type: typeof APPLY;
  piece: PieceMessage;
  apply(state: State<unknown>): State<unknown>;
}
/** Entity key to the class that wrote it */
export type ClassMap = Map<string, EntityInterface>;

type Mergeable = EntityInterface & {
  mergeWithStore(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ): any;
  mergeMetaWithStore(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ): any;
  indexes?: readonly string[];
};
type Table = { [key: string]: any };
type Root = 'entities' | 'entitiesMeta' | 'indexes';
/** What this piece did to a record */
type Outcome = 'taken' | 'merged' | 'kept';

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
  const isPlaced = (value: unknown) =>
    typeof value === 'object' && value !== null && placed.has(value);
  /** Outcome per entity key and pk, for the index rows */
  const outcomes = new Map<string, Map<string, Outcome>>();
  const merged: [Mergeable, string, any, any][] = [];
  let keptUnknown = false;

  for (const key of keysOf(piece.entities, piece.entitiesMeta)) {
    const incomingTable = piece.entities?.[key] ?? {};
    const incomingMetaTable = piece.entitiesMeta?.[key] ?? {};
    const cls = classes.get(key) as Mergeable | undefined;
    const keyOutcomes = new Map<string, Outcome>();
    outcomes.set(key, keyOutcomes);
    for (const pk of keysOf(incomingTable, incomingMetaTable)) {
      const incoming = incomingTable[pk];
      const meta = incomingMetaTable[pk];
      const held = state.entities[key]?.[pk];
      const heldMeta = state.entitiesMeta[key]?.[pk];
      const serverOwned = held === undefined || isPlaced(held);
      const newer = (strict: boolean) =>
        meta != null &&
        (heldMeta === undefined ||
          (strict ?
            meta.fetchedAt > heldMeta.fetchedAt
          : meta.fetchedAt >= heldMeta.fetchedAt));

      if (incoming === undefined) {
        // meta only
        if (serverOwned) {
          w.setMeta(key, pk, meta);
          keyOutcomes.set(pk, 'taken');
        } else keyOutcomes.set(pk, 'kept');
      } else if (incoming === null) {
        if (serverOwned) {
          w.remove(key, pk);
          keyOutcomes.set(pk, 'taken');
        } else keyOutcomes.set(pk, 'kept');
      } else if (incoming === 0) {
        if (serverOwned || held === INVALID || newer(true)) {
          w.set(key, pk, INVALID, meta ?? heldMeta);
          keyOutcomes.set(pk, 'taken');
        } else keyOutcomes.set(pk, 'kept');
      } else if (serverOwned) {
        w.set(key, pk, incoming, meta ?? heldMeta);
        keyOutcomes.set(pk, 'taken');
      } else if (held === INVALID) {
        if (newer(false)) {
          w.set(key, pk, incoming, meta);
          keyOutcomes.set(pk, 'taken');
        } else keyOutcomes.set(pk, 'kept');
      } else if (cls !== undefined) {
        const incomingMeta = meta ?? heldMeta;
        const next = cls.mergeWithStore(heldMeta, incomingMeta, held, incoming);
        w.set(
          key,
          pk,
          next,
          cls.mergeMetaWithStore(heldMeta, incomingMeta, held, incoming),
        );
        keyOutcomes.set(pk, 'merged');
        merged.push([cls, pk, held, next]);
      } else {
        keptUnknown = true;
        onUnknown?.(key, pk);
        keyOutcomes.set(pk, 'kept');
      }
    }
  }

  const pieceIndexes = piece.indexes ?? {};
  for (const key in pieceIndexes) {
    const keyOutcomes = outcomes.get(key);
    for (const indexName in pieceIndexes[key]) {
      const entries = pieceIndexes[key][indexName];
      const current = state.indexes[key]?.[indexName];
      for (const value in entries) {
        const pk = entries[value];
        const target = typeof pk === 'string' ? pk : current?.[value];
        const outcome =
          target === undefined ? 'taken' : (
            (keyOutcomes?.get(target) ??
            (isServerOwned(state, key, target, isPlaced) ? 'taken' : 'kept'))
          );
        if (outcome !== 'taken') continue;
        if (pk === null) w.removeIndex(key, indexName, value);
        else w.setIndex(key, indexName, value, fromWire(pk));
      }
    }
  }
  // as master's normalize does for a merged record
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

  for (const key of keysOf(piece.endpoints, piece.meta)) {
    const meta = piece.meta?.[key];
    const clientMeta = state.meta[key];
    if (
      meta &&
      clientMeta !== undefined &&
      clientMeta.fetchedAt > meta.fetchedAt
    )
      continue;
    if (piece.endpoints && key in piece.endpoints) {
      const value = piece.endpoints[key];
      if (value === null) w.removeEndpoint(key);
      else w.setEndpoint(key, value);
    }
    if (meta === null) w.removeEndpointMeta(key);
    else if (meta !== undefined)
      w.setEndpointMeta(key, keptUnknown ? { ...meta, expiresAt: 0 } : meta);
  }
  return w.done();
}

function isServerOwned(
  state: State<unknown>,
  key: string,
  pk: string,
  isPlaced: (value: unknown) => boolean,
) {
  const held = state.entities[key]?.[pk];
  return held === undefined || isPlaced(held);
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
    for (const key in piece.endpoints) {
      const value = piece.endpoints[key];
      if (value === null) delete endpoints[key];
      else endpoints[key] = value;
    }
    for (const key in piece.meta) {
      const value = piece.meta[key];
      if (value === null) delete meta[key];
      else meta[key] = value;
    }
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

function keysOf(
  a: object | undefined,
  b: object | undefined,
): Iterable<string> {
  if (!b) return Object.keys(a ?? {});
  if (!a) return Object.keys(b);
  return new Set([...Object.keys(a), ...Object.keys(b)]);
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

  /** Own (cloned once) copy of `this[root][key]` */
  protected own(root: Root, key: string): Table {
    const parent = (this[root] = this.copy(this[root]));
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

  setEndpoint(key: string, value: unknown) {
    (this.endpoints = this.copy(this.endpoints))[key] = value;
  }

  removeEndpoint(key: string) {
    delete (this.endpoints = this.copy(this.endpoints))[key];
  }

  setEndpointMeta(key: string, meta: unknown) {
    (this.meta = this.copy(this.meta))[key] = meta;
  }

  removeEndpointMeta(key: string) {
    delete (this.meta = this.copy(this.meta))[key];
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
