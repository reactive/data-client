/// <reference types="jest" />
import { initialState } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  actionTypes,
  Controller,
  DataProvider,
  NetworkManager,
  PollingSubscription,
  SubscriptionManager,
  useController,
  type State,
} from '@data-client/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { diffStates, groupEntries, keepUnchanged } from '../store/actionGroups';
import ActionLog, { type LogEntry } from '../store/actionLog';
import { entityId } from '../store/model';
import SchemaRegistry from '../store/schemaRegistry';
import StorePanel from '../store/StorePanel';

jest.mock('../../../../utils/tabStorage', () => ({
  useTabStorage: () => require('react').useState(null),
}));

class Post extends Entity {
  id = '';
  title = '';
}
const POSTS = 'GET https://example.com/posts';
const getPosts = new Endpoint(
  async () => [
    { id: '1', title: 'One' },
    { id: '2', title: 'Two' },
  ],
  { schema: [Post], key: () => POSTS, name: 'getPosts' },
);

/** Resolves when the test says so, to see a request in flight */
let release: (value: unknown) => void = () => {};
const updatePost = new Endpoint(
  (_: { id: string }, body: { title: string }) =>
    new Promise(resolve => {
      release = resolve;
    }).then(() => ({ id: '1', title: `${body.title}!` })),
  {
    schema: Post,
    sideEffect: true,
    key: ({ id }: { id: string }) => `PATCH https://example.com/posts/${id}`,
    name: 'updatePost',
    getOptimisticResponse: (
      _snap: unknown,
      { id }: { id: string },
      body: any,
    ) => ({
      id,
      ...body,
    }),
  },
);

function mount() {
  const registry = new SchemaRegistry();
  const log = registry.log.connect(0);
  const managers = [
    log.head,
    registry,
    new NetworkManager(),
    new SubscriptionManager(PollingSubscription),
    log.tail,
  ];
  const ref: { ctrl?: Controller } = {};
  function Grab() {
    ref.ctrl = useController();
    return null;
  }
  const ui = (history: number) => (
    <DataProvider managers={managers} devButton={null}>
      <Grab />
      <StorePanel registry={registry} history={history} />
    </DataProvider>
  );
  const { rerender } = render(ui(0));
  return {
    ctrl: () => ref.ctrl!,
    /** Shows another store's history */
    show: (history: number) => rerender(ui(history)),
  };
}

const actionsTab = () => screen.getByRole('tab', { name: /Actions/ });
const rows = () =>
  [...document.querySelectorAll<HTMLElement>('[aria-expanded]')].filter(
    el => !el.closest('[hidden]'),
  );

describe('Store Actions tab', () => {
  it('folds a fetch and its response into one row with what it added', async () => {
    const { ctrl } = mount();
    // a second read while the first is in flight is deduped into it
    await act(() =>
      Promise.all([ctrl().fetch(getPosts), ctrl().fetch(getPosts)]),
    );
    fireEvent.click(actionsTab());
    // counts rows, not actions
    expect(actionsTab().textContent).toBe('Actions1');
    const [row] = rows();
    expect(row.textContent).toContain('GET');
    expect(row.textContent).toContain('/posts');
    expect(row.textContent).toMatch(/\d+ ms/);
    expect(
      within(row).getByRole('button', { name: /^\+ ?2 Post$/ }),
    ).toBeTruthy();
    expect(row.textContent).toContain('×2');
    fireEvent.click(row);
    expect(
      screen.getByText('1 more fetch deduped into this request'),
    ).toBeTruthy();
    fireEvent.click(row);

    // the same data again changes nothing
    await act(() => ctrl().fetch(getPosts));
    expect(rows()).toHaveLength(2);
    expect(rows()[1].textContent).toContain('stored again, unchanged');

    // a State record links back to the action that last changed it
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    const top = () =>
      [...document.querySelectorAll<HTMLElement>('[data-level]')].find(
        el => !el.closest('[hidden]') && !el.hasAttribute('data-covered'),
      )!;
    fireEvent.click(
      top().querySelector<HTMLElement>(
        `tr[data-id="${entityId('Post', '1')}"]`,
      )!,
    );
    expect(top().textContent).toContain('changed by');
    fireEvent.click(within(top()).getByRole('button', { name: /setResponse/ }));
    // from State, showing State then uncovers the record it came from
    fireEvent.click(within(top()).getByRole('button', { name: /View State/ }));
    expect(top().textContent).not.toContain('View State after this');
    expect(top().textContent).toContain('changed by');
    expect(screen.getByRole('button', { name: 'Live' })).toBeTruthy();
  });

  it('shows an optimistic update, its diff, and State as it was then', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    let done: Promise<unknown> = Promise.resolve();
    await act(async () => {
      done = ctrl().fetch(updatePost, { id: '1' }, { title: 'Edited' });
    });
    fireEvent.click(actionsTab());
    const request = rows()[1];
    expect(request.textContent).toContain('pending');
    expect(
      within(request).getByRole('button', { name: /^~ ?Post 1$/ }),
    ).toBeTruthy();

    await act(async () => {
      release(undefined);
      await done;
    });
    expect(rows()[1].textContent).toMatch(/\d+ ms/);

    // open the row, then its optimistic fetch
    fireEvent.click(rows()[1]);
    const step = screen.getByText('optimistic').closest('[role="button"]')!;
    fireEvent.click(step);
    expect(screen.getAllByText('"One"').length).toBeGreaterThan(0);
    expect(screen.getAllByText('"Edited"').length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole('button', { name: 'View State after this' }),
    );
    expect(
      screen.getByRole('tab', { name: 'State' }).getAttribute('aria-selected'),
    ).toBe('true');
    // the snapshot bar sits at the top of the State tab's panel
    const statePanel = screen.getByRole('button', { name: 'Live' })
      .parentElement!.parentElement!;
    expect(within(statePanel).getAllByText('"Edited"').length).toBeGreaterThan(
      0,
    );
    expect(within(statePanel).queryByText('"Edited!"')).toBeNull();
    // with the request that was pending then
    expect(statePanel.textContent).toContain('Optimistic');

    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(within(statePanel).getAllByText('"Edited!"').length).toBeGreaterThan(
      0,
    );
    expect(statePanel.textContent).not.toContain('Optimistic');
  });

  it('shows the new row next to an update in the same table', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    const getMore = new Endpoint(
      async () => [
        { id: '1', title: 'Uno' },
        { id: '3', title: 'Three' },
      ],
      {
        schema: [Post],
        key: () => 'GET https://example.com/more',
        name: 'more',
      },
    );
    await act(() => ctrl().fetch(getMore));
    fireEvent.click(actionsTab());
    const row = rows()[1];
    expect(
      within(row).getByRole('button', { name: /^~ ?Post 1$/ }),
    ).toBeTruthy();
    expect(
      within(row).getByRole('button', { name: /^\+ ?Post 3$/ }),
    ).toBeTruthy();
  });

  it('shows a response the store failed to process as an error', async () => {
    const { ctrl } = mount();
    // normalizing it throws inside the reducer
    const broken = new Endpoint(async () => 'not a post', {
      schema: Post,
      key: () => 'GET https://example.com/broken',
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(() =>
      ctrl()
        .fetch(broken)
        .catch(() => {}),
    );
    fireEvent.click(actionsTab());
    expect(rows()[0].textContent).toContain('error');
    expect(rows()[0].textContent).not.toMatch(/\d+ ms/);
  });

  it('lists a set on its own, and only its own store’s actions', async () => {
    const { ctrl, show } = mount();
    await act(() => ctrl().set(Post, { id: '3' }, { id: '3', title: 'New' }));
    fireEvent.click(actionsTab());
    const [row] = rows();
    expect(row.textContent).toContain('set');
    expect(
      within(row).getByRole('button', { name: /^\+ ?Post 3$/ }),
    ).toBeTruthy();

    await act(async () => show(1));
    expect(rows()).toHaveLength(0);
    expect(screen.getByText(/Nothing dispatched yet/)).toBeTruthy();
  });
});

describe('groupEntries', () => {
  const entry = (seq: number, action: any): LogEntry => ({
    seq,
    action,
    at: seq,
  });
  const poll = { key: 'GET /price', endpoint: { pollFrequency: 5000 } };

  it('puts a subscription’s fetches under it until the last unsubscribe', () => {
    const groups = groupEntries([
      entry(1, { type: actionTypes.SUBSCRIBE, ...poll }),
      entry(2, { type: actionTypes.SUBSCRIBE, ...poll }),
      entry(3, { type: actionTypes.FETCH, ...poll, meta: { fetchedAt: 3 } }),
      entry(4, {
        type: actionTypes.SET_RESPONSE,
        ...poll,
        meta: { fetchedAt: 3 },
      }),
      entry(5, { type: actionTypes.UNSUBSCRIBE, ...poll }),
      entry(6, { type: actionTypes.UNSUBSCRIBE, ...poll }),
      entry(7, { type: actionTypes.FETCH, ...poll, meta: { fetchedAt: 7 } }),
    ]);
    expect(groups.map(g => g.kind)).toEqual(['subscription', 'request']);
    const [sub] = groups;
    expect(sub.kind === 'subscription' && sub.requests).toHaveLength(1);
    expect(sub.kind === 'subscription' && sub.open).toBe(0);
  });

  it('keeps mutations made in the same millisecond apart', () => {
    const write = { key: 'PATCH /a', endpoint: { sideEffect: true } };
    const fetch = (seq: number) =>
      entry(seq, { type: actionTypes.FETCH, ...write, meta: { fetchedAt: 1 } });
    const response = (seq: number) =>
      entry(seq, {
        type: actionTypes.SET_RESPONSE,
        ...write,
        meta: { fetchedAt: 1 },
      });
    const groups = groupEntries([fetch(1), fetch(2), response(3), response(4)]);
    expect(
      groups.map(g => g.kind === 'request' && g.entries.map(e => e.seq)),
    ).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });

  it('matches mutations sharing a fetch time to their own responses', () => {
    const write = { key: 'PATCH /a', endpoint: { sideEffect: true } };
    const action = (type: string, seq: number, title: string) =>
      entry(seq, {
        type,
        ...write,
        args: [{ id: 'a' }, { title }],
        meta: { fetchedAt: 1 },
      });
    const groups = groupEntries([
      action(actionTypes.FETCH, 1, 'x'),
      action(actionTypes.FETCH, 2, 'y'),
      // the second resolves first
      action(actionTypes.SET_RESPONSE, 3, 'y'),
      action(actionTypes.SET_RESPONSE, 4, 'x'),
    ]);
    expect(
      groups.map(g => g.kind === 'request' && g.entries.map(e => e.seq)),
    ).toEqual([
      [1, 4],
      [2, 3],
    ]);
  });

  it('closes what the store before a remounted one had open', () => {
    const read = { key: 'GET /a', endpoint: {} };
    const groups = groupEntries([
      entry(1, { type: actionTypes.SUBSCRIBE, ...poll }),
      entry(2, { type: actionTypes.FETCH, ...read, meta: { fetchedAt: 2 } }),
      // the restored store subscribes again; its first unsubscribe ends it
      { ...entry(3, { type: actionTypes.SUBSCRIBE, ...poll }), newStore: true },
      entry(4, { type: actionTypes.UNSUBSCRIBE, ...poll }),
      entry(5, { type: actionTypes.FETCH, ...read, meta: { fetchedAt: 5 } }),
    ]);
    expect(
      groups.map(g => [
        g.kind,
        g.kind === 'subscription' ? g.open
        : g.kind === 'request' ? !!g.cancelled
        : null,
      ]),
    ).toEqual([
      ['subscription', 0],
      ['request', true],
      ['subscription', 0],
      ['request', false],
    ]);
  });

  it('starts reads over after a reset', () => {
    const read = { key: 'GET /a', endpoint: {} };
    const groups = groupEntries([
      entry(1, { type: actionTypes.FETCH, ...read, meta: { fetchedAt: 1 } }),
      entry(2, { type: actionTypes.RESET }),
      entry(3, { type: actionTypes.FETCH, ...read, meta: { fetchedAt: 3 } }),
      entry(4, {
        type: actionTypes.SET_RESPONSE,
        ...read,
        meta: { fetchedAt: 3 },
      }),
    ]);
    expect(groups.map(g => [g.kind, g.entries.map(e => e.seq)])).toEqual([
      ['request', [1]],
      ['single', [2]],
      ['request', [3, 4]],
    ]);
    // cancelled, not left pending
    expect(groups[0].kind === 'request' && groups[0].cancelled).toBe(true);
  });

  it('keeps the groups a new action left as they were', () => {
    const read = { key: 'GET /a', endpoint: {} };
    const entries = [
      entry(1, { type: actionTypes.SET, schema: { key: 'Post' } }),
      entry(2, { type: actionTypes.FETCH, ...read, meta: { fetchedAt: 2 } }),
    ];
    const before = groupEntries(entries);
    const after = keepUnchanged(
      before,
      groupEntries([
        ...entries,
        entry(3, {
          type: actionTypes.SET_RESPONSE,
          ...read,
          meta: { fetchedAt: 2 },
        }),
      ]),
    );
    expect(after[0]).toBe(before[0]);
    // the request got its response
    expect(after[1]).not.toBe(before[1]);
  });

  it('folds reads made while one is in flight into it', () => {
    const read = { key: 'GET /a', endpoint: {} };
    const groups = groupEntries([
      entry(1, { type: actionTypes.FETCH, ...read, meta: { fetchedAt: 1 } }),
      entry(2, { type: actionTypes.FETCH, ...read, meta: { fetchedAt: 2 } }),
      entry(3, {
        type: actionTypes.SET_RESPONSE,
        ...read,
        meta: { fetchedAt: 1 },
      }),
      // a response nothing asked for
      entry(4, {
        type: actionTypes.SET_RESPONSE,
        ...read,
        meta: { fetchedAt: 9 },
      }),
    ]);
    expect(groups.map(g => [g.kind, g.entries.length])).toEqual([
      ['request', 3],
      ['single', 1],
    ]);
  });
});

describe('ActionLog', () => {
  const empty: State<unknown> = {
    ...initialState,
    entities: { Post: { 1: { id: '1' }, 2: { id: '2' } } },
    endpoints: { a: '1' },
  };
  /** A store whose actions go to `history` */
  const connect = (
    log: ActionLog,
    history: number,
    { keep, state = empty }: { keep?: number; state?: State<unknown> } = {},
  ) => {
    const { head, tail } = log.connect(history, keep);
    const store = { getState: () => state } as any;
    return head.middleware!(store)(
      tail.middleware!(store)(() => Promise.resolve()),
    ) as (action: any) => Promise<void>;
  };
  const subscribe = () => ({ type: actionTypes.SUBSCRIBE, key: 'k' });

  it('collects garbage without touching earlier states', () => {
    const log = new ActionLog();
    connect(
      log,
      0,
    )({
      type: actionTypes.GC,
      entities: [{ key: 'Post', pk: '1' }],
      endpoints: ['a'],
    });
    expect(empty.entities.Post).toHaveProperty('1');
    expect(empty.endpoints).toHaveProperty('a');
    const [gc] = log.history(0).entries;
    expect(log.changes(gc).map(c => c.kind)).toEqual(['removed', 'removed']);
  });

  it('keeps each store’s history, which a restored store continues', () => {
    const log = new ActionLog();
    const first = connect(log, 0);
    first(subscribe());
    first(subscribe());
    // an automatic retry with a fresh store, keeping the first's history
    const retry = connect(log, 1, { keep: 0 });
    retry(subscribe());
    // the replaced store unmounting
    first({ type: actionTypes.UNSUBSCRIBE, key: 'k' });
    expect(log.history(0).entries).toHaveLength(3);
    expect(log.history(1).entries).toHaveLength(1);
    // the error persists: the first store comes back, the retry's is gone
    connect(log, 0)(subscribe());
    expect(log.history(0).entries.map(e => !!e.newStore)).toEqual([
      true,
      false,
      false,
      true,
    ]);
    expect(log.history(1).entries).toHaveLength(0);
    retry(subscribe());
    expect(log.history(1).entries).toHaveLength(0);
    // a reset
    connect(log, 3)(subscribe());
    expect(log.history(0).entries).toHaveLength(0);
  });

  it('follows each store’s own state', () => {
    const log = new ActionLog();
    const set = () => ({
      type: actionTypes.SET_RESPONSE,
      key: 'b',
      response: 1,
      meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
      endpoint: { schema: undefined },
    });
    const old = connect(log, 0);
    const next = connect(log, 1, { keep: 0, state: initialState });
    old(set());
    next(set());
    // the old store's actions don't move the new one's state
    old(set());
    next(set());
    const [, second] = log.history(1).entries;
    expect(log.history(1).entries).toHaveLength(2);
    // picks up where its last action left it (its getState() lags behind,
    // as the real store commits in batches)
    expect(second.store?.before.endpoints).toHaveProperty('b');
  });

  it('waits for a quiet moment to show what leaves the store as is', () => {
    jest.useFakeTimers();
    try {
      const log = new ActionLog();
      const heard = jest.fn();
      log.subscribe(heard);
      const store = { getState: () => empty } as any;
      // a read already in flight: NetworkManager stops it before the store
      const dispatch = log.connect(0).head.middleware!(store)(() =>
        Promise.resolve(),
      ) as (action: any) => Promise<void>;
      dispatch(subscribe());
      dispatch(subscribe());
      jest.advanceTimersByTime(299);
      // rendering the panel now would retry a suspended render, which
      // fetches again
      expect(heard).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      expect(heard).toHaveBeenCalledTimes(1);
      expect(log.history(0).entries).toHaveLength(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps only the newest actions', () => {
    const log = new ActionLog();
    const dispatch = connect(log, 0);
    for (let i = 0; i < 510; i++) dispatch(subscribe());
    const { entries } = log.history(0);
    expect(entries).toHaveLength(500);
    expect(entries[0].seq).toBe(11);
  });
});

describe('diffStates', () => {
  const state = (meta: object): State<unknown> => ({
    ...initialState,
    endpoints: { a: [1] },
    meta: { a: { date: 1, fetchedAt: 1, expiresAt: 10, ...meta } },
  });
  const kinds = (prev: object, next: object) =>
    diffStates(state(prev), state(next)).map(c => c.kind);

  it('tells a refetch, an expiry and a recovery apart', () => {
    expect(kinds({}, { date: 2, expiresAt: 20 })).toEqual(['refreshed']);
    // expireAll()
    expect(kinds({}, { expiresAt: 1 })).toEqual(['expired']);
    expect(kinds({ error: new Error('x') }, { date: 2 })).toEqual(['updated']);
    expect(kinds({ invalidated: true }, { date: 2 })).toEqual(['updated']);
  });
});
