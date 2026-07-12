/**
 * Helpers to enable Immutable compatibility *without* bringing in
 * the 'immutable' package as a dependency.
 *
 * Only imported from `/imm` entries — main bundles must contain no
 * immutable-specific code (see plans/immutablejs-support.md F1).
 */

import type { IDenormalizeDelegate } from '../interface.js';

/**
 * Check if an object is immutable by checking if it has a key specific
 * to the immutable library.
 *
 * Duck-typed against ImmutableJS internals (`__ownerID` for Map,
 * `_map.__ownerID` for Record) — stable across immutable v4–v5 — so
 * 'immutable' stays out of our dependencies.
 *
 * @param  {any} object
 * @return {bool}
 */
export function isImmutable(object: {}): object is {
  get(k: string): any;
  [k: string]: any;
} {
  return !!(
    typeof object.hasOwnProperty === 'function' &&
    (Object.hasOwnProperty.call(object, '__ownerID') || // Immutable.Map
      ((object as any)._map &&
        Object.hasOwnProperty.call((object as any)._map, '__ownerID')))
  ); // Immutable.Record
}

/**
 * Denormalize an immutable object-shaped schema node.
 *
 * On invalid nested members, propagates the first symbol encountered
 * (rather than minting a new one) so identity checks against INVALID
 * work across package boundaries.
 */
export function denormalizeImmutable(
  schema: any,
  input: any,
  delegate: IDenormalizeDelegate,
): any {
  let deleted: symbol | undefined;
  const value = Object.keys(schema).reduce((object, key) => {
    // Immutable maps cast keys to strings on write so we need to ensure
    // we're accessing them using string keys.
    const stringKey = `${key}`;

    const item = delegate.unvisit(schema[stringKey], object.get(stringKey));
    if (typeof item === 'symbol' && deleted === undefined) {
      deleted = item;
    }
    if (object.has(stringKey)) {
      return object.set(stringKey, item);
    } else {
      return object;
    }
  }, input);
  return deleted ?? value;
}
