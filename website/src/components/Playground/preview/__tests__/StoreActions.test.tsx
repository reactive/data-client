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

import { diffStates, groupEntries } from '../store/actionGroups';
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
  const managers = [
    registry,
    new NetworkManager(),
    new SubscriptionManager(PollingSubscription),
    registry.log.tail,
  ];
  const ref: { ctrl?: Controller } = {};
  function Grab() {
    ref.ctrl = useController();
    return null;
  }
  render(
    <DataProvider managers={managers} devButton={null}>
      <Grab />
      <StorePanel registry={registry} />
    </DataProvider>,
  );
  return { registry, ctrl: () => ref.ctrl! };
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

  it('lists a set on its own, and starts over when cleared', async () => {
    const { ctrl, registry } = mount();
    await act(() => ctrl().set(Post, { id: '3' }, { id: '3', title: 'New' }));
    fireEvent.click(actionsTab());
    const [row] = rows();
    expect(row.textContent).toContain('set');
    expect(
      within(row).getByRole('button', { name: /^\+ ?Post 3$/ }),
    ).toBeTruthy();

    await act(async () => registry.log.newStore('reset'));
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
  const store = { getState: () => empty } as any;
  const run = (log: ActionLog, action: any) => {
    log.record(action, store);
    log.tail.middleware!(store)(() => Promise.resolve())(action);
  };

  it('collects garbage without touching earlier states', () => {
    const log = new ActionLog();
    run(log, {
      type: actionTypes.GC,
      entities: [{ key: 'Post', pk: '1' }],
      endpoints: ['a'],
    });
    expect(empty.entities.Post).toHaveProperty('1');
    expect(empty.endpoints).toHaveProperty('a');
    const [gc] = log.entries;
    expect(log.changes(gc).map(c => c.kind)).toEqual(['removed', 'removed']);
  });

  it('starts over with each fresh store, and brings a restored one back', () => {
    const log = new ActionLog();
    const subscribe = { type: actionTypes.SUBSCRIBE } as any;
    const first = {};
    log.record(subscribe, first);
    log.record(subscribe, first);
    log.newStore('retry');
    // the replaced store unmounting
    log.record(subscribe, first);
    expect(log.entries).toHaveLength(0);
    log.record(subscribe, {});
    expect(log.entries).toHaveLength(1);
    log.newStore('restore');
    expect(log.entries.map(e => e.seq)).toEqual([1, 2]);
    // where the restored store's own actions begin
    log.record(subscribe, {});
    expect(log.entries.map(e => !!e.newStore)).toEqual([false, false, true]);
    log.newStore('reset');
    expect(log.entries).toHaveLength(0);
    log.newStore('restore');
    expect(log.entries).toHaveLength(0);
  });

  it('ignores what a replaced store still dispatches', () => {
    const log = new ActionLog();
    const old = { getState: () => empty } as any;
    const next = { getState: () => initialState } as any;
    const set = (store: any) => {
      const action = {
        type: actionTypes.SET_RESPONSE,
        key: 'b',
        response: 1,
        meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
        endpoint: { schema: undefined },
      } as any;
      log.record(action, store);
      log.tail.middleware!(store)(() => Promise.resolve())(action);
    };
    set(old);
    log.newStore('reset');
    set(next);
    // the old store's response arrives late
    set(old);
    set(next);
    const [, second] = log.entries;
    expect(log.entries).toHaveLength(2);
    // picks up where the new store's last action left it (its getState()
    // lags behind, as the real store commits in batches)
    expect(second.store?.before.endpoints).toHaveProperty('b');
  });

  it('keeps only the newest actions', () => {
    const log = new ActionLog();
    for (let i = 0; i < 510; i++)
      log.record({ type: actionTypes.SUBSCRIBE } as any, store);
    expect(log.entries).toHaveLength(500);
    expect(log.entries[0].seq).toBe(11);
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
