import type { schema } from '@data-client/endpoint';

export function paginatedMerge(existing: any[], incoming: any[]) {
  const existingSet: Set<string> = new Set(existing);
  const mergedList = [...existing];
  for (const pk of incoming) {
    if (!existingSet.has(pk)) mergedList.push(pk);
  }
  return mergedList;
}

/** A page adds to the stored list even when that list is newer than the page.
 *
 * Collection.mergeWithStore() would call merge(incoming, existing) for an older page,
 * putting the page first. paginatedMerge already skips ids the newer list has.
 */
function paginatedMergeWithStore(
  _existingMeta: unknown,
  _incomingMeta: unknown,
  existing: any[],
  incoming: any[],
) {
  return paginatedMerge(existing, incoming);
}

export function createPaginationSchema(
  removeCursor: (...args: readonly any[]) => any[],
  collection: schema.Collection,
) {
  return Object.create(collection, {
    name: {
      value: `Pagination(${collection.schema})`,
    },
    merge: {
      value: paginatedMerge,
    },
    mergeWithStore: {
      value: paginatedMergeWithStore,
    },
    pk: {
      value: function (value: any, parent: any, key: any, args: any[]) {
        return collection.pk.call(
          this,
          value,
          parent,
          key,
          removeCursor(...args),
        );
      },
    },
  });
}
