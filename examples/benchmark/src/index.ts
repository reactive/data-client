export {
  normalize,
  denormalize,
  WeakEntityMap,
  buildQueryKey,
  denormalizeCached,
  queryMemoized,
} from '@data-client/normalizr';
export * from '@data-client/core';
export { Endpoint, Entity, schema } from '@data-client/endpoint';

export function createLookupEntity(entities: any) {
  return (entityKey: string): { readonly [pk: string]: any } | undefined =>
    entities[entityKey];
}

export function createLookupIndex(indexes: any) {
  return (
    entityKey: string,
    indexName: string,
    indexKey: string,
  ): string | undefined => {
    if (indexes[entityKey]) {
      return indexes[entityKey][indexName][indexKey];
    }
  };
}
