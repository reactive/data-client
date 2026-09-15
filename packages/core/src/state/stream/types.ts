import type { State } from '../../types.js';

type EntityMeta = State<unknown>['entitiesMeta'][string][string];
type EndpointMeta = State<unknown>['meta'][string];

/** An entity that changed. Absent `value` means it was removed. */
export interface EntityChange {
  key: string;
  pk: string;
  value?: { entity?: unknown; meta?: EntityMeta };
}

/** An endpoint result that changed. Absent `value` means it was removed. */
export interface EndpointChange {
  key: string;
  value?: { endpoint?: unknown; meta?: EndpointMeta };
}

/** An index lookup table that changed. Absent `value` means it was removed. */
export interface IndexChange {
  key: string;
  index: string;
  value?: { readonly [lookup: string]: string };
}

/**
 * Serializable description of how State changed between two points in time.
 *
 * Streamed from server to client while rendering so the client can hydrate
 * with exactly the data each piece of HTML was rendered from.
 * @see https://dataclient.io/docs/api/Actions#hydrate
 */
export interface StateDelta {
  entities: EntityChange[];
  endpoints: EndpointChange[];
  indexes: IndexChange[];
  /** Set when the store was reset; the changes then apply on top of an empty store */
  reset?: number;
}

/**
 * Values the client previously received for the slots a StateDelta changes.
 *
 * Only the changed slots are populated. `lastReset` is what the server had
 * when the delta was produced.
 */
export type StateBaseline = Pick<
  State<unknown>,
  'entities' | 'entitiesMeta' | 'endpoints' | 'meta' | 'indexes' | 'lastReset'
>;
