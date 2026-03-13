import {
  Entity,
  Endpoint,
  All,
  Query,
  Invalidate,
  Collection,
} from '@data-client/endpoint';
import { sortByLabel } from '@shared/data';
import {
  fetchItem as serverFetchItem,
  fetchAuthor as serverFetchAuthor,
  fetchItemList as serverFetchItemList,
  createItem as serverCreateItem,
  updateItem as serverUpdateItem,
  deleteItem as serverDeleteItem,
  createAuthor as serverCreateAuthor,
  updateAuthor as serverUpdateAuthor,
  deleteAuthor as serverDeleteAuthor,
} from '@shared/server';

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

// ── READ ────────────────────────────────────────────────────────────────

export const getAuthor = new Endpoint(serverFetchAuthor, {
  schema: AuthorEntity,
  key: ({ id }: { id: string }) => `author:${id}`,
  dataExpiryLength: Infinity,
});

export const getItem = new Endpoint(serverFetchItem, {
  schema: ItemEntity,
  key: ({ id }: { id: string }) => `item:${id}`,
  dataExpiryLength: Infinity,
});

export const getItemList = new Endpoint(serverFetchItemList, {
  schema: new Collection([ItemEntity]),
  key: () => 'item:list',
  dataExpiryLength: Infinity,
});

// ── CREATE ──────────────────────────────────────────────────────────────

export const createItemEndpoint = new Endpoint(serverCreateItem, {
  schema: getItemList.schema.unshift,
  sideEffect: true,
  key: () => 'item:create',
});

export const createAuthorEndpoint = new Endpoint(serverCreateAuthor, {
  schema: AuthorEntity,
  sideEffect: true,
  key: () => 'author:create',
});

// ── UPDATE ──────────────────────────────────────────────────────────────

export const updateItemEndpoint = new Endpoint(serverUpdateItem, {
  schema: ItemEntity,
  sideEffect: true,
  key: ({ id }: { id: string }) => `item-update:${id}`,
});

export const updateAuthorEndpoint = new Endpoint(serverUpdateAuthor, {
  schema: AuthorEntity,
  sideEffect: true,
  key: ({ id }: { id: string }) => `author-update:${id}`,
});

// ── DELETE ───────────────────────────────────────────────────────────────

export const deleteItemEndpoint = new Endpoint(serverDeleteItem, {
  schema: new Invalidate(ItemEntity),
  sideEffect: true,
  key: ({ id }: { id: string }) => `item-delete:${id}`,
});

export const deleteAuthorEndpoint = new Endpoint(serverDeleteAuthor, {
  schema: new Invalidate(AuthorEntity),
  sideEffect: true,
  key: ({ id }: { id: string }) => `author-delete:${id}`,
});

// ── DERIVED QUERIES ─────────────────────────────────────────────────────

/** Derived sorted view via Query schema -- globally memoized by MemoCache */
export const sortedItemsQuery = new Query(
  new All(ItemEntity),
  (entries, { limit }: { limit?: number } = {}) => sortByLabel(entries, limit),
);

// eslint-disable-next-line @typescript-eslint/no-empty-function
const neverResolve = () => new Promise<any>(() => {});

/** Optimistic mutation - fetch never resolves; getOptimisticResponse applies immediately */
export const updateItemOptimistic = new Endpoint(
  (_params: { id: string; label: string }) => neverResolve(),
  {
    schema: ItemEntity,
    sideEffect: true,
    key: ({ id }: { id: string; label: string }) => `item-optimistic:${id}`,
    getOptimisticResponse(snap: any, params: { id: string; label: string }) {
      const existing = snap.get(ItemEntity, { id: params.id });
      if (!existing) throw snap.abort;
      return { ...existing, label: params.label };
    },
  },
);
