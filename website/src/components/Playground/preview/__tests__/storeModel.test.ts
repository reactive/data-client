/// <reference types="jest" />
import { Collection, Entity, schema } from '@data-client/endpoint';
import type { State } from '@data-client/react';

import { buildModel, changedIds, entityId, splitKey } from '../store/model';
import { resolve } from '../store/refs';
import SchemaRegistry from '../store/schemaRegistry';

class User extends Entity {
  id = '';
  name = '';
}
class Comment extends Entity {
  id = '';
  commenter = User.fromJS();
  static schema = { commenter: User };
}
class Post extends Entity {
  id = '';
  author = User.fromJS();
  comments: Comment[] = [];
  static schema = {
    author: User,
    comments: new Collection([Comment], {
      nestKey: (parent: any) => ({ postId: parent.id }),
    }),
  };
}

const state = {
  meta: {},
  entitiesMeta: {},
  indexes: {},
  optimistic: [],
  lastReset: 0,
  endpoints: { 'GET https://example.com/posts': ['1'] },
  entities: {
    User: { 123: { id: '123', name: 'Paul' } },
    Comment: { 249: { id: '249', commenter: '123' } },
    Post: { 1: { id: '1', author: '123', comments: '{"postId":"1"}' } },
    '[Comment]': { '{"postId":"1"}': ['249'] },
  },
} as unknown as State<unknown>;

function registryFor(key: string, s: any) {
  const registry = new SchemaRegistry();
  registry.endpoints.set(key, { endpoint: { schema: s }, args: [] });
  registry.learn(s);
  return registry;
}

describe('store model', () => {
  it('learns every entity table reachable from an endpoint schema', () => {
    const registry = registryFor('k', [Post]);
    expect([...registry.entities.keys()].sort()).toEqual(
      ['Comment', 'Post', 'User', '[Comment]'].sort(),
    );
  });

  it('resolves references through Collections and Unions', () => {
    const union = new schema.Union(
      { users: User, posts: Post },
      (input: any) => input.type,
    );
    expect(resolve({ id: '1', schema: 'posts' }, union)).toEqual({
      t: 'ref',
      key: 'Post',
      pk: '1',
    });
    expect(resolve([{ id: '123', schema: 'users' }], [union])).toEqual({
      t: 'arr',
      items: [{ t: 'ref', key: 'User', pk: '123' }],
    });
  });

  it('indexes who references each entity', () => {
    const model = buildModel(
      state,
      registryFor('GET https://example.com/posts', [Post]),
    );
    const labels = (key: string, pk: string) =>
      model.referrers.get(entityId(key, pk))?.map(r => r.label);
    expect(labels('Post', '1')).toEqual(['GET /posts']);
    expect(labels('User', '123')).toEqual(['Comment 249', 'Post 1']);
    expect(labels('Comment', '249')).toEqual(['[Comment] {"postId":"1"}']);
    expect(model.tables.map(t => [t.key, t.kind])).toEqual([
      ['User', 'entity'],
      ['Comment', 'entity'],
      ['Post', 'entity'],
      ['[Comment]', 'collection'],
    ]);
  });

  it('shows unknown schemas as plain values', () => {
    const model = buildModel(state, new SchemaRegistry());
    expect(model.endpoints[0].value).toEqual({
      t: 'arr',
      items: [{ t: 'val', v: '1' }],
    });
    expect(model.referrers.size).toBe(0);
  });

  it('finds changed rows', () => {
    const next = {
      ...state,
      entities: {
        ...state.entities,
        User: { 123: { id: '123', name: 'Paul Jones' } },
      },
    };
    expect([...changedIds(state, next)]).toEqual([entityId('User', '123')]);
  });

  it('splits endpoint keys', () => {
    expect(splitKey('GET https://example.com/posts?page=2')).toEqual({
      method: 'GET',
      path: '/posts?page=2',
    });
    expect(splitKey('custom key')).toEqual({
      method: '',
      path: 'custom key',
    });
  });
});
