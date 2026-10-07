/// <reference types="jest" />
import { Collection, Entity, schema } from '@data-client/endpoint';
import { actionTypes, type State } from '@data-client/react';

import {
  buildModel,
  endpointId,
  entityId,
  findRow,
  isChanged,
  parseRowId,
  prettyPk,
  referrersOf,
  rowLabel,
  splitKey,
} from '../store/model';
import { membersOf, refsList } from '../store/nav';
import { CIRCULAR, plain, resolve, resolveRow } from '../store/refs';
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

  it('resolves a Query through the schema it wraps', () => {
    const comments = Post.schema.comments;
    const query = new schema.Query(comments, (entries: any) => entries);
    expect(resolve('{"postId":"1"}', query)).toEqual({
      t: 'ref',
      key: '[Comment]',
      pk: '{"postId":"1"}',
    });
  });

  it('keeps id as data when an Entity is keyed by another field', () => {
    class Article extends Entity {
      id = 0;
      slug = '';
      title = '';
      pk() {
        return this.slug;
      }
    }
    const registry = registryFor('k', [Article]);
    registry.learn([User]);
    const model = buildModel(
      {
        ...state,
        entities: {
          Article: { intro: { id: 7, slug: 'intro', title: 'Hi' } },
          User: state.entities.User,
        },
      } as unknown as State<unknown>,
      registry,
    );
    expect(model.table('Article')?.fields).toEqual(['id', 'slug', 'title']);
    expect(model.table('User')?.fields).toEqual(['name']);
  });

  it('lists the members of array and Values Collections', () => {
    const byId = new Collection(new schema.Values(Comment));
    const registry = registryFor('GET https://example.com/posts', [Post]);
    registry.learn(byId);
    const model = buildModel(
      {
        ...state,
        entities: {
          ...state.entities,
          [byId.key]: { '{}': { a: '249' } },
        },
      } as unknown as State<unknown>,
      registry,
    );
    const members = (key: string, pk: string) =>
      membersOf(model, model.table(key)!.get(pk)!);
    expect(members('[Comment]', '{"postId":"1"}')).toEqual({
      kind: 'list',
      label: '[Comment]',
      table: 'Comment',
      pks: ['249'],
    });
    expect(members(byId.key, '{}')).toMatchObject({ pks: ['249'] });
    expect(members('User', '123')).toBeUndefined();
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

  it('links standalone Scalar cells and shows entity-field tuples plainly', () => {
    const scalar = new schema.Scalar({
      lens: (args: any) => args[0]?.portfolio,
      key: 'portfolio',
      entity: User,
    });
    expect(resolve(['User|1|a'], [scalar])).toEqual({
      t: 'arr',
      items: [{ t: 'ref', key: scalar.key, pk: 'User|1|a' }],
    });
    expect(resolve(['1', 'pct', 'User'], scalar)).toEqual({
      t: 'arr',
      items: ['1', 'pct', 'User'].map(v => ({ t: 'val', v })),
    });
  });

  it('keeps error details', () => {
    const error = Object.assign(new TypeError('boom'), { status: 500 });
    const entries = (plain(error) as any).entries.map(([k]: any) => k);
    expect(entries).toEqual(['name', 'message', 'status', 'stack']);
    expect((plain(error) as any).entries[1][1]).toEqual({
      t: 'val',
      v: 'boom',
    });
  });

  it('keeps own error fields once and stops at cycles', () => {
    const error = Object.assign(new Error('boom'), { name: 'HttpError' });
    const keys = (plain(error) as any).entries.map(([k]: any) => k);
    expect(keys).toEqual(['name', 'message', 'stack']);
    const post: any = { id: '1', tags: [] };
    post.author = { id: '2', posts: [post] };
    post.tags.push(post.tags);
    const shared = { n: 1 };
    expect(plain({ post, a: shared, b: shared })).toEqual({
      t: 'obj',
      entries: [
        [
          'post',
          {
            t: 'obj',
            entries: [
              ['id', { t: 'val', v: '1' }],
              ['tags', { t: 'arr', items: [{ t: 'val', v: CIRCULAR }] }],
              [
                'author',
                {
                  t: 'obj',
                  entries: [
                    ['id', { t: 'val', v: '2' }],
                    ['posts', { t: 'arr', items: [{ t: 'val', v: CIRCULAR }] }],
                  ],
                },
              ],
            ],
          },
        ],
        ['a', { t: 'obj', entries: [['n', { t: 'val', v: 1 }]] }],
        ['b', { t: 'obj', entries: [['n', { t: 'val', v: 1 }]] }],
      ],
    });
  });

  it('lists endpoints that only have meta', () => {
    const failed = {
      ...state,
      meta: { 'GET /broken': { error: new Error('x'), date: 1 } },
    } as unknown as State<unknown>;
    const model = buildModel(failed, new SchemaRegistry());
    expect(model.endpoints.map(e => e.key)).toEqual([
      'GET https://example.com/posts',
      'GET /broken',
    ]);
    expect(isChanged(state, failed, endpointId('GET /broken'))).toBe(true);
    expect(
      isChanged(state, failed, endpointId('GET https://example.com/posts')),
    ).toBe(false);
  });

  it('reads row ids back', () => {
    expect(parseRowId(endpointId('GET /posts'))).toEqual({
      kind: 'endpoint',
      key: 'GET /posts',
    });
    expect(parseRowId(entityId('[Comment]', '{"postId":"1"}'))).toEqual({
      kind: 'entity',
      table: '[Comment]',
      pk: '{"postId":"1"}',
    });
    expect(parseRowId('something else')).toBeUndefined();
    const model = buildModel(state, new SchemaRegistry());
    expect(findRow(model, entityId('User', '123'))?.id).toBe(
      entityId('User', '123'),
    );
    expect(findRow(model, endpointId('GET /nope'))).toBeUndefined();
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
      referrersOf(model, entityId(key, pk)).map(rowLabel);
    expect(labels('Post', '1')).toEqual(['GET /posts']);
    expect(labels('User', '123')).toEqual(['Comment 249', 'Post 1']);
    expect(labels('Comment', '249')).toEqual(['[Comment] postId: 1']);
    expect(model.tables.map(t => [t.key, t.kind])).toEqual([
      ['User', 'entity'],
      ['Comment', 'entity'],
      ['[Comment]', 'collection'],
      ['Post', 'entity'],
    ]);
  });

  it('shows unknown schemas as plain values', () => {
    const model = buildModel(state, new SchemaRegistry());
    expect(model.endpoints[0].value).toEqual({
      t: 'arr',
      items: [{ t: 'val', v: '1' }],
    });
    expect(referrersOf(model, entityId('User', '123'))).toEqual([]);
  });

  it('orders Collections after their Entity, orphans next, then Scalars', () => {
    const cell = new schema.Scalar({
      lens: (args: any) => args[0]?.portfolio,
      key: 'portfolio',
      entity: User,
    });
    const registry = registryFor('GET https://example.com/posts', [Post]);
    registry.learn(cell);
    const model = buildModel(
      {
        ...state,
        entities: {
          'Scalar(portfolio)': { 'User|123|a': 1 },
          '[Orphan]': { '{}': ['x'] },
          ...state.entities,
        },
      } as unknown as State<unknown>,
      registry,
    );
    expect(model.tables.map(t => `${t.key}:${t.kind}`)).toEqual([
      'User:entity',
      'Comment:entity',
      '[Comment]:collection',
      'Post:entity',
      '[Orphan]:collection',
      'Scalar(portfolio):scalar',
    ]);
  });

  it('prints Collection args as labels', () => {
    expect(prettyPk('{}')).toBe('all');
    expect(prettyPk('{"userId":"1","page":2}')).toBe('userId: 1, page: 2');
    expect(prettyPk('{not json')).toBe('{not json');
    expect(prettyPk('plain')).toBe('plain');
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

  it('tracks optimistic updates until their response arrives', () => {
    const registry = new SchemaRegistry();
    const dispatch = registry.middleware({} as any)(() => Promise.resolve());
    const endpoint = { getOptimisticResponse: () => 1, sideEffect: true };
    const fetch = (fetchedAt: number) =>
      dispatch({
        type: actionTypes.FETCH,
        key: 'k',
        endpoint,
        args: [fetchedAt],
        meta: { fetchedAt },
      } as any);
    fetch(1);
    fetch(2);
    dispatch({
      type: actionTypes.FETCH,
      key: 'plain',
      endpoint: {},
      args: [],
      meta: { fetchedAt: 3 },
    } as any);
    expect(registry.optimistic.map(o => o.fetchedAt)).toEqual([1, 2]);
    dispatch({
      type: actionTypes.SET_RESPONSE,
      key: 'k',
      endpoint,
      args: [1],
      meta: { fetchedAt: 1 },
    } as any);
    expect(registry.optimistic.map(o => o.fetchedAt)).toEqual([2]);
    expect(buildModel(state, registry).optimistic).toBe(registry.optimistic);
    dispatch({ type: actionTypes.RESET } as any);
    expect(registry.optimistic).toEqual([]);
    // a remounted preview starts over without pending updates
    fetch(4);
    registry.init();
    expect(registry.optimistic).toEqual([]);
  });

  it('finds changed rows', () => {
    const next = {
      ...state,
      entities: {
        ...state.entities,
        User: { 123: { id: '123', name: 'Paul Jones' } },
      },
    };
    expect(isChanged(state, next, entityId('User', '123'))).toBe(true);
    expect(isChanged(state, next, entityId('Post', '1'))).toBe(false);
    // shouldUpdate() can keep the row but still refresh its meta
    const refetched = {
      ...state,
      entitiesMeta: {
        ...state.entitiesMeta,
        Post: { 1: { date: 1, fetchedAt: 1, expiresAt: 2 } },
      },
    };
    expect(isChanged(state, refetched, entityId('Post', '1'))).toBe(true);
  });

  it('learns recursive schemas', () => {
    const tree = new schema.Object({});
    tree.define({ children: [tree], author: User });
    const registry = new SchemaRegistry();
    registry.learn(tree);
    expect(registry.entities.get('User')).toBe(User);
  });

  it('lists a referenced row once', () => {
    const ref = (pk: string) => ({ t: 'ref', key: 'User', pk }) as const;
    expect(refsList([ref('1'), ref('2'), ref('1')], 'x')).toMatchObject({
      pks: ['1', '2'],
    });
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
