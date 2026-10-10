/// <reference types="jest" />
import { Collection, Endpoint, Entity, schema } from '@data-client/endpoint';
import { actionTypes, StateContext, type State } from '@data-client/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { endpointId, entityId } from '../store/model';
import SchemaRegistry from '../store/schemaRegistry';
import StorePanel from '../store/StorePanel';

jest.mock('../../../../utils/tabStorage', () => ({
  useTabStorage: () => require('react').useState(null),
}));

class User extends Entity {
  id = '';
  name = '';
}
class Post extends Entity {
  id = '';
  title = '';
  author = User.fromJS();
  static schema = { author: User };
}
class Comment extends Entity {
  id = '';
  text = '';
}
const comments = new Collection([Comment]);
const feed = new schema.Union({ post: Post, user: User }, (v: any) => v.type);

const range = (n: number) => Array.from({ length: n }, (_, i) => `${i + 1}`);
const commentIds = range(40);
const NOW = 1_700_000_000_000;
const url = (path: string) => `GET https://example.com/${path}`;
const POSTS = url('posts');
const COMMENTS = url('comments');
const FEED = url('feed');
const NUMBERS = url('numbers');
const OBJECTS = url('objects');
const BROKEN = url('broken');

/** Enough of everything to page, dive and collapse */
const state = {
  meta: {
    [POSTS]: { date: NOW, fetchedAt: NOW, expiresAt: 0 },
    [BROKEN]: { date: 0, expiresAt: 0, error: new Error('404 Not Found') },
  },
  entitiesMeta: {},
  indexes: {},
  optimistic: [],
  lastReset: 0,
  endpoints: {
    [POSTS]: range(12),
    [COMMENTS]: '{}',
    [FEED]: [
      ...range(11).map(id => ({ id, schema: 'post' })),
      { id: '1', schema: 'user' },
    ],
    [NUMBERS]: Array.from({ length: 25 }, (_, i) => i),
    [OBJECTS]: [{ a: 1 }, { b: 2 }],
    ...Object.fromEntries(range(5).map(n => [url(`extra/${n}`), 'x'])),
  },
  entities: {
    User: {
      1: {
        id: '1',
        name: 'Paul',
        joinedAt: NOW,
        prefs: { theme: 'dark' },
        tags: ['a', 'b', 'c', 'd', 'e'],
      },
    },
    Post: Object.fromEntries(
      range(12).map(id => [
        id,
        { id, title: `Post number ${id}`, author: '1' },
      ]),
    ),
    Comment: Object.fromEntries(
      commentIds.map(id => [id, { id, text: `comment ${id}` }]),
    ),
    '[Comment]': { '{}': commentIds },
    Thing: {
      a: {
        n: 1,
        when: new Date(0),
        bad: new Date('nope'),
        ok: true,
        nothing: null,
      },
    },
    // a Collection whose member table never arrived, with enough rows to page
    '[Orphan]': Object.fromEntries(
      range(9).map(n => [JSON.stringify({ page: n }), ['x']]),
    ),
  },
} as unknown as State<unknown>;

function registry() {
  const r = new SchemaRegistry();
  r.endpoints.set(POSTS, {
    endpoint: new Endpoint(() => Promise.resolve([]), {
      key: () => POSTS,
      schema: [Post],
    }),
    args: [{ page: 1 }],
  });
  // no `key()`: what useSuspense() would get cannot be computed
  r.endpoints.set(COMMENTS, { endpoint: { schema: comments }, args: [] });
  r.endpoints.set(FEED, { endpoint: { schema: [feed] }, args: [] });
  r.learn([Post]);
  r.learn(comments);
  return r;
}

const top = () =>
  document.querySelector<HTMLElement>('[data-level]:not([data-covered])')!;
const crumbs = () =>
  [...top().querySelectorAll('nav > *')].map(el => el.textContent);
const press = (key: string) =>
  fireEvent.keyDown(document.activeElement ?? top(), { key });
/** The last button called `name` on the top level: chips come after crumbs */
const chip = (name: string) =>
  within(top()).getAllByRole('button', { name }).at(-1)!;
const row = (id: string) =>
  top().querySelector<HTMLElement>(`tr[data-id="${id}"]`)!;
const group = (key: string) =>
  within(top().querySelector(`[data-table="${key}"]`)!);
const headers = () =>
  within(top())
    .getAllByRole('columnheader')
    .map(h => h.textContent);

function mount(s = state, r = registry()) {
  const ui = (s: State<unknown>) => (
    <StateContext.Provider value={s}>
      <StorePanel groupId="test" registry={r} history={0} />
    </StateContext.Provider>
  );
  const result = render(ui(s));
  return {
    ...result,
    update: (next: State<unknown>) => result.rerender(ui(next)),
  };
}

describe('StorePanel navigation', () => {
  it('collapses breadcrumbs past four levels and jumps back by crumb', () => {
    mount();
    fireEvent.click(within(top()).getByText('"Paul"'));
    fireEvent.click(chip('Post 1'));
    fireEvent.click(chip('User 1'));
    fireEvent.click(chip('Post 1'));
    expect(crumbs()).toEqual(['Store', '›', '…', '›', 'User 1', '›', 'Post 1']);
    fireEvent.click(
      within(top().querySelector('nav')!).getByRole('button', {
        name: 'User 1',
      }),
    );
    expect(crumbs()).toEqual([
      'Store',
      '›',
      'User 1',
      '›',
      'Post 1',
      '›',
      'User 1',
    ]);
    fireEvent.click(
      within(top().querySelector('nav')!).getByRole('button', {
        name: 'Store',
      }),
    );
    expect(top().querySelector('nav')).toBeNull();
  });

  it('ignores Escape at the root', () => {
    mount();
    act(() => press('Escape'));
    expect(top().querySelector('nav')).toBeNull();
    expect(group('Post').getByText('7 more')).toBeTruthy();
  });

  it('dives from "used by" into a mixed list and opens a row from it', () => {
    mount();
    fireEvent.click(within(top()).getByText('"Paul"'));
    // the feed endpoint and 12 posts reference the user: ten chips, then a
    // count that dives into all of them
    expect(chip('GET /feed')).toBeTruthy();
    expect(
      within(top()).getAllByRole('button', { name: /^Post \d+$/ }),
    ).toHaveLength(9);
    fireEvent.click(chip('+3'));
    expect(crumbs()).toEqual(['Store', '›', 'User 1', '›', 'used by13']);
    expect(headers()).toEqual(['row', 'value']);
    expect(top().querySelectorAll('tr[data-id]')).toHaveLength(13);
    fireEvent.click(row(entityId('Post', '3')));
    expect(crumbs().at(-1)).toBe('Post 3');
  });

  it('lists every endpoint past the preview and opens one with Enter', () => {
    mount();
    expect(within(top()).getByText('6 more')).toBeTruthy();
    fireEvent.click(within(top()).getByText('6 more'));
    expect(crumbs()).toEqual(['Store', '›', 'Endpoints11']);
    expect(headers()).toEqual(['key', 'status', 'value']);
    expect(top().querySelectorAll('tr[data-id]')).toHaveLength(11);
    const target = row(endpointId(NUMBERS));
    // keys from a chip inside the row are its own
    fireEvent.keyDown(within(target).getByText('0'), { key: 'Enter' });
    expect(crumbs()).toEqual(['Store', '›', 'Endpoints11']);
    fireEvent.keyDown(target, { key: 'Enter' });
    expect(crumbs().at(-1)).toBe('GET /numbers');
  });

  it('shows an endpoint record with what was stored and what it returns', () => {
    mount();
    fireEvent.click(row(endpointId(POSTS)));
    const show = within(top()).getByRole('group', { name: 'Show' });
    expect(within(show).getByText('Stored').getAttribute('aria-pressed')).toBe(
      'true',
    );
    // 12 refs: ten chips and a count that dives into the rest
    expect(
      within(top()).getAllByRole('button', { name: /^Post \d+$/ }),
    ).toHaveLength(10);
    expect(within(top()).getByText('args')).toBeTruthy();
    expect(within(top()).getByText('page')).toBeTruthy();
    fireEvent.click(within(show).getByText('Returns'));
    expect(within(top()).getByText('"Post number 1"')).toBeTruthy();
    expect(within(top()).getAllByText('"Paul"')).toHaveLength(12);
    // a date in meta shows as a time of day
    expect(within(top()).getAllByTitle(String(NOW)).length).toBeGreaterThan(0);
    fireEvent.click(within(show).getByText('Stored'));
    fireEvent.click(chip('+2'));
    expect(crumbs().at(-1)).toBe('items12');
  });

  it('explains when what an endpoint returns cannot be computed', () => {
    mount();
    fireEvent.click(row(endpointId(COMMENTS)));
    fireEvent.click(within(top()).getByText('Returns'));
    expect(within(top()).getByText(/is not a function/)).toBeTruthy();
    expect(within(top()).queryByText('args')).toBeNull();
  });

  it('grows long lists on request and indexes lists of objects', () => {
    mount();
    fireEvent.click(row(endpointId(NUMBERS)));
    expect(within(top()).queryByText('24')).toBeNull();
    fireEvent.click(within(top()).getByText('5 more'));
    expect(within(top()).getByText('24')).toBeTruthy();
    // an endpoint without a known schema shows no Stored/Returns choice
    expect(within(top()).queryByRole('group', { name: 'Show' })).toBeNull();
    fireEvent.click(within(top()).getByLabelText('Back'));
    fireEvent.click(row(endpointId(OBJECTS)));
    expect(within(top()).getByText('0')).toBeTruthy();
    expect(within(top()).getByText('b')).toBeTruthy();
  });

  it('dives from a mixed list of refs into rows of several tables', () => {
    mount();
    fireEvent.click(row(endpointId(FEED)));
    fireEvent.click(chip('+2'));
    expect(crumbs().at(-1)).toBe('items12');
    expect(headers()).toEqual(['row', 'value']);
    expect(row(entityId('User', '1'))).toBeTruthy();
    expect(row(entityId('Post', '11'))).toBeTruthy();
  });

  it('says so when a listed table or an open record leaves the store', () => {
    const { update } = mount();
    fireEvent.click(group('Post').getByText('7 more'));
    const { Post: _, ...entities } = state.entities as any;
    update({ ...state, entities } as State<unknown>);
    expect(within(top()).getByText('No longer in the store')).toBeTruthy();
    expect(crumbs()).toEqual(['Store', '›', 'Post0']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    fireEvent.click(within(top()).getByText('"Paul"'));
    const { User: __, ...rest } = entities;
    update({ ...state, entities: rest } as State<unknown>);
    expect(within(top()).getByText('No longer in the store')).toBeTruthy();
    expect(crumbs()).toEqual(['Store', '›', '…']);
  });

  it('toggles sections and lists pending optimistic updates', () => {
    const r = registry();
    // a create still waiting for its response
    const create = new Endpoint(async (body: object) => body, {
      key: () => 'POST https://example.com/posts',
      sideEffect: true,
      getOptimisticResponse: (_: unknown, body: object) => body,
    });
    const store = { getState: () => state } as any;
    const { head, tail } = r.log.connect(0);
    head.middleware!(store)(tail.middleware!(store)(() => Promise.resolve()))({
      type: actionTypes.FETCH,
      key: create.key({ title: 'optimistic' }),
      args: [{ title: 'optimistic' }],
      endpoint: create,
      meta: { fetchedAt: NOW },
    } as any);
    mount(state, r);
    const optimistic = within(top()).getByRole('button', {
      name: /^Optimistic/,
    });
    expect(optimistic.getAttribute('aria-expanded')).toBe('true');
    expect(within(top()).getByText('POST')).toBeTruthy();
    expect(within(top()).getByText('"optimistic"')).toBeTruthy();
    fireEvent.click(optimistic);
    expect(within(top()).queryByText('POST')).toBeNull();
    fireEvent.click(optimistic);
    expect(within(top()).getByText('POST')).toBeTruthy();
    fireEvent.click(within(top()).getByRole('button', { name: /^Internals/ }));
    expect(within(top()).getByText('lastReset')).toBeTruthy();
  });

  it('jumps to a table from the index when there are many', () => {
    const scrollTo = jest.fn();
    Element.prototype.scrollTo = scrollTo;
    try {
      mount();
      fireEvent.click(
        within(top()).getByRole('button', { name: /^Comment\s?40$/ }),
      );
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
      );
    } finally {
      delete (Element.prototype as any).scrollTo;
    }
  });
});

describe('endpoint status', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => jest.useRealTimers());

  it('counts down until fresh data goes stale', () => {
    mount({
      ...state,
      meta: {
        [POSTS]: { date: NOW, expiresAt: NOW + 5000 },
        [COMMENTS]: { date: NOW, expiresAt: NOW + 120_000 },
        [FEED]: { date: NOW, expiresAt: Infinity },
        [NUMBERS]: { date: NOW, expiresAt: NOW + 5000, invalidated: true },
      },
    } as unknown as State<unknown>);
    expect(screen.getByText('fresh 5s')).toBeTruthy();
    expect(screen.getByText('fresh 2m')).toBeTruthy();
    expect(screen.getByText('invalid')).toBeTruthy();
    // never expires: fresh without a countdown
    expect(screen.getByText('fresh')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText('fresh 4s')).toBeTruthy();
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.queryByText(/fresh \ds/)).toBeNull();
    expect(screen.getAllByText('stale').length).toBeGreaterThan(0);
    expect(screen.getByText('fresh')).toBeTruthy();
  });
});
