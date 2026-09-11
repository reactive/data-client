import type { StateDelta } from './types.js';
import type { State } from '../../types.js';
import { initialState } from '../reducer/initialState.js';

function keysOf(...tables: (object | undefined)[]): Set<string> {
  const keys = new Set<string>();
  for (const table of tables) if (table) for (const k in table) keys.add(k);
  return keys;
}

/**
 * Describes every slot whose reference changed between `emitted` and `state`.
 *
 * Returns `null` when nothing changed. `optimistic` is never included: it is
 * transient and holds non-serializable endpoints.
 */
export function diffState(
  emitted: State<unknown>,
  state: State<unknown>,
): StateDelta | null {
  const delta: StateDelta = { entities: [], endpoints: [], indexes: [] };
  if (state.lastReset !== emitted.lastReset) {
    delta.reset = state.lastReset;
    emitted = initialState;
  }

  for (const key of keysOf(emitted.entities, state.entities)) {
    const prev = emitted.entities[key];
    const prevMeta = emitted.entitiesMeta[key];
    const nextTable = state.entities[key];
    const nextMeta = state.entitiesMeta[key];
    if (prev === nextTable && prevMeta === nextMeta) continue;
    for (const pk of keysOf(prev, nextTable)) {
      const entity = nextTable?.[pk];
      const meta = nextMeta?.[pk];
      if (entity === prev?.[pk] && meta === prevMeta?.[pk]) continue;
      delta.entities.push(
        entity === undefined ?
          { key, pk }
        : { key, pk, value: { entity, meta } },
      );
    }
  }

  for (const key of keysOf(
    emitted.endpoints,
    state.endpoints,
    emitted.meta,
    state.meta,
  )) {
    const endpoint = state.endpoints[key];
    const meta = state.meta[key];
    if (endpoint === emitted.endpoints[key] && meta === emitted.meta[key])
      continue;
    delta.endpoints.push(
      endpoint === undefined && meta === undefined ?
        { key }
      : { key, value: { endpoint, meta } },
    );
  }

  for (const key of keysOf(emitted.indexes, state.indexes)) {
    const prev = emitted.indexes[key];
    const nextTable = state.indexes[key];
    if (prev === nextTable) continue;
    for (const index of keysOf(prev, nextTable)) {
      const value = nextTable?.[index];
      if (value === prev?.[index]) continue;
      delta.indexes.push(
        value === undefined ? { key, index } : { key, index, value },
      );
    }
  }

  return (
      delta.reset !== undefined ||
        delta.entities.length ||
        delta.endpoints.length ||
        delta.indexes.length
    ) ?
      delta
    : null;
}
