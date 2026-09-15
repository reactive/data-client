import type { StateBaseline, StateDelta } from './types.js';
import { isUnsafeKey } from './writeDelta.js';
import type { State } from '../../types.js';

type Table<T> = { [key: string]: T };

/** Picks, from the snapshot a delta is about to update, the current values of every slot the delta touches */
export function selectBaseline(
  snapshot: State<unknown>,
  delta: StateDelta,
): StateBaseline {
  const entities: Table<Table<unknown>> = {};
  const entitiesMeta: Table<Table<unknown>> = {};
  const endpoints: Table<unknown> = {};
  const meta: Table<unknown> = {};
  const indexes: Table<Table<unknown>> = {};

  for (const { key, pk } of delta.entities) {
    if (isUnsafeKey(key) || isUnsafeKey(pk)) continue;
    const entity = snapshot.entities[key]?.[pk];
    if (entity !== undefined) (entities[key] ??= {})[pk] = entity;
    const entityMeta = snapshot.entitiesMeta[key]?.[pk];
    if (entityMeta !== undefined) (entitiesMeta[key] ??= {})[pk] = entityMeta;
  }
  for (const { key } of delta.endpoints) {
    if (isUnsafeKey(key)) continue;
    if (snapshot.endpoints[key] !== undefined)
      endpoints[key] = snapshot.endpoints[key];
    if (snapshot.meta[key] !== undefined) meta[key] = snapshot.meta[key];
  }
  for (const { key, index } of delta.indexes) {
    if (isUnsafeKey(key) || isUnsafeKey(index)) continue;
    const table = snapshot.indexes[key]?.[index];
    if (table !== undefined) (indexes[key] ??= {})[index] = table;
  }

  return {
    entities,
    entitiesMeta,
    endpoints,
    meta,
    indexes,
    lastReset: snapshot.lastReset,
  } as StateBaseline;
}
