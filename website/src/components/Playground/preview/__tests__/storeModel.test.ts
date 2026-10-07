/// <reference types="jest" />
import { Collection, Entity, schema } from '@data-client/endpoint';
import { actionTypes, type State } from '@data-client/react';

import { buildModel, changedIds, entityId, splitKey } from '../store/model';
import { resolveRow } from '../store/refs';
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

  it('resolves Values, Object, Lazy and Invalidate members', () => {
    const ref = (key: string, pk: string) => ({ t: 'ref', key, pk });
    expect(resolve({ a: '123' }, new schema.Values(User))).toEqual({
      t: 'obj',
      entries: [['a', ref('User', '123')]],
    });
    expect(
      resolve({ user: '123', n: 1 }, new schema.Object({ user: User })),
    ).toEqual({
      t: 'obj',
      entries: [
        ['user', ref('User', '123')],
        ['n', { t: 'val', v: 1 }],
      ],
    });
    expect(resolve(['123'], new schema.Lazy([User]))).toEqual({
      t: 'arr',
      items: [ref('User', '123')],
    });
    expect(resolve('1', new schema.Invalidate(Post))).toEqual(ref('Post', '1'));
  });

  it('shows Scalar cells as plain values', () => {
    const scalar = new schema.Scalar({
      lens: (args: any) => args[0]?.portfolio,
      key: 'portfolio',
      entity: User,
    });
    expect(resolve(['1', 'pct', 'User'], scalar)).toEqual({
      t: 'arr',
      items: ['1', 'pct', 'User'].map(v => ({ t: 'val', v })),
    });
  });

  it('falls back to plain values when the stored shape does not match', () => {
    const val = (v: unknown) => ({ t: 'val', v });
    expect(resolve('x', new schema.Values(User))).toEqual(val('x'));
    expect(resolve('x', new schema.Array(User))).toEqual(val('x'));
    expect(resolve('x', [User])).toEqual(val('x'));
    expect(resolve({ id: '1' }, User)).toEqual({
      t: 'obj',
      entries: [['id', val('1')]],
    });
    const union = new schema.Union({ users: User }, (i: any) => i.type);
    expect(resolve({ id: '1', schema: 'nope' }, union)).toEqual({
      t: 'obj',
      entries: [
        ['id', val('1')],
        ['schema', val('nope')],
      ],
    });
    expect(resolveRow('x', undefined)).toEqual(val('x'));
    expect(resolveRow('x', User)).toEqual(val('x'));
    expect(resolveRow(['249'], Post.schema.comments)).toEqual({
      t: 'arr',
      items: [{ t: 'ref', key: 'Comment', pk: '249' }],
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

  it('guesses table kinds without a schema', () => {
    const model = buildModel(
      {
        ...state,
        entities: { Thing: { a: { n: 1 } }, '[Thing]': { '{}': ['a'] } },
      } as unknown as State<unknown>,
      new SchemaRegistry(),
    );
    expect(model.tables.map(t => t.kind)).toEqual(['unknown', 'collection']);
  });

  it('records endpoints and schemas from actions', async () => {
    const registry = new SchemaRegistry();
    const next = jest.fn(() => Promise.resolve());
    const dispatch = registry.middleware({} as any)(next);
    await dispatch({
      type: actionTypes.SET_RESPONSE,
      key: 'k',
      endpoint: { schema: [Post] },
      args: [1],
    } as any);
    await dispatch({ type: actionTypes.SET, schema: Comment } as any);
    await dispatch({ type: actionTypes.RESET } as any);
    expect(next).toHaveBeenCalledTimes(3);
    expect(registry.endpoints.get('k')?.args).toEqual([1]);
    expect(registry.entities.get('Comment')).toBe(Comment);
    registry.learn(null);
    registry.cleanup();
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
    expect(splitKey('GET /relative')).toEqual({
      method: 'GET',
      path: '/relative',
    });
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
