/// <reference types="jest" />
import { Collection, Entity } from '@data-client/endpoint';
import { StateContext, type State } from '@data-client/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { byData } from '../store/dom';
import { endpointId, entityId, groupId, parseRowId } from '../store/model';
import SchemaRegistry from '../store/schemaRegistry';
import StorePanel from '../store/StorePanel';
import { DemoViewContext, StoreToggle, useStoreOpen } from '../StoreToggle';

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
      <StorePanel registry={r} history={0} />
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

  it('marks invalidated rows and shows a lone ref however long its pk', () => {
    const long = '38200029883820002988382000298838200029883820002988';
    const r = registry();
    r.endpoints.set('POST https://example.com/users', {
      endpoint: { schema: [User] },
      args: [],
    });
    mount(
      {
        ...state,
        endpoints: {
          ...state.endpoints,
          'POST https://example.com/users': [long],
        },
        entities: {
          ...state.entities,
          User: {
            ...state.entities.User,
            2: Symbol('INVALID'),
            [long]: { id: long, name: 'Al' },
          },
          // every row invalidated: no field columns
          Comment: { 1: Symbol('INVALID') },
        },
      } as unknown as State<unknown>,
      r,
    );
    const users = within(top().querySelector('[data-table=User]')!);
    expect(users.getByText('invalid')).toBeTruthy();
    // a table with no field columns marks it by the key
    const comments = within(top().querySelector('[data-table=Comment]')!);
    expect(comments.getByText('invalid')).toBeTruthy();
    const endpoint = byData(
      top(),
      'id',
      endpointId('POST https://example.com/users'),
    );
    expect(endpoint?.textContent).toContain(long);
  });

  it('dives into a record and back', () => {
    mount();
    fireEvent.click(within(top()).getByText('"Paul"'));
    expect(crumbs()).toEqual(['Store', '›', 'User1', '›', '1']);
    expect(within(top()).getByText('used by')).toBeTruthy();
    // a ref chip dives further
    fireEvent.click(within(top()).getByRole('button', { name: 'Post 1' }));
    // where it lives in the store, not where it was opened from
    expect(crumbs()).toEqual(['Store', '›', 'Post12', '›', '1']);
    act(() => press('Escape'));
    expect(crumbs()).toEqual(['Store', '›', 'User1', '›', '1']);
    // its table's crumb opens the table
    fireEvent.click(
      within(top().querySelector('nav')!).getByRole('button', {
        name: /^User/,
      }),
    );
    expect(crumbs()).toEqual(['Store', '›', 'User1']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    expect(crumbs()).toEqual(['Store', '›', 'User1', '›', '1']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    expect(top().querySelector('nav')).toBeNull();
  });

  it("goes back to a record's table by its crumb when the table opened it", () => {
    mount();
    fireEvent.click(screen.getByText('7 more'));
    fireEvent.click(within(top()).getAllByText(/number 1 that/)[0]);
    expect(crumbs()).toEqual(['Store', '›', 'Post12', '›', '1']);
    fireEvent.click(
      within(top().querySelector('nav')!).getByRole('button', {
        name: /^Post/,
      }),
    );
    expect(crumbs()).toEqual(['Store', '›', 'Post12']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    expect(top().querySelector('nav')).toBeNull();
  });

  it('lists a whole table with a filter', () => {
    mount();
    fireEvent.click(screen.getByText('7 more'));
    expect(crumbs()).toEqual(['Store', '›', 'Post12']);
    const rows = () =>
      [...top().querySelectorAll('tr[data-id]')].map(r => {
        const ref = parseRowId(r.getAttribute('data-id')!);
        return ref?.kind === 'entity' ? ref.pk : undefined;
      });
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
    // a Collection's +N opens its own record: the member table and its meta
    fireEvent.click(collection.getByText(/^\+\d+$/));
    expect(crumbs().slice(2)).toEqual(['[Comment]1', '›', 'all']);
    expect(top().querySelectorAll('tr[data-id]').length).toBeGreaterThan(0);
    expect(within(top()).getByText('used by')).toBeTruthy();
  });

  it('opens a Collection as a table of its members', () => {
    mount();
    const collection = top().querySelector('[data-table="[Comment]"]')!;
    fireEvent.click(collection.querySelector('tr[data-id]')!);
    // the member table, with the Collection's own meta above it
    expect(top().querySelectorAll('tr[data-id]').length).toBeGreaterThan(0);
    expect(within(top()).getByText('used by')).toBeTruthy();
    expect(within(top()).getByLabelText('Filter rows')).toBeTruthy();
  });

  it('switches to the tree view', () => {
    mount();
    fireEvent.click(screen.getByLabelText('Tree view'));
    expect(
      screen.getByLabelText('Tree view').getAttribute('aria-pressed'),
    ).toBe('true');
    expect(document.querySelector('[data-table]')).toBeNull();
  });

  it('dives in from the tree view as the table does, and back', () => {
    mount();
    fireEvent.click(screen.getByLabelText('Tree view'));
    const post = () => byData(top(), 'id', entityId('Post', '1'))!;
    const opened = (key: string) =>
      byData(top(), 'id', groupId(key))!.getAttribute('aria-expanded');
    // the first three types to appear start open
    expect(['User', 'Post', 'Comment', '[Comment]'].map(opened)).toEqual([
      'true',
      'true',
      'true',
      'false',
    ]);
    // a row expands in place
    fireEvent.click(post());
    expect(post().getAttribute('aria-expanded')).toBe('true');
    // its references dive into the record
    fireEvent.click(
      within(top()).getAllByRole('button', { name: 'User 1' })[0],
    );
    expect(crumbs()).toEqual(['Store', '›', 'User1', '›', '1']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    expect(top().querySelector('nav')).toBeNull();
    // the tree is as it was left
    expect(post().getAttribute('aria-expanded')).toBe('true');
    // and stays so while its group is shut and opened again
    const group = byData(top(), 'id', groupId('Post'))!;
    fireEvent.click(group);
    expect(byData(top(), 'id', entityId('Post', '1'))).toBeUndefined();
    fireEvent.click(group);
    expect(post().getAttribute('aria-expanded')).toBe('true');
    // so do the rows a group leaves out
    fireEvent.click(within(top()).getByText('7 more'));
    expect(crumbs()).toEqual(['Store', '›', 'Post12']);
  });

  it("shows a demo's view over the reader's while the Store stays open", () => {
    let showStore: ReturnType<typeof useStoreOpen>[2] = () => {};
    let renders = 0;
    function Demo({ children }: { children: React.ReactNode }) {
      renders++;
      const [open, toggle, show, demoView] = useStoreOpen('test', 'y');
      showStore = show;
      return (
        <DemoViewContext.Provider value={demoView}>
          <StoreToggle onClick={toggle} open={open} />
          {children}
        </DemoViewContext.Provider>
      );
    }
    const readerToggle = () =>
      fireEvent.click(document.querySelector('[data-store-toggle]')!);
    render(
      <Demo>
        <StateContext.Provider value={state}>
          <StorePanel registry={registry()} history={0} />
        </StateContext.Provider>
      </Demo>,
    );
    const table = () => document.querySelector('[data-table="User"]');
    // the reader's choice
    fireEvent.click(screen.getByLabelText('Tree view'));
    expect(table()).toBeNull();
    // a demo's targets are table rows
    act(() => showStore(true, 'table'));
    expect(table()).not.toBeNull();
    // a step naming no view keeps the demo's, and changes nothing
    const before = renders;
    act(() => showStore(true));
    expect(table()).not.toBeNull();
    expect(renders).toBe(before);
    // the demo closing gives the reader's view back, which it didn't save
    act(() => showStore(false));
    expect(table()).toBeNull();
    // so does the reader toggling the Store
    act(() => showStore(true, 'table'));
    readerToggle();
    expect(table()).toBeNull();
    // and the reader picking a view takes over from the demo's
    act(() => showStore(true, 'table'));
    expect(table()).not.toBeNull();
    fireEvent.click(screen.getByLabelText('Tree view'));
    expect(table()).toBeNull();
  });

  it('leaves focus alone as the overview first shows, and on the tab picked', () => {
    mount();
    expect(document.activeElement).toBe(document.body);
    const actions = screen.getByRole('tab', { name: 'Action' });
    actions.focus();
    fireEvent.click(actions);
    expect(actions.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(actions);
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    expect(actions.getAttribute('aria-selected')).toBe('false');
    expect(crumbs()).toEqual([]);
  });

  it('moves between and picks State and Action with the keyboard', () => {
    mount();
    const state = screen.getByRole('tab', { name: 'State' });
    const actions = screen.getByRole('tab', { name: 'Action' });
    expect(state.getAttribute('title')).toBe('The store at the moment');
    state.focus();
    fireEvent.keyDown(state, { key: 'ArrowRight' });
    expect(actions.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(actions);
    // modified arrows are left to the browser
    fireEvent.keyDown(actions, { key: 'ArrowLeft', altKey: true });
    expect(actions.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(actions, { key: 'Home' });
    expect(state.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(state);
    actions.focus();
    fireEvent.keyDown(actions, { key: 'Enter' });
    expect(actions.getAttribute('aria-selected')).toBe('true');
    state.focus();
    fireEvent.keyDown(state, { key: ' ' });
    expect(state.getAttribute('aria-selected')).toBe('true');
    // held or modified, it leaves the pick alone
    actions.focus();
    expect(fireEvent.keyDown(actions, { key: ' ', repeat: true })).toBe(false);
    fireEvent.keyDown(actions, { key: 'Enter', ctrlKey: true });
    expect(state.getAttribute('aria-selected')).toBe('true');
  });

  it("puts State's view switches in the tab row", () => {
    mount();
    expect(
      screen
        .getByRole('tablist')
        .parentElement!.contains(screen.getByLabelText('Tree view')),
    ).toBe(true);
  });

  it('keeps the levels open across the tree view, without replaying them', () => {
    mount();
    fireEvent.click(top().querySelector('[data-table=Post] tr[data-id]')!);
    const opened = crumbs();
    expect(opened.length).toBeGreaterThan(1);
    fireEvent.click(screen.getByLabelText('Tree view'));
    const table = screen.getByLabelText('Table view');
    table.focus();
    fireEvent.click(table);
    expect(crumbs()).toEqual(opened);
    // the open record shows as it was, keeping focus on the toggle
    expect(document.activeElement).toBe(table);
  });
});
