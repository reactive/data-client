/// <reference types="jest" />
import { Endpoint, Entity, schema } from '@data-client/endpoint';
import {
  __INTERNAL__,
  actionTypes,
  Controller,
  type ActionTypes,
  type Manager,
  type State,
} from '@data-client/react';

import { diffStates } from '../store/actionGroups';
import ActionLog, { type LogEntry } from '../store/actionLog';
import { endpointId, entityId } from '../store/model';

const { createReducer, initialState, MemoCache } = __INTERNAL__;

class Post extends Entity {
  id = '';
  title = '';
}
class User extends Entity {
  id = '';
  name = '';
}
class Comment extends Entity {
  id = '';
  author = User.fromJS();
  static schema = { author: User };
}
const getPost = new Endpoint(
  async ({ id }: { id: string }) => ({ id, title: `Post ${id}` }),
  {
    schema: Post,
    key: ({ id }: { id: string }) => `GET /posts/${id}`,
    name: 'getPost',
  },
);
const getComment = new Endpoint(
  async ({ id }: { id: string }) => ({ id, author: { id: 'u1', name: 'Ann' } }),
  {
    schema: Comment,
    key: ({ id }: { id: string }) => `GET /comments/${id}`,
    name: 'getComment',
  },
);
const deleteUser = new Endpoint(async ({ id }: { id: string }) => ({ id }), {
  schema: new schema.Invalidate(User),
  sideEffect: true,
  key: ({ id }: { id: string }) => `DELETE /users/${id}`,
  name: 'deleteUser',
});

const getPosts = new Endpoint(async () => [] as { id: string }[], {
  schema: [Post],
  key: () => 'GET /posts',
  name: 'getPosts',
});
/** Adds its post to `getPosts`' list, as `update` does */
const createPost = new Endpoint(
  async (body: { id: string; title: string }) => body,
  {
    schema: Post,
    sideEffect: true,
    key: () => 'POST /posts',
    name: 'createPost',
    update: (id: string) => ({
      [getPosts.key()]: (ids: string[] = []) => [...ids, id],
    }),
  },
);
/** Shows its title at once, before the server answers */
const renamePost = new Endpoint(
  async ({ id }: { id: string }, body: { title: string }) => ({ id, ...body }),
  {
    schema: Post,
    sideEffect: true,
    key: ({ id }: { id: string }) => `PATCH /posts/${id}`,
    name: 'renamePost',
    getOptimisticResponse: (
      _snap: unknown,
      { id }: { id: string },
      body: { title: string },
    ) => ({ id, ...body }),
  },
);

/** Stores comment c1, by user u1 */
const storeComment = (controller: Controller) =>
  controller.setResponse(
    getComment,
    { id: 'c1' },
    { id: 'c1', author: { id: 'u1', name: 'Ann' } },
  );

/** A store already holding `posts` responses, its actions logged by the
 * log's own head and tail, around `managers` */
function store(posts: number, managers: Manager[] = []) {
  const log = new ActionLog({ trimEvery: 10_000 });
  const { head, tail, track } = log.connect(0);
  let state: State<unknown> = initialState;
  const controller = new Controller({
    getState: () => state,
    dispatch: (action: ActionTypes) => {
      chain(action);
      return Promise.resolve();
    },
  });
  const reduce = createReducer(controller);
  const now = Date.now();
  for (let i = 0; i < posts; i++)
    state = reduce(state, {
      type: actionTypes.SET_RESPONSE,
      endpoint: getPost,
      args: [{ id: `${i}` }],
      key: getPost.key({ id: `${i}` }),
      response: { id: `${i}`, title: `Post ${i}` },
      meta: { date: now, fetchedAt: now, expiresAt: now + 60_000 },
    } as ActionTypes);
  const chain = [head, ...track(managers), tail].reduceRight(
    (next, manager) => manager.middleware(controller)(next),
    (action: ActionTypes) => {
      state = reduce(state, action);
      return Promise.resolve();
    },
  );
  const entries = () => log.history(0).entries;
  return {
    controller,
    log,
    entries,
    last: () => entries().at(-1)!,
  };
}

/** `state` reading its endpoint tables through counters */
function counted(state: State<unknown>, count: { reads: number }) {
  const table = <T extends object>(target: T): T =>
    new Proxy(target, {
      get(t, key, receiver) {
        count.reads++;
        return Reflect.get(t, key, receiver);
      },
      has(t, key) {
        count.reads++;
        return Reflect.has(t, key);
      },
      ownKeys(t) {
        const keys = Reflect.ownKeys(t);
        count.reads += keys.length;
        return keys;
      },
    });
  return {
    ...state,
    endpoints: table(state.endpoints),
    meta: table(state.meta),
  };
}

/** Endpoint table reads diffing `entry` takes */
function diffReads(log: ActionLog, entry: LogEntry) {
  const count = { reads: 0 };
  const { before, after } = entry.store!;
  log.changes({
    ...entry,
    store: {
      ...entry.store!,
      before: counted(before, count),
      after: counted(after, count),
    },
  });
  return count.reads;
}

describe('the action log at scale', () => {
  it.each([
    [
      'setResponse',
      (c: Controller) =>
        c.setResponse(getPost, { id: '1' }, { id: '1', title: 'Edited' }),
    ],
    ['invalidate', (c: Controller) => c.invalidate(getPost, { id: '1' })],
    [
      'set',
      (c: Controller) => c.set(Post, { id: '1' }, { id: '1', title: 'Set' }),
    ],
  ] as const)(
    'diffs %s in the same work with thousands of endpoints',
    (_, act) => {
      const reads = [10, 5000].map(n => {
        const { controller, log, last } = store(n);
        act(controller);
        return diffReads(log, last());
      });
      expect(reads[1]).toBe(reads[0]);
    },
  );

  it('diffs the action a manager passed on in place of the one sent', () => {
    const redirect: Manager = {
      middleware: () => next => action =>
        next(
          action.type === actionTypes.INVALIDATE ?
            { ...action, key: getPost.key({ id: '2' }) }
          : action,
        ),
      cleanup() {},
    };
    const { controller, log, last } = store(3, [redirect]);
    controller.invalidate(getPost, { id: '1' });
    expect(last().action).toMatchObject({ key: getPost.key({ id: '1' }) });
    expect(log.changes(last()).map(c => [c.id, c.kind])).toEqual([
      [endpointId(getPost.key({ id: '2' })), 'invalidated'],
    ]);
  });

  it('finds the rows a full diff finds, with updates and optimistic ones', () => {
    const { controller, log, entries } = store(3);
    controller.setResponse(getPosts, [{ id: '0', title: 'Post 0' }]);
    controller.setResponse(
      createPost,
      { id: '9', title: 'New' },
      { id: '9', title: 'New' },
    );
    void controller.fetch(renamePost, { id: '1' }, { title: 'Soon' });
    controller.set(Post, { id: '2' }, { id: '2', title: 'Set' });
    controller.invalidate(getPost, { id: '0' });
    controller.setResponse(
      renamePost,
      { id: '1' },
      { title: 'Soon' },
      { id: '1', title: 'Saved' },
    );
    const byId = (changes: readonly { id: string }[]) =>
      [...changes].sort((a, b) => a.id.localeCompare(b.id));
    const stored = entries().filter(e => e.store);
    expect(stored.length).toBe(6);
    for (const entry of stored)
      expect(byId(log.changes(entry))).toEqual(
        byId(
          diffStates(
            log.view(entry.store!.before),
            log.view(entry.store!.after),
          ),
        ),
      );
    const changed = (type: string, endpoint: unknown) =>
      log
        .changes(
          stored.find(
            e =>
              e.action.type === type &&
              'endpoint' in e.action &&
              e.action.endpoint === endpoint,
          )!,
        )
        .map(c => c.id);
    // the update's own list and the optimistic title both show
    expect(changed(actionTypes.SET_RESPONSE, createPost)).toContain(
      endpointId('GET /posts'),
    );
    expect(changed(actionTypes.FETCH, renamePost)).toContain(
      entityId('Post', '1'),
    );
  });

  it('still diffs every endpoint an expireAll matched', () => {
    const { controller, log, last } = store(5);
    controller.expireAll({ testKey: key => key.startsWith('GET /posts/') });
    expect(log.changes(last()).map(c => c.id)).toEqual(
      [0, 1, 2, 3, 4].map(i => endpointId(`GET /posts/${i}`)),
    );
  });

  it('copies only the tables garbage collection deletes from', () => {
    const { controller, log, last } = store(3);
    storeComment(controller);
    controller.dispatch({
      type: actionTypes.GC,
      entities: [{ key: 'Post', pk: '2' }],
      endpoints: [],
    });
    const { before, after } = last().store!;
    // the state before still has what it deleted
    expect(before.entities.Post?.['2']).toBeDefined();
    expect(after.entities.Post?.['2']).toBeUndefined();
    expect(after.entities.User).toBe(before.entities.User);
    expect(after.entitiesMeta.User).toBe(before.entitiesMeta.User);
    expect(after.endpoints).toBe(before.endpoints);
    expect(log.changes(last()).map(c => [c.id, c.kind])).toEqual([
      [entityId('Post', '2'), 'removed'],
    ]);
  });

  it('reads what a key holds once for the fetches a refetch shares', () => {
    const { controller, entries } = store(1);
    storeComment(controller);
    controller.setResponse(deleteUser, { id: 'u1' }, { id: 'u1' });
    const cause = entries().at(-1)!;
    const denormalize = jest.spyOn(MemoCache.prototype, 'denormalize');
    try {
      // as each component reading it asks again
      for (let i = 0; i < 3; i++) controller.fetch(getComment, { id: 'c1' });
      const fetches = entries().filter(
        e => e.action.type === actionTypes.FETCH,
      );
      expect(fetches.map(e => [e.reason, e.causedBy])).toEqual(
        Array(3).fill(['invalid', cause.seq]),
      );
      // each fetch's reason reads through the log's own memo; what the key
      // holds takes a fresh one, once
      expect(new Set(denormalize.mock.contexts).size).toBe(2);
    } finally {
      denormalize.mockRestore();
    }
  });

  it('reads what a key holds by each schema that reads it', () => {
    /** Comment c1, as each endpoint for it reads it */
    const commentBy = (schema: Record<string, typeof User>) =>
      class extends Entity {
        id = '';
        author = User.fromJS();
        editor = User.fromJS();
        static key = 'Comment';
        static schema = schema;
      };
    const getBy = (schema: Record<string, typeof User>) =>
      new Endpoint(async ({ id }: { id: string }) => ({ id }), {
        schema: commentBy(schema),
        key: ({ id }: { id: string }) => `GET /comments/${id}`,
        name: 'getComment',
      });
    const { controller, entries } = store(1);
    controller.setResponse(
      getBy({ author: User, editor: User }),
      { id: 'c1' },
      { id: 'c1', author: { id: 'u1' }, editor: { id: 'u2' } },
    );
    controller.setResponse(deleteUser, { id: 'u1' }, { id: 'u1' });
    controller.setResponse(deleteUser, { id: 'u2' }, { id: 'u2' });
    const [deleteU1, deleteU2] = entries().slice(-2);
    controller.fetch(getBy({ editor: User }), { id: 'c1' });
    controller.fetch(getBy({ author: User }), { id: 'c1' });
    const [byEditor, byAuthor] = entries().slice(-2);
    expect(byEditor.causedBy).toBe(deleteU2.seq);
    expect(byAuthor.causedBy).toBe(deleteU1.seq);
  });
});
