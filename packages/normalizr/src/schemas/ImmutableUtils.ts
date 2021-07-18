/**
 * Helpers to enable Immutable compatibility *without* bringing in
 * the 'immutable' package as a dependency.
 */

/**
 * Check if an object is immutable by checking if it has a key specific
 * to the immutable library.
 *
 * @param  {any} object
 * @return {bool}
 */
export function isImmutable(object: any) {
  return !!(
    object &&
    typeof object.hasOwnProperty === 'function' &&
    (Object.hasOwnProperty.call(object, '__ownerID') || // Immutable.Map
      (object._map && Object.hasOwnProperty.call(object._map, '__ownerID')))
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
  globalKey: any,
): [denormalized: any, found: boolean, deleted: boolean] {
  let found = true;
  let deleted = false;
  return [
    Object.keys(schema).reduce((object, key) => {
      // Immutable maps cast keys to strings on write so we need to ensure
      // we're accessing them using string keys.
      const stringKey = `${key}`;

      const [item, foundItem, deletedItem] = unvisit(
        object.get(stringKey),
        schema[stringKey],
        globalKey,
      );
      if (!foundItem) {
        found = false;
      }
      if (deletedItem) {
        deleted = true;
      }
      if (object.has(stringKey)) {
        return object.set(stringKey, item);
      } else {
        return object;
      }
    }, input),
    found,
    deleted,
  ];
}
