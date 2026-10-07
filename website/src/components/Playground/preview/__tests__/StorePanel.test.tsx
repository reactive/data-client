/// <reference types="jest" />
import { Collection, Entity } from '@data-client/endpoint';
import { StateContext, type State } from '@data-client/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

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
  body = '';
  summary = '';
  author = User.fromJS();
  tags: string[] = [];
  static schema = { author: User };
}
class Comment extends Entity {
  id = '';
  text = '';
  static schema = {};
}
const comments = new Collection([Comment]);

const range = (n: number) => Array.from({ length: n }, (_, i) => `${i + 1}`);
const posts = Object.fromEntries(
  range(12).map(id => [
    id,
    {
      id,
      title: `Post title number ${id} that is long`,
      body: 'A body that wants plenty of room in its column',
      summary: 'Another long string field to push columns onto pages',
      author: '1',
      tags: ['a', 'b'],
    },
  ]),
);
const commentIds = range(40);

const state = {
  meta: {
    'GET https://example.com/posts': { date: 0, expiresAt: 0 },
    'GET https://example.com/broken': {
      date: 0,
      expiresAt: 0,
      error: new Error('404 Not Found'),
    },
  },
  entitiesMeta: {
    Post: { 1: { date: 1, fetchedAt: 1, expiresAt: 2 } },
  },
  indexes: {},
  optimistic: [],
  lastReset: 0,
  endpoints: {
    'GET https://example.com/posts': range(12),
    'GET https://example.com/comments': '{}',
  },
  entities: {
    User: { 1: { id: '1', name: 'Paul' } },
    Post: posts,
    Comment: Object.fromEntries(
      commentIds.map(id => [id, { id, text: `comment ${id}` }]),
    ),
    '[Comment]': { '{}': commentIds },
  },
} as unknown as State<unknown>;

function registry() {
  const r = new SchemaRegistry();
  r.endpoints.set('GET https://example.com/posts', {
    endpoint: { schema: [Post] },
    args: [],
  });
  r.endpoints.set('GET https://example.com/comments', {
    endpoint: { schema: comments },
    args: [],
  });
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

function mount(s = state, r = registry()) {
  return render(
    <StateContext.Provider value={s}>
      <StorePanel registry={r} />
    </StateContext.Provider>,
  );
}

describe('StorePanel table view', () => {
  it('shows a few rows of every table, Collections after their Entity', () => {
    mount();
    const groups = [...top().querySelectorAll('[data-table]')].map(g =>
      g.getAttribute('data-table'),
    );
    expect(groups).toEqual(['User', 'Post', 'Comment', '[Comment]']);
    const post = within(top().querySelector('[data-table=Post]')!);
    expect(post.getAllByRole('row').filter(r => r.dataset.id)).toHaveLength(5);
    expect(post.getByText('7 more')).toBeTruthy();
    // the error endpoint shows its message
    expect(screen.getByText('404 Not Found')).toBeTruthy();
  });

  it('dives into a record and back', () => {
    mount();
    fireEvent.click(within(top()).getByText('"Paul"'));
    expect(crumbs()).toEqual(['State', '›', 'User 1']);
    expect(within(top()).getByText('used by')).toBeTruthy();
    // a ref chip dives further
    fireEvent.click(within(top()).getByRole('button', { name: 'Post 1' }));
    expect(crumbs()).toEqual(['State', '›', 'User 1', '›', 'Post 1']);
    act(() => press('Escape'));
    expect(crumbs()).toEqual(['State', '›', 'User 1']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    expect(top().querySelector('nav')).toBeNull();
  });

  it('lists a whole table with a filter', () => {
    mount();
    fireEvent.click(screen.getByText('7 more'));
    expect(crumbs()).toEqual(['State', '›', 'Post12']);
    const rows = () =>
      [...top().querySelectorAll('tr[data-id]')].map(
        r => r.getAttribute('data-id')?.split('\u001f')[2],
      );
    expect(rows()).toHaveLength(12);
    fireEvent.change(within(top()).getByLabelText('Filter rows'), {
      target: { value: 'number 1' },
    });
    expect(rows()).toEqual(['1', '10', '11', '12']);
    expect(within(top()).getByText('4 of 12')).toBeTruthy();
    fireEvent.change(within(top()).getByLabelText('Filter rows'), {
      target: { value: 'nope' },
    });
    expect(within(top()).getByText('no matches')).toBeTruthy();
  });

  it('pages fields and shows the rest below a row', () => {
    mount();
    const post = () => within(top().querySelector('[data-table=Post]')!);
    const headers = () =>
      post()
        .getAllByRole('columnheader')
        .map(h => h.textContent);
    expect(headers()).toEqual(['id', 'title', 'body', '']);
    fireEvent.click(post().getByLabelText('Next fields'));
    expect(headers()).toEqual(['id', 'summary', 'author', 'tags', '']);
    fireEvent.click(post().getByLabelText('Previous fields'));

    const more = post().getAllByLabelText(/Show \d+ more fields below/)[0];
    fireEvent.click(more);
    expect(post().getByText('summary')).toBeTruthy();
    fireEvent.click(post().getByLabelText('Hide fields'));
    expect(post().queryByLabelText('Hide fields')).toBeNull();
    fireEvent.keyDown(post().getAllByLabelText(/more fields below/)[0], {
      key: 'Enter',
    });
    expect(post().getByLabelText('Hide fields')).toBeTruthy();
  });

  it('dives into long lists of refs and endpoint lists', () => {
    mount();
    const collection = within(top().querySelector('[data-table="[Comment]"]')!);
    fireEvent.click(collection.getByText(/^\+\d+$/));
    expect(crumbs()[2]).toMatch(/^\[Comment\] all items40$/);
    expect(top().querySelectorAll('tr[data-id]').length).toBeGreaterThan(0);
  });

  it('switches to the tree view', () => {
    mount();
    fireEvent.click(screen.getByLabelText('Tree view'));
    expect(
      screen.getByLabelText('Tree view').getAttribute('aria-pressed'),
    ).toBe('true');
    expect(document.querySelector('[data-table]')).toBeNull();
  });
});
