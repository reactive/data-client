import type { State } from '../../types.js';

type Tables = { readonly [key: string]: object | undefined };

function overlayTables<T extends Tables>(live: T, snapshot: T): T {
  const result: { [key: string]: object | undefined } = { ...live };
  for (const key in snapshot) {
    const liveTable = live[key];
    result[key] =
      liveTable && snapshot[key] ?
        { ...liveTable, ...snapshot[key] }
      : snapshot[key];
  }
  return result as T;
}

/**
 * State to hydrate with: every slot the server sent wins, anything else
 * comes from the live store.
 *
 * Slots missing from the snapshot (a delta that never arrived) are then
 * satisfied by a single client fetch instead of suspending on every retry.
 */
export function overlayState(
  snapshot: State<unknown>,
  live: State<unknown>,
): State<unknown> {
  if (snapshot === live) return live;
  return {
    ...live,
    entities: overlayTables(live.entities, snapshot.entities),
    entitiesMeta: overlayTables(live.entitiesMeta, snapshot.entitiesMeta),
    indexes: overlayTables(live.indexes, snapshot.indexes),
    endpoints: { ...live.endpoints, ...snapshot.endpoints },
    meta: { ...live.meta, ...snapshot.meta },
  };
}
