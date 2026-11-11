jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const startTransition = jest.fn((fn: () => void) =>
    actual.startTransition(fn),
  );
  const wrapped = { ...actual, startTransition };
  return { ...wrapped, default: wrapped };
});

import {
  Controller,
  createReducer,
  initialState,
  __INTERNAL__,
} from '@data-client/core';
import type { State } from '@data-client/core';
import {
  All,
  Collection,
  Endpoint,
  Entity,
  Invalidate,
  Lazy,
  Query,
  Scalar,
  Union,
  Values,
  schema,
} from '@data-client/endpoint';
import { startTransition } from 'react';

import { PIECE } from '../applyPiece';
import { getLedger } from '../Ledger';
import StreamManager from '../StreamManager';
import { STREAM_GLOBAL } from '../wire';
import type { StreamMessage } from '../wire';

const piece = (rev: number): StreamMessage => ({
  t: 'piece',
  rev,
  entities: { Todo: { [rev]: { id: String(rev) } } },
});
const push = (...messages: StreamMessage[]) =>
  (globalThis as any)[STREAM_GLOBAL].push(...messages);

describe('StreamManager', () => {
  beforeEach(() => {
    delete (globalThis as any)[STREAM_GLOBAL];
    jest.mocked(startTransition).mockClear();
  });

  function setup(seedRev: number) {
    const ledger = getLedger()!;
    const manager = new StreamManager(ledger, seedRev);
    const dispatched: { revs: number[]; inTransition: boolean }[] = [];
    let inTransition = false;
    jest.mocked(startTransition).mockImplementation(fn => {
      inTransition = true;
      dispatched.push({ revs: [], inTransition: true });
      try {
        fn();
      } finally {
        inTransition = false;
      }
    });
    const controller: any = {
      dispatch: jest.fn((action: any) => {
        expect(action.type).toBe(PIECE);
        if (!inTransition) dispatched.push({ revs: [], inTransition: false });
        dispatched[dispatched.length - 1].revs.push(action.piece.rev);
        return Promise.resolve();
      }),
    };
    manager.middleware(controller);
    return { ledger, manager, controller, dispatched };
  }

  it('publishes each script batch in one transition, in order, once', () => {
    (globalThis as any)[STREAM_GLOBAL] = [
      { t: 'open', v: 1, rev: 1, at: 0 },
      piece(1),
      piece(2),
      piece(3),
    ];
    const { manager, controller, dispatched } = setup(1);
    expect(typeof controller.reduce).toBe('function');

    manager.init();
    expect(dispatched).toEqual([{ revs: [2, 3], inTransition: true }]);

    push(piece(4), piece(5), piece(6));
    expect(dispatched).toEqual([
      { revs: [2, 3], inTransition: true },
      { revs: [4, 5, 6], inTransition: true },
    ]);

    // a script with nothing new publishes nothing
    push({ t: 'ann', keys: ['k'] });
    expect(dispatched).toHaveLength(2);

    manager.cleanup();
    push(piece(7));
    expect(dispatched).toHaveLength(2);

    // init() resumes from the last piece published
    manager.init();
    expect(dispatched).toEqual([
      { revs: [2, 3], inTransition: true },
      { revs: [4, 5, 6], inTransition: true },
      { revs: [7], inTransition: true },
    ]);
    manager.cleanup();
  });

  it('does not publish before its middleware has a controller', () => {
    (globalThis as any)[STREAM_GLOBAL] = [
      { t: 'open', v: 1, rev: 0, at: 0 },
      piece(1),
    ];
    const ledger = getLedger()!;
    const manager = new StreamManager(ledger, 0);
    manager.init();
    expect(startTransition).not.toHaveBeenCalled();
    manager.cleanup();
  });

  /** A real controller and reducer behind the manager's middleware */
  function liveStore() {
    (globalThis as any)[STREAM_GLOBAL] = [{ t: 'open', v: 1, rev: 0, at: 0 }];
    const ledger = getLedger()!;
    const manager = new StreamManager(ledger, 0);
    let state: State<unknown> = initialState;
    const controller = new Controller();
    const reducer = createReducer(controller);
    const dispatch = manager.middleware(controller as any)((action: any) => {
      state = reducer(state, action);
      return Promise.resolve();
    });
    controller.bindMiddleware({ dispatch, getState: () => state });
    /** One piece that sends back every record this key holds, fetched later */
    const pieceFor = (key: string, rev: number): StreamMessage => {
      const entities: Record<string, any> = {};
      const entitiesMeta: Record<string, any> = {};
      for (const [pk, held] of Object.entries(state.entities[key] ?? {})) {
        if (held === __INTERNAL__.INVALID) continue;
        entities[pk] = Array.isArray(held) ? [...held] : { ...(held as any) };
        const meta = state.entitiesMeta[key][pk];
        entitiesMeta[pk] = { ...meta, fetchedAt: meta.fetchedAt + 1000 };
      }
      return {
        t: 'piece',
        rev,
        entities: { [key]: entities },
        entitiesMeta: { [key]: entitiesMeta },
      };
    };
    const reduce = (piece: StreamMessage) => {
      state = (controller as any).reduce(state, { type: PIECE, piece });
    };
    return {
      ledger,
      manager,
      controller,
      pieceFor,
      reduce,
      state: () => state,
    };
  }
  const endpoint = (name: string, s: any) =>
    new Endpoint((..._args: any[]) => Promise.resolve(null as any), {
      schema: s,
      name,
    });

  it('U/class-walk: learns the class of every schema kind a client write uses', () => {
    class Article extends Entity {
      id = '';
      static key = 'Article';
    }
    class User extends Entity {
      id = '';
      static key = 'User';
    }
    class Post extends Entity {
      id = '';
      static key = 'Post';
      static schema = { author: User };
    }
    class Tag extends Entity {
      id = '';
      static key = 'Tag';
    }
    class Owner extends Entity {
      id = '';
      static key = 'Owner';
    }
    class Price extends Entity {
      id = '';
      static key = 'Price';
    }
    class Cat extends Entity {
      id = '';
      type = 'cat';
      static key = 'Cat';
    }
    class Dog extends Entity {
      id = '';
      type = 'dog';
      static key = 'Dog';
    }
    class Bird extends Entity {
      id = '';
      type = 'bird';
      static key = 'Bird';
    }
    class Item extends Entity {
      id = '';
      static key = 'Item';
    }
    class Gone extends Entity {
      id = '';
      static key = 'Gone';
    }
    class Every extends Entity {
      id = '';
      static key = 'Every';
    }
    class Queried extends Entity {
      id = '';
      static key = 'Queried';
    }
    const portfolio = new Scalar({
      lens: (args: readonly any[]) => args[0]?.portfolio,
      key: 'portfolio',
    });
    class Holding extends Entity {
      id = '';
      price = 0;
      static key = 'Holding';
      static schema = { price: portfolio };
    }
    class Room extends Entity {
      id = '';
      static key = 'Room';
    }
    class Building extends Entity {
      id = '';
      static key = 'Building';
      static schema = { rooms: new Lazy([Room]) };
    }
    const items = new Collection([Item]);
    const writes: [Endpoint<any>, any, any][] = [
      [endpoint('article', Article), {}, { id: 'a1' }],
      [endpoint('post', Post), {}, { id: 'p1', author: { id: 'u1' } }],
      [endpoint('tags', [Tag]), {}, [{ id: 't1' }]],
      [
        endpoint('owned', new schema.Object({ owner: Owner })),
        {},
        { owner: { id: 'o1' } },
      ],
      [endpoint('prices', new Values(Price)), {}, { x: { id: 'x' } }],
      [
        endpoint('pets', [new Union({ cat: Cat, dog: Dog, bird: Bird }, 'type')]),
        {},
        [
          { id: 'c1', type: 'cat' },
          { id: 'd1', type: 'dog' },
        ],
      ],
      [endpoint('items', items), {}, [{ id: 'i1' }]],
      [endpoint('gone', new Invalidate(Gone)), {}, { id: 'g1' }],
      [endpoint('every', new All(Every)), {}, [{ id: 'e1' }]],
      [
        endpoint(
          'queried',
          new Query(new All(Queried), (list: any) => list),
        ),
        {},
        [{ id: 'q1' }],
      ],
      [
        endpoint('holding', Holding),
        { portfolio: 'p1' },
        { id: 'h1', price: 10 },
      ],
      [endpoint('building', Building), {}, { id: 'b1', rooms: [{ id: 'r1' }] }],
    ];
    const store = liveStore();
    for (const [e, args, response] of writes)
      store.controller.setResponse(e, args, response);
    const written = Object.keys(store.state().entities).sort();
    expect(written).toEqual(
      [
        'Article',
        'Building',
        'Cat',
        'Dog',
        'Every',
        'Gone',
        'Holding',
        'Item',
        items.key,
        'Owner',
        'Post',
        'Price',
        'Queried',
        'Room',
        'Scalar(portfolio)',
        'Tag',
        'User',
      ].sort(),
    );
    const { classes } = store.manager;
    for (const key of written) expect([key, classes.has(key)]).toEqual([key, true]);
    // every Union member, written or not
    expect(classes.get('Bird')).toBe(Bird);
    expect(classes.get(items.key)).toBe(items);
    expect(classes.get('Scalar(portfolio)')).toBe(portfolio);

    const merges: string[] = [];
    for (const [key, cls] of classes) {
      const original = cls.mergeWithStore.bind(cls);
      (cls as any).mergeWithStore = (...args: any[]) => {
        merges.push(key);
        return (original as any)(...args);
      };
    }
    try {
      written.forEach((key, i) => store.reduce(store.pieceFor(key, i + 1)));
    } finally {
      for (const cls of classes.values()) delete (cls as any).mergeWithStore;
    }
    // Gone's record is INVALID, which a newer piece replaces without a merge
    expect(merges.sort()).toEqual(written.filter(key => key !== 'Gone'));
    expect(store.ledger.stats().unknown).toBe(0);
  });

  it('U/unknown-counted: a client-written record of a class never shown', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      class Article extends Entity {
        id = '';
        title = '';
        static key = 'Article';
      }
      const getArticle = endpoint('article', Article);
      const store = liveStore();
      store.controller.setResponse(getArticle, { id: 'a1' }, { id: 'a1', title: 'client' });
      store.controller.setResponse(getArticle, { id: 'a2' }, { id: 'a2', title: 'client' });
      store.manager.classes.clear();
      const held = store.state().entities.Article!.a1;
      const key = getArticle.key({ id: 'a1' });
      const piece = (pk: string, rev: number): StreamMessage => ({
        ...(store.pieceFor('Article', rev) as any),
        entities: { Article: { [pk]: { id: pk, title: 'server' } } },
        endpoints: { [getArticle.key({ id: pk })]: pk },
        meta: {
          [getArticle.key({ id: pk })]: {
            fetchedAt: Date.now() + 1000,
            date: Date.now() + 1000,
            expiresAt: Date.now() + 60_000,
          },
        },
      });
      store.reduce(piece('a1', 1));
      expect(store.state().entities.Article!.a1).toBe(held);
      expect(store.state().meta[key].expiresAt).toBe(0);
      expect(store.ledger.stats().unknown).toBe(1);
      // the same record again, as a rebased reducer would meet it
      store.reduce(piece('a1', 2));
      expect(store.ledger.stats().unknown).toBe(1);
      store.reduce(piece('a2', 3));
      expect(store.ledger.stats().unknown).toBe(2);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/Article a1/);
    } finally {
      warn.mockRestore();
    }
  });
});
