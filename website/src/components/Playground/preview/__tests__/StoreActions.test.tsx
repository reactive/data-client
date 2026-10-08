/// <reference types="jest" />
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

import { groupEntries } from '../store/actionGroups';
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
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(actionsTab());
    expect(actionsTab().textContent).toContain('2');
    const [row] = rows();
    expect(row.textContent).toContain('GET');
    expect(row.textContent).toContain('/posts');
    expect(row.textContent).toMatch(/\d+ ms/);
    expect(
      within(row).getByRole('button', { name: /^\+ ?2 Post$/ }),
    ).toBeTruthy();

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
    expect(top().textContent).toContain('View State after this');
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

    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(within(statePanel).getAllByText('"Edited!"').length).toBeGreaterThan(
      0,
    );
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

    await act(async () => registry.log.clear());
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
    entities: { Post: { 1: { id: '1' }, 2: { id: '2' } } },
    entitiesMeta: {},
    endpoints: { a: '1' },
    meta: {},
    indexes: {},
    optimistic: [],
    lastReset: 0,
  };
  const run = (log: ActionLog, action: any) => {
    log.record(action);
    log.tail.middleware!({ getState: () => empty } as any)(() =>
      Promise.resolve(),
    )(action);
  };

  it('collects garbage without touching earlier states', () => {
    const log = new ActionLog();
    log.start(empty);
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

  it('keeps only the newest actions', () => {
    const log = new ActionLog();
    log.start(empty);
    for (let i = 0; i < 510; i++)
      log.record({ type: actionTypes.SUBSCRIBE } as any);
    expect(log.entries).toHaveLength(500);
    expect(log.entries[0].seq).toBe(11);
  });
});
