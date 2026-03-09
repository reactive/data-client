import { Entity, Endpoint } from '@data-client/endpoint';
import type { Author, Item } from '@shared/types';

/** Author entity - shared across items for normalization */
export class AuthorEntity extends Entity {
  id = '';
  login = '';
  name = '';

  pk() {
    return this.id;
  }

  static key = 'AuthorEntity';
}

/** Item entity with nested author */
export class ItemEntity extends Entity {
  id = '';
  label = '';
  author = AuthorEntity;

  pk() {
    return this.id;
  }

  static key = 'ItemEntity';
  static schema = { author: AuthorEntity };
}

/** Endpoint to get a single author by id */
export const getAuthor = new Endpoint(
  (params: { id: string }) =>
    Promise.reject(new Error('Not implemented - use fixtures')),
  {
    schema: AuthorEntity,
    key: (params: { id: string }) => `author:${params.id}`,
  },
);

/** Endpoint to get a single item by id */
export const getItem = new Endpoint(
  (params: { id: string }) =>
    Promise.reject(new Error('Not implemented - use fixtures')),
  {
    schema: ItemEntity,
    key: (params: { id: string }) => `item:${params.id}`,
  },
);

/** Endpoint to get item list - used for fixture seeding */
export const getItemList = new Endpoint(
  () => Promise.reject(new Error('Not implemented - use fixtures')),
  {
    schema: [ItemEntity],
    key: () => 'item:list',
  },
);
