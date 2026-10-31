/// <reference types="jest" />
import { Collection, Entity } from '@data-client/endpoint';
import { StateContext, type State } from '@data-client/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { drawerToggle } from '../autorun/player';
import { byData } from '../store/dom';
import { endpointId, entityId, groupId, parseRowId } from '../store/model';
import SchemaRegistry from '../store/schemaRegistry';
import {
  DemoViewContext,
  InspectorContext,
  LookSlot,
  StoreHeaderToggle,
  StoreToggle,
  useStoreOpen,
} from '../StoreToggle';
import { InspectedPanel } from '../testing/inspected';

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
      <InspectedPanel registry={r} history={0} />
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
    expect(crumbs()).toEqual(['Store', '›', 'User', '›', '1']);
    expect(within(top()).getByText('used by')).toBeTruthy();
    // a ref chip dives further
    fireEvent.click(within(top()).getByRole('button', { name: 'Post 1' }));
    // where it lives in the store, not where it was opened from
    expect(crumbs()).toEqual(['Store', '›', 'Post', '›', '1']);
    act(() => press('Escape'));
    expect(crumbs()).toEqual(['Store', '›', 'User', '›', '1']);
    // its table's crumb opens the table
    fireEvent.click(
      within(top().querySelector('nav')!).getByRole('button', {
        name: /^User/,
      }),
    );
    expect(crumbs()).toEqual(['Store', '›', 'User']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    expect(crumbs()).toEqual(['Store', '›', 'User', '›', '1']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    expect(top().querySelector('nav')).toBeNull();
  });

  it("goes back to a record's table by its crumb when the table opened it", () => {
    mount();
    fireEvent.click(screen.getByText('7 more'));
    fireEvent.click(within(top()).getAllByText(/number 1 that/)[0]);
    expect(crumbs()).toEqual(['Store', '›', 'Post', '›', '1']);
    fireEvent.click(
      within(top().querySelector('nav')!).getByRole('button', {
        name: /^Post/,
      }),
    );
    expect(crumbs()).toEqual(['Store', '›', 'Post']);
    fireEvent.click(within(top()).getByLabelText('Back'));
    expect(top().querySelector('nav')).toBeNull();
  });

  it('lists a whole table with a filter', () => {
    mount();
    fireEvent.click(screen.getByText('7 more'));
    expect(crumbs()).toEqual(['Store', '›', 'Post']);
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
    expect(crumbs().slice(2)).toEqual(['[Comment]', '›', 'all']);
    expect(top().querySelectorAll('tr[data-id]').length).toBeGreaterThan(0);
    expect(within(top()).getByText('used by')).toBeTruthy();
  });

  it("puts a record's long ref list under the record", () => {
    mount();
    fireEvent.click(
      byData(top(), 'id', endpointId('GET https://example.com/posts'))!,
    );
    fireEvent.click(within(top()).getByRole('button', { name: /^\+\d+$/ }));
    expect(crumbs()).toEqual([
      'Store',
      '›',
      'Endpoints',
      '›',
      'GET /posts',
      '›',
      'items',
    ]);
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
    expect(crumbs()).toEqual(['Store', '›', 'User', '›', '1']);
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
    expect(crumbs()).toEqual(['Store', '›', 'Post']);
    // the list it opens is laid out as a tree too, every row expandable
    expect(top().querySelector('table')).toBeNull();
    const last = () => byData(top(), 'id', entityId('Post', '12'))!;
    expect(last().getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(last());
    expect(last().getAttribute('aria-expanded')).toBe('true');
    fireEvent.change(within(top()).getByLabelText('Filter rows'), {
      target: { value: 'number 11' },
    });
    expect(byData(top(), 'id', entityId('Post', '12'))).toBeUndefined();
    expect(byData(top(), 'id', entityId('Post', '11'))).toBeTruthy();
    // and says how many match, as the table does
    expect(within(top()).getByText('1 of 12')).toBeTruthy();
    fireEvent.change(within(top()).getByLabelText('Filter rows'), {
      target: { value: 'nothing like this' },
    });
    expect(within(top()).getByText('no matches')).toBeTruthy();
  });

  it("lays out a Collection's members as a tree in the tree view", () => {
    mount();
    const collection = within(top().querySelector('[data-table="[Comment]"]')!);
    fireEvent.click(collection.getByText(/^\+\d+$/));
    expect(top().querySelector('table')).toBeTruthy();
    // the open record follows the toggle
    fireEvent.click(screen.getByLabelText('Tree view'));
    expect(crumbs()).toEqual(['Store', '›', '[Comment]', '›', 'all']);
    expect(top().querySelector('table')).toBeNull();
    expect(
      byData(top(), 'id', entityId('Comment', '1'))!.getAttribute(
        'aria-expanded',
      ),
    ).toBe('false');
  });

  it("shows a demo's view over the reader's while the Store stays open", () => {
    let showStore: ReturnType<typeof useStoreOpen>[2] = () => {};
    let renders = 0;
    function Demo({ children }: { children: React.ReactNode }) {
      renders++;
      const [open, toggle, show, demoView] = useStoreOpen('test', 'store');
      showStore = show;
      return (
        <DemoViewContext.Provider value={demoView}>
          <StoreToggle onToggle={toggle} open={open} />
          {children}
        </DemoViewContext.Provider>
      );
    }
    const readerToggle = () =>
      fireEvent.click(document.querySelector('[data-store-toggle="store"]')!);
    render(
      <Demo>
        <StateContext.Provider value={state}>
          <InspectedPanel registry={registry()} history={0} />
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

  it('switches the stacked strip between the Actions and Store tabs', () => {
    function Strip() {
      const [open, toggle, , , , inspector] = useStoreOpen('strip', 'store');
      return (
        <InspectorContext.Provider value={inspector}>
          <StoreToggle onToggle={toggle} open={open} />
        </InspectorContext.Provider>
      );
    }
    render(<Strip />);
    const tab = (name: string) => screen.getByRole('tab', { name });
    expect(tab('Store').getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tab('Actions'));
    expect(tab('Actions').getAttribute('aria-selected')).toBe('true');
    expect(tab('Store').getAttribute('aria-selected')).toBe('false');
    // the tab showing shuts the Store
    fireEvent.click(tab('Actions'));
    expect(tab('Actions').getAttribute('aria-selected')).toBe('false');
  });

  it("opens a demo's Actions tab at the list, as its handle does", () => {
    let showStore: ReturnType<typeof useStoreOpen>[2] = () => {};
    let listed = 0;
    function Demo() {
      const [, , show, , , inspector] = useStoreOpen('demo-actions', 'store');
      showStore = show;
      listed = inspector.listed;
      return null;
    }
    render(<Demo />);
    const before = listed;
    act(() => showStore(true, undefined, 'actions'));
    expect(listed).toBe(before + 1);
    act(() => showStore(true, undefined, 'store'));
    expect(listed).toBe(before + 1);
  });

  it("switches tabs from a narrow playground's header, as the strip does", () => {
    function Header() {
      const [open, toggle, , , , inspector] = useStoreOpen('header', 'n');
      return (
        <InspectorContext.Provider value={inspector}>
          <StoreHeaderToggle onClick={toggle} open={open} />
        </InspectorContext.Provider>
      );
    }
    render(<Header />);
    const button = (name: string) => screen.getByRole('button', { name });
    const pressed = (name: string) =>
      button(name).getAttribute('aria-pressed') === 'true';
    fireEvent.click(button('Actions'));
    expect([pressed('Actions'), pressed('Store')]).toEqual([true, false]);
    fireEvent.click(button('Store'));
    expect([pressed('Actions'), pressed('Store')]).toEqual([false, true]);
    // a demo finds each by its tab, and the one showing to shut it
    const find = (tab?: 'store' | 'actions') =>
      document.querySelector(drawerToggle(tab));
    expect(find('actions')).toBe(button('Actions'));
    expect(find()).toBe(button('Store'));
    // the tab showing shuts the Store
    fireEvent.click(button('Store'));
    expect([pressed('Actions'), pressed('Store')]).toEqual([false, false]);
  });

  it("opens a quick look as the mouse rests on a stacked header's toggle", () => {
    let peek: ReturnType<typeof useStoreOpen>[5]['peek'] | undefined;
    function Header() {
      const [open, toggle, , , , inspector] = useStoreOpen('peeks', 'store');
      peek = inspector.peek;
      return (
        <InspectorContext.Provider value={inspector}>
          <LookSlot value={document.body}>
            <StoreHeaderToggle onClick={toggle} open={open} />
          </LookSlot>
        </InspectorContext.Provider>
      );
    }
    render(<Header />);
    const rest = (name: string, pointerType: string) => {
      const event = new MouseEvent('pointerover', { bubbles: true });
      Object.assign(event, { pointerType });
      fireEvent(screen.getByRole('button', { name }), event);
      act(() => jest.advanceTimersByTime(500));
    };
    jest.useFakeTimers();
    try {
      // not the tab showing, nor from a touch: a tap opens the drawer
      rest('Store', 'mouse');
      rest('Actions', 'touch');
      expect(peek!.get()).toBeNull();
      rest('Actions', 'mouse');
      expect(peek!.get()).toBe('actions');
    } finally {
      jest.useRealTimers();
    }
  });

  it('moves focus along the strip with the arrows, picking nothing', () => {
    function Strip() {
      const [open, toggle, , , , inspector] = useStoreOpen('keys', 'n');
      return (
        <InspectorContext.Provider value={inspector}>
          <StoreToggle onToggle={toggle} open={open} />
        </InspectorContext.Provider>
      );
    }
    render(<Strip />);
    const tab = (name: string) => screen.getByRole('tab', { name });
    // one stop in the tab order: the tab it would open
    expect([tab('Actions').tabIndex, tab('Store').tabIndex]).toEqual([-1, 0]);
    tab('Store').focus();
    fireEvent.keyDown(tab('Store'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(tab('Actions'));
    fireEvent.keyDown(tab('Actions'), { key: 'End' });
    expect(document.activeElement).toBe(tab('Store'));
    fireEvent.keyDown(tab('Store'), { key: 'Home' });
    expect(document.activeElement).toBe(tab('Actions'));
    // modified keys keep their own meaning
    fireEvent.keyDown(tab('Actions'), { key: 'ArrowDown', altKey: true });
    expect(document.activeElement).toBe(tab('Actions'));
    expect(tab('Actions').getAttribute('aria-selected')).toBe('false');
    expect(tab('Store').getAttribute('aria-selected')).toBe('false');
  });

  it('leaves focus alone as the overview first shows, and on the tab picked', () => {
    mount();
    expect(document.activeElement).toBe(document.body);
    const actions = screen.getByRole('tab', { name: 'Actions' });
    actions.focus();
    fireEvent.click(actions);
    expect(actions.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(actions);
    fireEvent.click(screen.getByRole('tab', { name: 'Store' }));
    expect(actions.getAttribute('aria-selected')).toBe('false');
    expect(crumbs()).toEqual([]);
  });

  it("shows which view is open on the drawer's tabs, which name the sheet under them", () => {
    mount();
    const store = screen.getByRole('tab', { name: 'Store' });
    const actions = screen.getByRole('tab', { name: 'Actions' });
    expect(store.getAttribute('aria-selected')).toBe('true');
    expect(store.getAttribute('title')).toBe('Hide Store');
    expect(actions.getAttribute('aria-selected')).toBe('false');
    expect(actions.getAttribute('title')).toBe('Show Actions');
    expect(screen.getByRole('tabpanel', { name: 'Store' })).toBeTruthy();
    // the other tab takes over
    fireEvent.click(actions);
    expect(actions.getAttribute('aria-selected')).toBe('true');
    expect(store.getAttribute('aria-selected')).toBe('false');
    expect(store.getAttribute('title')).toBe('Show Store');
    expect(screen.getByRole('tabpanel', { name: 'Actions' })).toBeTruthy();
    // the tab showing shuts the drawer: neither is selected
    fireEvent.click(actions);
    expect(actions.getAttribute('aria-selected')).toBe('false');
    expect(store.getAttribute('aria-selected')).toBe('false');
    expect(actions.getAttribute('title')).toBe('Show Actions');
  });

  it("puts the shown tab's view switches in the scrubber's row", () => {
    mount();
    const bar = () => screen.getByRole('group', { name: /^Scrubber/ });
    expect(bar().contains(screen.getByLabelText('Tree view'))).toBe(true);
    // the Actions tab has its own
    fireEvent.click(screen.getByRole('tab', { name: 'Actions' }));
    expect(screen.queryByLabelText('Tree view')).toBeNull();
    expect(bar().contains(screen.getByLabelText('Every action'))).toBe(true);
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
