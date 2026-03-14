import { Entity, All, Query, Collection } from '@data-client/endpoint';
import type { PolymorphicInterface } from '@data-client/endpoint';
import { resource } from '@data-client/rest';
import { sortByLabel } from '@shared/data';
import {
  fetchItem as serverFetchItem,
  fetchAuthor as serverFetchAuthor,
  fetchItemList as serverFetchItemList,
  createItem as serverCreateItem,
  updateItem as serverUpdateItem,
  deleteItem as serverDeleteItem,
  updateAuthor as serverUpdateAuthor,
  deleteAuthor as serverDeleteAuthor,
} from '@shared/server';
import { Author } from '@shared/types';

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

class ItemCollection<
  S extends any[] | PolymorphicInterface = any,
  Parent extends any[] = [urlParams: any, body?: any],
> extends Collection<S, Parent> {
  nonFilterArgumentKeys(key: string) {
    return key === 'count';
  }
}

export const ItemResource = resource({
  path: '/items/:id',
  schema: ItemEntity,
  optimistic: true,
  Collection: ItemCollection,
}).extend(Base => ({
  get: Base.get.extend({
    fetch: serverFetchItem as any,
    dataExpiryLength: Infinity,
  }),
  getList: Base.getList.extend({
    fetch: serverFetchItemList,
    dataExpiryLength: Infinity,
  }),
  update: Base.update.extend({
    fetch: ((params: any, body: any) =>
      serverUpdateItem({ ...params, ...body })) as any,
  }),
  delete: Base.delete.extend({
    fetch: serverDeleteItem as any,
  }),
  create: Base.getList.unshift.extend({
    fetch: serverCreateItem as any,
    body: {} as {
      label: string;
      author: Author;
    },
  }),
}));

export const AuthorResource = resource({
  path: '/authors/:id',
  schema: AuthorEntity,
  optimistic: true,
}).extend(Base => ({
  get: Base.get.extend({
    fetch: serverFetchAuthor as any,
    dataExpiryLength: Infinity,
  }),
  update: Base.update.extend({
    fetch: ((params: any, body: any) =>
      serverUpdateAuthor({ ...params, ...body })) as any,
  }),
  delete: Base.delete.extend({
    fetch: serverDeleteAuthor as any,
  }),
}));

// ── DERIVED QUERIES ─────────────────────────────────────────────────────

/** Derived sorted view via Query schema -- globally memoized by MemoCache */
export const sortedItemsQuery = new Query(
  new All(ItemEntity),
  (entries, { limit }: { limit?: number } = {}) => sortByLabel(entries, limit),
);
