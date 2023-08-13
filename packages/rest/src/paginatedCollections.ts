import type { schema } from '@data-client/endpoint';

export function paginatedMerge(existing: any[], incoming: any[]) {
  const existingSet: Set<string> = new Set(existing);
  const mergedList = [...existing];
  for (const pk of incoming) {
    if (!existingSet.has(pk)) mergedList.push(pk);
  }
  return mergedList;
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
