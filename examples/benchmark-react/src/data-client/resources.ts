import { Entity, Endpoint, All, Query } from '@data-client/endpoint';

export class AuthorEntity extends Entity {
  id = '';
  login = '';
  name = '';

  pk() {
    return this.id;
  }

  static key = 'AuthorEntity';
}

export class ItemEntity extends Entity {
  id = '';
  label = '';
  author = AuthorEntity.fromJS();

  pk() {
    return this.id;
  }

  static key = 'ItemEntity';
  static schema = { author: AuthorEntity };
}

export const getAuthor = new Endpoint(
  ({ id: _id }: { id: string }) =>
    Promise.reject(new Error('Not implemented - use fixtures')),
  {
    schema: AuthorEntity,
    key: ({ id }: { id: string }) => `author:${id}`,
  },
);

export const getItem = new Endpoint(
  ({ id: _id }: { id: string }) =>
    Promise.reject(new Error('Not implemented - use fixtures')),
  {
    schema: ItemEntity,
    key: ({ id }: { id: string }) => `item:${id}`,
  },
);

export const getItemList = new Endpoint(
  () => Promise.reject<any>(new Error('Not implemented - use fixtures')),
  {
    schema: [ItemEntity],
    key: () => 'item:list',
  },
);

/** Derived sorted view via Query schema -- globally memoized by MemoCache */
export const sortedItemsQuery = new Query(
  new All(ItemEntity),
  (entries: any[]) => {
    return [...entries].sort((a: any, b: any) =>
      a.label.localeCompare(b.label),
    );
  },
);

// eslint-disable-next-line @typescript-eslint/no-empty-function
const neverResolve = () => new Promise<any>(() => {});

/** Optimistic mutation - fetch never resolves; getOptimisticResponse applies immediately */
export const updateItemOptimistic = new Endpoint(
  (_params: { id: string; label: string }) => neverResolve(),
  {
    schema: ItemEntity,
    sideEffect: true,
    key: ({ id }: { id: string; label: string }) => `item-update:${id}`,
    getOptimisticResponse(snap: any, params: { id: string; label: string }) {
      const existing = snap.get(ItemEntity, { id: params.id });
      if (!existing) throw snap.abort;
      return { ...existing, label: params.label };
    },
  },
);
