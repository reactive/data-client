/**
 * Helpers to enable Immutable compatibility *without* bringing in
 * the 'immutable' package as a dependency.
 */

import { INVALID } from '../denormalize/symbol.js';

/**
 * Check if an object is immutable by checking if it has a key specific
 * to the immutable library.
 *
 * @param  {any} object
 * @return {bool}
 */
// eslint-disable-next-line @typescript-eslint/ban-types
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
 * Denormalize an immutable entity.
 *
 * @param  {Schema} schema
 * @param  {Immutable.Map|Immutable.Record} input
 * @param  {function} unvisit
 * @param  {function} getDenormalizedEntity
 * @return {Immutable.Map|Immutable.Record}
 */
export function denormalizeImmutable(
  schema: any,
  input: any,
  unvisit: any,
): any {
  let deleted = false;
  const obj = Object.keys(schema).reduce((object, key) => {
    // Immutable maps cast keys to strings on write so we need to ensure
    // we're accessing them using string keys.
    const stringKey = `${key}`;

    const item = unvisit(object.get(stringKey), schema[stringKey]);
    if (typeof item === 'symbol') {
      deleted = true;
    }
    if (object.has(stringKey)) {
      return object.set(stringKey, item);
    } else {
      return object;
    }
  }, input);
  return deleted ? INVALID : obj;
}
