/// <reference types="jest" />
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  __INTERNAL__,
  actionTypes,
  Controller,
  DataProvider,
  NetworkManager,
  PollingSubscription,
  SubscriptionManager,
  useController,
  useSuspense,
  type ActionTypes,
  type State,
} from '@data-client/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React, { Suspense } from 'react';

import {
  diffStates,
  groupEntries,
  keepUnchanged,
  mergeChanges,
  rowTimeline,
} from '../store/actionGroups';
import ActionLog, {
  storeAt,
  type LogEntry,
  type LogOptions,
} from '../store/actionLog';
import { endpointId, entityId } from '../store/model';
import SchemaRegistry from '../store/schemaRegistry';
import StorePanel from '../store/StorePanel';

jest.mock('../../../../utils/tabStorage', () => ({
  useTabStorage: () => require('react').useState(null),
}));

const { createReducer, initialState } = __INTERNAL__;

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

/** `preview` renders beside the panel, as the live preview does */
function mount(preview?: React.ReactNode) {
  const registry = new SchemaRegistry({ trimEvery: 1 });
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
      {preview}
      <StorePanel registry={registry} history={history} />
    </DataProvider>
  );
  const { rerender } = render(ui(0));
  return {
    ctrl: () => ref.ctrl!,
    log: registry.log,
    history: () => registry.log.history(0),
    /** Shows another store's history */
    show: (history: number) => rerender(ui(history)),
  };
}

const subscribe = (key = 'k') => ({
  type: actionTypes.SUBSCRIBE,
  key,
  endpoint: {},
});
const unsubscribe = (key = 'other') => ({
  type: actionTypes.UNSUBSCRIBE,
  key,
  endpoint: {},
});
/** The Actions tab: the subject's actions at full width, one row per
 * request */
const openPane = () => fireEvent.click(actionsToggle());
/** Back to the State tab */
const openState = () =>
  fireEvent.click(screen.getAllByRole('tab', { name: 'State' })[0]);
/** State's store, its root level */
const toRoot = () => {
  openState();
  backTo('State');
};
/** At a moment, State shows the whole store the action left, not its diff */
const showAfter = () =>
  fireEvent.click(screen.getByRole('button', { name: 'After' }));
/** The actions peeking beside State, as the mouse rests on their tab */
const peek = () => screen.queryByRole('complementary', { name: 'Actions' });
/** The actions shown: the peek, else the full-width list on top */
const pane = () =>
  peek() ?? within(top()).getByRole('region', { name: 'Actions' });
/** The peek's head: `Actions`, the subject below the store, and the count */
const paneHead = () => peek()!.firstElementChild!.textContent!;
/** The full-width list's count, beside its crumbs */
const listCount = () =>
  within(top()).getByRole('navigation', { name: 'Store location' })
    .nextElementSibling!.textContent;
/** The Actions tab: a click lists the subject's actions at full width,
 * the mouse resting on it peeks at them */
const actionsToggle = () => screen.getAllByRole('tab', { name: 'Actions' })[0];
/** The pointer coming onto `el` (`inside`), or leaving it */
const hover = (el: Element, inside: boolean, pointerType = 'mouse') => {
  const event = new MouseEvent(inside ? 'pointerover' : 'pointerout', {
    bubbles: true,
    relatedTarget: inside ? document.body : el.parentElement,
  });
  Object.assign(event, { pointerType });
  fireEvent(el, event);
};
/** Past the peek's delays (with fake timers) */
const wait = () => act(() => jest.advanceTimersByTime(500));
/** Peeks at the subject's actions beside it, with fake timers from here */
const peekIn = () => {
  jest.useFakeTimers();
  hover(actionsToggle(), true);
  wait();
};
/** Back to level `name` from its crumb */
const backTo = (name: string) =>
  fireEvent.click(
    within(
      within(top()).getByRole('navigation', { name: 'Store location' }),
    ).getByRole('button', { name }),
  );
/** A row's ▸: opens or closes it without opening its action */
const expander = (row: HTMLElement) =>
  within(row).getByRole('button', { name: /its actions$/ });
/** The shown level's breadcrumbs (none at the store) */
const crumbs = () =>
  [
    ...(within(top())
      .queryByRole('navigation', { name: 'Store location' })
      ?.querySelectorAll('button, [aria-current="page"]') ?? []),
  ].map(el => el.textContent);
/** The rows of the actions shown */
const rows = () => [
  ...(peek() ?? top()).querySelectorAll<HTMLElement>(
    '[role="button"][aria-expanded]',
  ),
];
/** The pane's rows and steps marked as the moment's */
const marked = () =>
  [
    ...pane().querySelectorAll<HTMLElement>('[data-seq][aria-current="true"]'),
  ].map(el => el.textContent);
/** The scrubber on top: ‹ › and the marks, and the moment's action */
const scrubber = () => screen.getByRole('group', { name: /^Scrubber/ });
const previous = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Previous change' }));
/** The shown level's breadcrumb */
const current = () =>
  within(top())
    .getByRole('navigation', { name: 'Store location' })
    .querySelector('[aria-current="page"]')!.textContent;
/** Opens Post `pk`'s record from the table */
const openPost = (pk: string) =>
  fireEvent.click(
    top().querySelector<HTMLElement>(`tr[data-id="${entityId('Post', pk)}"]`)!,
  );
/** The shown level */
const top = () =>
  [...document.querySelectorAll<HTMLElement>('[data-level]')].find(
    el => !el.closest('[hidden]') && !el.hasAttribute('data-covered'),
  )!;

describe('Store Actions pane detail', () => {
  afterEach(() => jest.useRealTimers());

  it('opens the moment’s action at full width from a row, over the subject', async () => {
    const { ctrl } = mount();
    openPane();
    expect(pane().textContent).toContain('Nothing dispatched yet');
    await act(() => ctrl().fetch(getPosts));
    expect(rows()).toHaveLength(1);
    expect(marked()).toEqual([]);
    // a request's row stands for its response: it opens over the list, as
    // the moment
    fireEvent.click(rows()[0]);
    expect(scrubber().textContent).toContain('After');
    expect(scrubber().textContent).toContain('setResponse');
    expect(crumbs()).toEqual(['Actions', 'setResponse GET /posts']);
    expect(top().textContent).toContain('dispatchedAt');
    expect(
      within(top()).getByRole('button', { name: '+ Post 1' }),
    ).toBeTruthy();
    expect(
      within(top()).getByRole('button', { name: '+ Post 2' }),
    ).toBeTruthy();
    expect(
      within(top()).getByRole('button', { name: '+ GET /posts' }),
    ).toBeTruthy();
    // Back lists it as the moment's, open; a step is a moment too: the
    // store never saw the fetch
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    expect(crumbs()).toEqual(['Actions']);
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(rows()[0].getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(pane().querySelector<HTMLElement>('[data-seq="1"]')!);
    expect(scrubber().textContent).toContain('fetch');
    expect(crumbs()).toEqual(['Actions', 'fetch GET /posts']);
    expect(top().textContent).toContain('Started the request');
    expect(top().textContent).not.toContain('+ Post 1');
    // State shows the subject again, the moment staying
    openState();
    expect(crumbs()).toEqual([]);
    expect(scrubber().textContent).toContain('fetch');
    // live again: no moment; nothing is marked
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    openPane();
    expect(marked()).toEqual([]);
  });

  it('focuses an action picked over another, which then slides in', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().set(Post, { id: '3' }, { id: '3', title: 'Third' }));
    openPane();
    fireEvent.click(rows()[0]);
    expect(document.activeElement).toBe(top());
    // from the list, over that action: the new one takes its place, focused
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    rows()[1].focus();
    fireEvent.click(rows()[1]);
    expect(crumbs()).toEqual(['Actions', 'set Post']);
    expect(document.activeElement).toBe(top());
  });

  it('going live leaves no action in the stack, under the top or on it', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    openPane();
    fireEvent.click(rows()[0]);
    // a record the action added, opened from it
    fireEvent.click(within(top()).getByRole('button', { name: '+ Post 1' }));
    expect(crumbs()).toEqual(['Actions', 'setResponse GET /posts', 'Post 1']);
    // the list stays, the actions over it go
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(crumbs()).toEqual(['Actions']);
  });

  it('scopes the changes to the subject it is over', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().set(Post, { id: '3' }, { id: '3', title: 'Third' }));
    const chip = (name: string) =>
      within(top()).queryAllByRole('button', { name })[0] ?? null;
    // a record: just its own changes
    openPost('1');
    openPane();
    fireEvent.click(rows()[0]);
    expect(crumbs()).toEqual(['Actions of Post 1', 'setResponse GET /posts']);
    expect(chip('+ Post 1')).toBeTruthy();
    expect(chip('+ Post 2')).toBeNull();
    expect(chip('+ GET /posts')).toBeNull();
    // a list of rows, at an action that left them alone, which a chip in
    // the list opens there; its action, over it, says so
    openState();
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    previous();
    expect(scrubber().textContent).toContain('set Post');
    openPane();
    fireEvent.click(
      within(rows()[0]).getByRole('button', { name: '+ 2 Post' }),
    );
    expect(crumbs()).toEqual(['Actions', 'new Post2']);
    fireEvent.click(screen.getByTitle('Show action'));
    expect(crumbs()).toEqual([
      'Actions',
      'new Post2',
      'Actions of new Post2',
      'set Post',
    ]);
    expect(top().textContent).toContain('No change to these rows');
    // over the store's actions, its changes' chips drill on
    backTo('Actions');
    fireEvent.click(screen.getByTitle('Show action'));
    expect(crumbs()).toEqual(['Actions', 'set Post']);
    fireEvent.click(within(top()).getByRole('button', { name: '+ Post 3' }));
    expect(crumbs()).toEqual(['Actions', 'set Post', 'Post 3']);
    expect(top().textContent).toContain('"Third"');
  });

  it('keeps showing the moment’s action as the scrubber steps, at full width', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    openPane();
    fireEvent.click(rows()[1]);
    expect(crumbs()).toEqual(['Actions', 'set Post']);
    expect(top().textContent).toMatch(/title: "One" → "Edited"/);
    // the level stays, showing the action stepped to
    const level = top();
    previous();
    expect(top()).toBe(level);
    expect(crumbs()).toEqual(['Actions', 'setResponse GET /posts']);
    expect(
      within(top()).getByRole('button', { name: '+ Post 1' }),
    ).toBeTruthy();
    // past the newest, live: the action view goes, back to the list
    fireEvent.click(screen.getByRole('button', { name: 'Next change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next change' }));
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(crumbs()).toEqual(['Actions']);
  });

  it('opens the action from the scrubber’s label and a record’s last change, with focus', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    // the label names the moment's action, and opens it
    previous();
    expect(scrubber().textContent).toContain('set');
    fireEvent.click(screen.getByTitle('Show action'));
    expect(crumbs()).toEqual(['Actions', 'set Post']);
    expect(top().textContent).toMatch(/title: "One" → "Edited"/);
    expect(document.activeElement).toBe(top());
    // a record links to the action that last changed it, moving the moment
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    openState();
    expect(crumbs()).toEqual([]);
    openPost('1');
    expect(top().textContent).toContain('changed by');
    const changedBy = within(top()).getByRole('button', { name: /^set Post/ });
    changedBy.focus();
    fireEvent.click(changedBy);
    expect(crumbs()).toEqual(['Actions of Post 1', 'set Post']);
    expect(scrubber().textContent).toContain('After');
    expect(top().textContent).toMatch(/title: "One" → "Edited"/);
    expect(document.activeElement).toBe(top());
    // so does the tree view
    openState();
    fireEvent.click(screen.getByLabelText('Tree view'));
    fireEvent.click(
      [...document.querySelectorAll<HTMLElement>('[data-id]')].find(
        el => el.dataset.id === entityId('Post', '1'),
      )!,
    );
    fireEvent.click(within(top()).getByRole('button', { name: /^set Post/ }));
    expect(crumbs()).toEqual(['Actions of Post 1', 'set Post']);
  });

  it('steps between rows with ↑ ↓, as the moment', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    openPane();
    rows()[0].focus();
    fireEvent.keyDown(rows()[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows()[1]);
    expect(rows()[1].getAttribute('aria-current')).toBe('true');
    expect(scrubber().textContent).toContain('set');
    fireEvent.keyDown(rows()[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(rows()[0]);
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    // past the ends, nothing
    fireEvent.keyDown(rows()[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(rows()[0]);
    // into a row's steps and back up to its head, which stands for the
    // response the moment is past: focus alone moves
    fireEvent.keyDown(rows()[0], { key: 'ArrowDown' });
    const fetch = document.activeElement as HTMLElement;
    expect(fetch.dataset.seq).toBe('1');
    expect(fetch.getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(fetch, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(rows()[0]);
    expect(fetch.getAttribute('aria-current')).toBe('true');
    // the row's ▸ closes it though the moment is at one of its steps, and
    // the pane stays
    fireEvent.click(expander(rows()[0]));
    expect(rows()[0].getAttribute('aria-expanded')).toBe('false');
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(scrubber().textContent).toContain('fetch');
    fireEvent.click(expander(rows()[0]));
    expect(rows()[0].getAttribute('aria-expanded')).toBe('true');
    // and a row's ▸ opens and closes it while the moment is on another
    for (let i = 0; i < 3; i++)
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows()[1]);
    expect(rows()[1].getAttribute('aria-current')).toBe('true');
    fireEvent.click(expander(rows()[0]));
    expect(rows()[0].getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(expander(rows()[0]));
    expect(rows()[0].getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(expander(rows()[0]));
    expect(rows()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('peeks as the mouse rests on its tab, while over either', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    jest.useFakeTimers();
    const toggle = actionsToggle();
    // a touch shows nothing: a tap is a click
    hover(toggle, true, 'touch');
    wait();
    expect(peek()).toBeNull();
    hover(toggle, true);
    expect(peek()).toBeNull();
    wait();
    expect(paneHead()).toBe('Actions' + '1');
    expect(toggle.getAttribute('aria-selected')).toBe('false');
    // State stays laid out under it
    expect(top().closest('[inert]')).toBeNull();
    expect(crumbs()).toEqual([]);
    // from the tab into it, it stays
    hover(toggle, false);
    hover(peek()!, true);
    wait();
    expect(peek()).toBeTruthy();
    // away from both, it goes
    hover(peek()!, false);
    wait();
    expect(peek()).toBeNull();
    // a click opens the tab instead, which peeks no more
    hover(toggle, true);
    wait();
    fireEvent.click(toggle);
    expect(peek()).toBeNull();
    expect(crumbs()).toEqual(['Actions']);
    expect(listCount()).toBe('1');
    expect(toggle.getAttribute('aria-selected')).toBe('true');
    hover(toggle, false);
    hover(toggle, true);
    wait();
    expect(peek()).toBeNull();
    // nor as State shows again
    openState();
    expect(peek()).toBeNull();
    expect(crumbs()).toEqual([]);
    expect(toggle.getAttribute('aria-selected')).toBe('false');
  });

  it('moves the moment to a row peeked, staying over State', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().set(Post, { id: '3' }, { id: '3', title: 'Third' }));
    jest.useFakeTimers();
    openPost('1');
    hover(actionsToggle(), true);
    wait();
    expect(paneHead()).toBe('ActionsPost 1' + '1');
    fireEvent.click(rows()[0]);
    expect(peek()).toBeTruthy();
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(scrubber().textContent).toContain('setResponse');
    // State shows what it did to the record
    expect(crumbs()).toEqual(['State', 'Post 1']);
    expect(top().textContent).toContain('+Post 1id: "1", title: "One"');
    expect(actionsToggle().getAttribute('aria-selected')).toBe('false');
  });

  it('closes with Escape or a press outside, back to its toggle', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    jest.useFakeTimers();
    const toggle = actionsToggle();
    hover(toggle, true);
    wait();
    rows()[0].focus();
    fireEvent.keyDown(rows()[0], { key: 'Escape' });
    expect(peek()).toBeNull();
    expect(document.activeElement).toBe(toggle);
    hover(toggle, true);
    wait();
    fireEvent.pointerDown(toggle);
    expect(peek()).toBeTruthy();
    fireEvent.pointerDown(peek()!);
    expect(peek()).toBeTruthy();
    fireEvent.pointerDown(top());
    expect(peek()).toBeNull();
  });

  it('shuts with Escape before a level under it goes back', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    jest.useFakeTimers();
    openPost('1');
    hover(actionsToggle(), true);
    wait();
    fireEvent.keyDown(top(), { key: 'Escape' });
    expect(peek()).toBeNull();
    expect(current()).toBe('Post 1');
    fireEvent.keyDown(top(), { key: 'Escape' });
    expect(crumbs()).toEqual([]);
  });

  it('keeps the action open in its tab while State changes view', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    openPane();
    fireEvent.click(rows()[0]);
    openState();
    fireEvent.click(screen.getByLabelText('Tree view'));
    openPane();
    expect(crumbs()).toEqual(['Actions', 'setResponse GET /posts']);
  });

  it("peeks only for its own panel, closing as another's toggle is pressed", async () => {
    // a page holds several playgrounds, each with a store panel
    const other = new SchemaRegistry({ trimEvery: 1 });
    other.log.connect(0);
    const { ctrl } = mount(<StorePanel registry={other} history={0} />);
    await act(() => ctrl().fetch(getPosts));
    jest.useFakeTimers();
    const [first, mine] = screen.getAllByRole('tab', { name: 'Actions' });
    hover(mine, true);
    wait();
    expect(
      screen.getAllByRole('complementary', { name: 'Actions' }),
    ).toHaveLength(1);
    expect(rows()).toHaveLength(1);
    fireEvent.pointerDown(first);
    expect(peek()).toBeNull();
  });

  it('shows a removed record as the action found it', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    openPost('2');
    openPane();
    await act(async () => {
      ctrl().dispatch({
        type: actionTypes.GC,
        entities: [{ key: 'Post', pk: '2' }],
        endpoints: [],
      });
    });
    expect(rows()).toHaveLength(2);
    fireEvent.click(rows()[1]);
    // the record is gone at the moment, so its crumb can't name it
    expect(crumbs()).toEqual(['Actions of …', 'gc']);
    expect(top().textContent).toContain('Removed; it was:');
    expect(top().textContent).toContain('"Two"');
  });
});

describe('Store Actions pane', () => {
  it('folds a fetch and its response into one row with what it added', async () => {
    const { ctrl } = mount();
    // a second read while the first is in flight is deduped into it
    await act(() =>
      Promise.all([ctrl().fetch(getPosts), ctrl().fetch(getPosts)]),
    );
    openPane();
    const [row] = rows();
    expect(rows()).toHaveLength(1);
    expect(row.textContent).toContain('GET');
    expect(row.textContent).toContain('/posts');
    expect(row.textContent).toMatch(/\d+ ms/);
    expect(
      within(row).getByRole('button', { name: /^\+ ?2 Post$/ }),
    ).toBeTruthy();
    expect(row.textContent).toContain('×2');
    fireEvent.click(expander(row));
    expect(
      screen.getByText('1 more fetch deduped into this request'),
    ).toBeTruthy();
    fireEvent.click(expander(row));

    // the same data again changes nothing
    await act(() => ctrl().fetch(getPosts));
    expect(rows()).toHaveLength(2);
    expect(rows()[1].textContent).toContain('stored again, unchanged');
  });

  it('says how many earlier updates a row no longer has', async () => {
    const { ctrl } = mount();
    await act(async () => {
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '1' }, { id: '1', title: `t${i}` });
    });
    openPane();
    // the store's first action stays, as it marks where the store began
    const oldest = rows().find(row =>
      row.textContent?.includes('4 earlier sets not kept'),
    )!;
    expect(oldest).toBeTruthy();
    expect(oldest.textContent).not.toContain('keeps the newest');
    fireEvent.click(oldest);
    expect(top().textContent).toContain('dispatchedAt');
  });

  it('keeps a moment the store never saw as the log grows', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    openPane();
    // the store never saw the fetch, so State stays as it was before the
    // response
    fireEvent.click(expander(rows()[0]));
    fireEvent.click(pane().querySelector<HTMLElement>('[data-seq="1"]')!);
    expect(scrubber().textContent).toContain('fetch');
    expect(crumbs()).toEqual(['Actions', 'fetch GET /posts']);
    expect(top().textContent).toContain('Started the request');
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Later' }));
    expect(crumbs()).toEqual(['Actions', 'fetch GET /posts']);
    expect(top().textContent).toContain('Started the request');
    expect(scrubber().textContent).toContain('fetch');
    openState();
    showAfter();
    expect(top().textContent).not.toContain('"One"');
  });

  it('marks the moment’s action in the list, with its row open', async () => {
    const scrollTo = jest.fn();
    Element.prototype.scrollTo = scrollTo;
    try {
      const { ctrl } = mount();
      await act(() => ctrl().fetch(getPosts));
      await act(() => ctrl().fetch(getPosts));
      openPane();
      const list = rows()[0].parentElement!.parentElement!;
      Object.defineProperty(list, 'clientHeight', { value: 100 });
      const marked = () =>
        [
          ...document.querySelectorAll<HTMLElement>('[aria-current="true"]'),
        ].map(el => el.textContent);
      // live: nothing is marked
      expect(marked()).toEqual([]);
      // back to the first response: its row opens, marked, and scrolls into view
      previous();
      previous();
      expect(rows()[0].getAttribute('aria-expanded')).toBe('true');
      expect(rows()[0].getAttribute('aria-current')).toBe('true');
      expect(marked()).toHaveLength(2);
      expect(marked()[1]).toContain('setResponse');
      expect(marked()[1]).not.toContain('fetch');
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
      );
      // the row may close again
      fireEvent.click(expander(rows()[0]));
      expect(rows()[0].getAttribute('aria-expanded')).toBe('false');
      expect(marked()).toHaveLength(1);
      // live again: no mark
      fireEvent.click(screen.getByRole('button', { name: 'Live' }));
      expect(marked()).toEqual([]);
    } finally {
      delete (Element.prototype as any).scrollTo;
    }
  });

  it('reveals the moment’s action as the pane first shows, keeping it in view', async () => {
    const scrollTo = jest.fn();
    Element.prototype.scrollTo = scrollTo;
    // every level shows, as it would on screen
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 100,
    });
    try {
      const { ctrl } = mount();
      await act(() => ctrl().fetch(getPosts));
      await act(() =>
        ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
      );
      // live again before the pane first shows: nothing to reveal
      previous();
      fireEvent.click(screen.getByRole('button', { name: 'Live' }));
      openPane();
      expect(scrollTo).not.toHaveBeenCalled();
      // a lone action is marked on its row alone, which stays closed, and
      // keeps the focus where it was
      openState();
      previous();
      openPane();
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
      );
      const marked = [
        ...document.querySelectorAll<HTMLElement>('[aria-current="true"]'),
      ];
      expect(marked).toHaveLength(1);
      expect(marked[0]).toBe(rows()[1]);
      expect(rows()[1].getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).not.toBe(rows()[1]);
      // new rows don't push it out of view; live, the newest is followed again
      const list = rows()[0].parentElement!.parentElement!;
      Object.defineProperty(list, 'scrollHeight', { value: 900 });
      list.scrollTop = 0;
      await act(() =>
        ctrl().set(Post, { id: '2' }, { id: '2', title: 'Later' }),
      );
      expect(list.scrollTop).toBe(0);
      fireEvent.click(screen.getByRole('button', { name: 'Live' }));
      expect(list.scrollTop).toBe(900);
    } finally {
      delete (Element.prototype as any).scrollTo;
      delete (HTMLElement.prototype as any).clientHeight;
    }
  });

  it('shows an optimistic update, its diff, and State as it was then', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    let done: Promise<unknown> = Promise.resolve();
    await act(async () => {
      done = ctrl().fetch(updatePost, { id: '1' }, { title: 'Edited' });
    });
    openPane();
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
    fireEvent.click(expander(rows()[1]));
    const step = screen
      .getByText('optimistic')
      .closest<HTMLElement>('[role="button"]')!;
    fireEvent.click(step);
    expect(top().textContent).toMatch(/title: "One" → "Edited"/);

    // State as it was then
    openState();
    showAfter();
    const statePanel = top();
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
    // the section stays once seen, so settling doesn't shift what's below
    expect(statePanel.textContent).toContain('None pending');
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
    openPane();
    const row = rows()[1];
    expect(
      within(row).getByRole('button', { name: /^~ ?Post 1$/ }),
    ).toBeTruthy();
    expect(
      within(row).getByRole('button', { name: /^\+ ?Post 3$/ }),
    ).toBeTruthy();
  });

  it('opens what an action changed as it left the store', async () => {
    const { ctrl } = mount();
    const posts = (key: string, rows: object[]) =>
      new Endpoint(async () => rows, {
        schema: [Post],
        key: () => `GET https://example.com/${key}`,
        name: key,
      });
    await act(() => ctrl().fetch(posts('a', [{ id: '1', title: 'Uno' }])));
    await act(() =>
      ctrl().fetch(
        posts('b', [
          { id: '1', title: 'Later' },
          { id: '3', title: 'Three' },
        ]),
      ),
    );
    act(() => {
      ctrl().dispatch({
        type: actionTypes.GC,
        entities: [{ key: 'Post', pk: '3' }],
        endpoints: [],
      });
    });
    openPane();
    // as the first fetch left it, though a later one changed it
    fireEvent.click(within(rows()[0]).getByRole('button', { name: /Post 1/ }));
    expect(current()).toBe('Post 1');
    expect(top().textContent).toContain('after this action');
    expect(top().textContent).toContain('"Uno"');
    expect(top().textContent).not.toContain('"Later"');
    // the chip drills the subject alone: the moment stays live
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    // a collected row opens as it was before
    fireEvent.click(within(rows()[2]).getByRole('button', { name: /Post 3/ }));
    expect(top().textContent).toContain('before this action');
    expect(top().textContent).toContain('"Three"');
  });

  it('shows a moment picked on a record a chip opened as an action left it', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    openPane();
    // the response's new rows open as it left them
    fireEvent.click(
      within(rows()[0]).getByRole('button', { name: '+ 2 Post' }),
    );
    openPost('1');
    expect(top().textContent).toContain('after this action');
    expect(top().textContent).toContain('"One"');
    // a moment set outranks the store the chip opened the record at
    previous();
    expect(scrubber().textContent).toContain('set');
    expect(current()).toBe('Post 1');
    expect(top().textContent).not.toContain('after this action');
    expect(top().textContent).toContain('"Edited"');
    previous();
    expect(top().textContent).toContain('"One"');
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(top().textContent).toContain('"Edited"');
  });

  it('lets a suspended component wait without fetching again', async () => {
    let respond = () => {};
    const getSlow = new Endpoint(
      () =>
        new Promise<void>(resolve => {
          respond = resolve;
        }).then(() => [{ id: '1', title: 'One' }]),
      { schema: [Post], key: () => 'GET https://example.com/slow' },
    );
    function Reader() {
      return <>{useSuspense(getSlow).length} posts</>;
    }
    let read = () => {};
    function Later() {
      const [reading, setReading] = React.useState(false);
      read = () => setReading(true);
      return reading ?
          <Suspense fallback="loading">
            <Reader />
          </Suspense>
        : null;
    }
    const fetches = () =>
      history().entries.filter(e => e.action.type === actionTypes.FETCH);
    const { history } = mount(<Later />);
    openPane();
    // React schedules on its own, as it does in the browser
    const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const actEnvironment = env.IS_REACT_ACT_ENVIRONMENT;
    env.IS_REACT_ACT_ENVIRONMENT = false;
    try {
      read();
      await new Promise(resolve => setTimeout(resolve, 100));
      // React retries a suspended component once or twice on its own; were
      // the panel to render on each fetch, every render would fetch again
      expect(fetches().length).toBeLessThanOrEqual(3);
      respond();
      await screen.findByText('1 posts');
    } finally {
      env.IS_REACT_ACT_ENVIRONMENT = actEnvironment;
    }
    expect(rows()).toHaveLength(1);
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
    openPane();
    expect(rows()[0].textContent).toContain('error');
    expect(rows()[0].textContent).not.toMatch(/\d+ ms/);
  });

  it('lists a set on its own, and only its own store’s actions', async () => {
    const { ctrl, show } = mount();
    await act(() => ctrl().set(Post, { id: '3' }, { id: '3', title: 'New' }));
    openPane();
    const [row] = rows();
    expect(row.textContent).toContain('set');
    expect(
      within(row).getByRole('button', { name: /^\+ ?Post 3$/ }),
    ).toBeTruthy();

    // a new store's history starts live, without the paused one's actions
    previous();
    expect(scrubber().textContent).toContain('After');
    await act(async () => show(1));
    expect(rows()).toHaveLength(0);
    expect(screen.getByText(/Nothing dispatched yet/)).toBeTruthy();
    expect(screen.queryByText('After')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
  });
});

describe('Store diff', () => {
  const tableRows = () =>
    [...top().querySelectorAll<HTMLElement>('tr[data-id]')].map(r => [
      r.dataset.id,
      r.dataset.change,
    ]);

  it('shows only what the moment’s action changed, or the store it left', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    // live: the whole store, nothing marked
    expect(screen.queryByRole('group', { name: 'At this moment' })).toBeNull();
    expect(tableRows()).toContainEqual([entityId('Post', '2'), undefined]);
    previous();
    // the set: just the row it updated, marked so; no endpoints section
    const diff = screen.getByRole('button', { name: 'Diff' });
    expect(diff.getAttribute('aria-pressed')).toBe('true');
    expect(tableRows()).toEqual([[entityId('Post', '1'), 'updated']]);
    expect(top().textContent).not.toContain('Endpoints');
    // the response: what it added, endpoint and entities alike
    previous();
    expect(tableRows()).toEqual(
      expect.arrayContaining([
        [endpointId(POSTS), 'added'],
        [entityId('Post', '1'), 'added'],
        [entityId('Post', '2'), 'added'],
      ]),
    );
    // after it: the whole store it left, unmarked
    showAfter();
    expect(diff.getAttribute('aria-pressed')).toBe('false');
    expect(top().textContent).toContain('"One"');
    expect(tableRows().every(([, change]) => change === undefined)).toBe(true);
    // which stays the choice as the moment moves
    fireEvent.click(screen.getByRole('button', { name: 'Next change' }));
    expect(top().textContent).toContain('"Edited"');
    expect(tableRows()).toContainEqual([entityId('Post', '2'), undefined]);
  });

  it('says what the action did to a record, or that it left it alone', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    openPost('1');
    previous();
    expect(top().textContent).toMatch(/title: "One" → "Edited"/);
    // a record the moment's action left alone, opened from the store it
    // left
    backTo('State');
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Other' }));
    previous();
    showAfter();
    openPost('1');
    fireEvent.click(screen.getByRole('button', { name: 'Diff' }));
    expect(top().textContent).toContain('No change to this record');
  });

  it('marks a row the action removed, as it was', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(async () => {
      ctrl().dispatch({
        type: actionTypes.GC,
        entities: [{ key: 'Post', pk: '2' }],
        endpoints: [],
      });
    });
    previous();
    expect(tableRows()).toEqual([[entityId('Post', '2'), 'removed']]);
    expect(top().textContent).toContain('"Two"');
  });
});

describe('Store action level', () => {
  it('goes with its store: a reset leaves none of its actions showing', async () => {
    const { ctrl, show } = mount();
    await act(() => ctrl().fetch(getPosts));
    openPane();
    fireEvent.click(rows()[0]);
    expect(crumbs()).toEqual(['Actions', 'setResponse GET /posts']);
    // the new store's actions are listed instead
    await act(async () => show(1));
    expect(crumbs()).toEqual(['Actions']);
    expect(top().textContent).not.toContain('No longer in the log');
  });
});

describe('Store Actions pane on a record', () => {
  afterEach(() => jest.useRealTimers());

  it('lists the actions that touched the record, with what each did', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    // stored again unchanged, twice in a row
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    openPost('1');
    openPane();
    expect(crumbs()).toEqual(['Actions of Post 1']);
    expect(listCount()).toBe('4');
    expect(rows()).toHaveLength(4);
    expect(rows()[1].textContent).toContain('stored again, unchanged');
    expect(rows()[2].textContent).toContain('stored again, unchanged');
    expect(rows()[3].textContent).toContain('set');
    // a row opens its action over the record, as the moment: State shows
    // the record as it was then
    fireEvent.click(rows()[0]);
    expect(crumbs()).toEqual(['Actions of Post 1', 'setResponse GET /posts']);
    openState();
    expect(current()).toBe('Post 1');
    expect(top().textContent).toContain('"One"');
    openPane();
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    // what the action did to the record
    fireEvent.click(rows()[3]);
    expect(top().textContent).toMatch(/title: "One" → "Edited"/);
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    // an action that left the record alone is not listed
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Other' }));
    expect(rows()).toHaveLength(4);
    // the store lists every action
    toRoot();
    openPane();
    expect(listCount()).toBe('5');
    expect(rows()).toHaveLength(5);
  });

  it('renders a row again only as its own group changes', async () => {
    const { ctrl, log } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    openPost('1');
    openPane();
    expect(rows()).toHaveLength(2);
    // every row works out its chips as it renders
    const renders = jest.spyOn(log, 'mergedChanges');
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Other' }));
    expect(rows()).toHaveLength(2);
    expect(renders).not.toHaveBeenCalled();
    await act(() => ctrl().set(Post, { id: '1' }, { id: '1', title: 'Again' }));
    expect(rows()).toHaveLength(3);
    expect(renders).toHaveBeenCalledTimes(1);
    // at the store too, where every action is listed
    toRoot();
    openPane();
    renders.mockClear();
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'More' }));
    expect(rows()).toHaveLength(5);
    expect(renders).toHaveBeenCalledTimes(1);
    renders.mockRestore();
  });

  it('says where actions the log dropped changed a record', async () => {
    const { ctrl } = mount();
    await act(async () => {
      await ctrl().set(Post, { id: '1' }, { id: '1', title: 'one' });
      // past updateLimit: the oldest sets of Post drop off
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '2' }, { id: '2', title: `t${i}` });
    });
    openPost('2');
    openPane();
    expect(pane().textContent).toContain('Changed by actions not kept');
    toRoot();
    // Post 1's own set is still there
    openPost('1');
    openPane();
    expect(pane().textContent).not.toContain('not kept');
  });

  it.each([
    ['changed', (n: number) => `poll ${n}`, 'Changed'],
    ['stored again', () => 'One', 'Stored again'],
  ])('says where polls the log dropped %s a record', async (_, title, says) => {
    const { ctrl } = mount();
    let n = 0;
    const polled = new Endpoint(async () => [{ id: '1', title: title(n++) }], {
      schema: [Post],
      key: () => POSTS,
      name: 'polled',
      pollFrequency: 1e6,
    });
    await act(async () => {
      await ctrl().fetch(getPosts);
      await ctrl().subscribe(polled);
      for (let i = 0; i < 25; i++) await ctrl().fetch(polled);
      await ctrl().unsubscribe(polled);
    });
    openPost('1');
    openPane();
    expect(pane().textContent).toContain(`${says} by actions not kept`);
  });

  it('marks the gap while the record’s value came from actions the log dropped', async () => {
    const { ctrl } = mount();
    await act(async () => {
      await ctrl().fetch(getPosts);
      await ctrl().set(Post, { id: '1' }, { id: '1', title: 'last' });
      // past updateLimit: Post 1's set drops with the oldest sets of Post
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '2' }, { id: '2', title: `t${i}` });
    });
    openPost('1');
    // beside the record, which says what changed it
    peekIn();
    const gap = () =>
      within(pane()).getByText(
        'Changed by actions not kept: the log keeps the newest',
      ).parentElement!;
    // the gap comes after the kept change, noted on the row of the action
    // it was found at, which is listed though it left the record alone
    expect(rows()).toHaveLength(2);
    expect(gap().parentElement).toBe(rows()[1].parentElement);
    expect(gap().nextElementSibling).toBe(rows()[1]);
    expect(rows()[1].textContent).toContain('Post');
    expect(rows()[1].textContent).not.toContain('Post 1');
    expect(gap().hasAttribute('aria-current')).toBe(false);
    // live, no kept action made the value shown, nor is a row marked
    const changedBy = () =>
      within(top()).getByText('changed by').parentElement!.textContent;
    expect(changedBy()).toContain('actions not kept');
    expect(changedBy()).not.toContain('setResponse');
    expect(marked()).toEqual([]);
    // a moment after the dropped actions, on an action the list leaves
    // out: the record's value then isn't known to a kept action either
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    previous();
    showAfter();
    openPost('1');
    expect(marked()).toEqual([]);
    expect(changedBy()).toContain('actions not kept');
    expect(changedBy()).not.toContain('setResponse');
    // the steps stop at the gap's row (its mark not dimmed), then at the
    // kept change before it
    previous();
    expect(gap().hasAttribute('aria-current')).toBe(false);
    expect(rows()[1].getAttribute('aria-current')).toBe('true');
    expect(
      scrubber().querySelector('[data-selected]')!.hasAttribute('data-dim'),
    ).toBe(false);
    expect(rows()[0].hasAttribute('aria-current')).toBe(false);
    expect(changedBy()).toContain('actions not kept');
    // its action says a gap of dropped actions was found at it
    fireEvent.click(screen.getByTitle('Show action'));
    expect(top().textContent).toContain(
      'Before it: Changed by actions not kept',
    );
    expect(top().textContent).not.toContain('No change to this record');
    openState();
    peekIn();
    previous();
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(changedBy()).toContain('setResponse');
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(marked()).toEqual([]);
    expect(changedBy()).toContain('actions not kept');
  });

  it('marks only the response of a request a gap was found at', async () => {
    const { ctrl } = mount();
    let n = 0;
    const polled = new Endpoint(
      async () => [{ id: '1', title: `poll ${n++}` }],
      {
        schema: [Post],
        key: () => POSTS,
        name: 'polled',
        pollFrequency: 1e6,
      },
    );
    await act(async () => {
      await ctrl().fetch(getPosts);
      await ctrl().subscribe(polled);
      // past updateLimit: the oldest polls drop off
      for (let i = 0; i < 25; i++) await ctrl().fetch(polled);
      await ctrl().unsubscribe(polled);
    });
    openPost('1');
    openPane();
    fireEvent.click(expander(rows()[1]));
    const note = () =>
      within(pane()).getByText(/^Changed by actions not kept/).parentElement!;
    expect(note().hasAttribute('aria-current')).toBe(false);
    // the gap is found at the first kept poll's response: the step after the
    // note, which alone is current once picked
    const step = note().nextElementSibling as HTMLElement;
    expect(step.textContent).toContain('setResponse');
    const { seq } = step.dataset;
    fireEvent.click(step);
    expect(top().textContent).toContain('title:');
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    expect(
      [
        ...pane().querySelectorAll<HTMLElement>(
          '[data-seq][aria-current="true"]',
        ),
      ].map(el => el.dataset.seq),
    ).toEqual([rows()[1].dataset.seq, seq]);
    expect(note().hasAttribute('aria-current')).toBe(false);
  });

  it('notes the polls the log dropped once, before the first kept one', async () => {
    const { ctrl } = mount();
    let n = 0;
    const polled = new Endpoint(
      async () => [{ id: '1', title: `poll ${n++}` }],
      {
        schema: [Post],
        key: () => POSTS,
        name: 'polled',
        pollFrequency: 1e6,
      },
    );
    await act(async () => {
      await ctrl().fetch(getPosts);
      await ctrl().subscribe(polled);
      for (let i = 0; i < 40; i++) await ctrl().fetch(polled);
      await ctrl().unsubscribe(polled);
    });
    openPost('1');
    openPane();
    const notes = () =>
      within(pane()).queryAllByText(/by actions not kept/).length;
    // closed, the row carries one note; open, one before its first kept
    // poll, not one per kept poll
    expect(rows()).toHaveLength(2);
    expect(notes()).toBe(1);
    expect(rows()[1].textContent).toContain('earlier polls not kept');
    fireEvent.click(expander(rows()[1]));
    expect(pane().querySelectorAll('[data-seq]').length).toBeGreaterThan(5);
    expect(notes()).toBe(1);
    expect(
      within(pane()).queryAllByText(/earlier polls not kept/),
    ).toHaveLength(1);
  });

  it('lists a record whose only changes the log dropped', async () => {
    const { ctrl } = mount();
    const polled = new Endpoint(async () => [{ id: '1', title: 'One' }], {
      schema: [Post],
      key: () => POSTS,
      name: 'polled',
      pollFrequency: 1e6,
    });
    await act(async () => {
      // the store's first action stays: a gap before the polls can show
      await ctrl().set(Post, { id: '2' }, { id: '2', title: 'Two' });
      await ctrl().subscribe(polled);
      // past updateLimit: the poll that added the record drops off, and
      // every kept one stored it again unchanged
      for (let i = 0; i < 25; i++) await ctrl().fetch(polled);
      await ctrl().unsubscribe(polled);
    });
    fireEvent.click(
      top().querySelector<HTMLElement>(`tr[data-id="${endpointId(POSTS)}"]`)!,
    );
    peekIn();
    expect(pane().textContent).toContain('Changed by actions not kept');
    expect(pane().textContent).toContain('stored again, unchanged');
    // with no kept change to name
    expect(
      within(top()).getByText('changed by').parentElement!.textContent,
    ).toContain('actions not kept');
    // in the tree view too, where the pane lists the store's actions
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByLabelText('Tree view'));
    fireEvent.click(
      [...document.querySelectorAll<HTMLElement>('[data-id]')].find(
        el => el.dataset.id === endpointId(POSTS),
      )!,
    );
    expect(
      within(top()).getByText('changed by').parentElement!.textContent,
    ).toContain('actions not kept');
    expect(paneHead()).toBe('Actions' + '2');
    expect(pane().textContent).not.toContain('by actions not kept');
  });

  it('marks the moment’s row, which the steps follow among the record’s actions', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Other' }));
    // between Post 1's changes: the earlier one is the moment's
    previous();
    previous();
    previous();
    openPost('1');
    openPane();
    const marked = () => rows().map(r => r.getAttribute('aria-current'));
    expect(marked()).toEqual(['true', null]);
    // picking a row moves the moment there, for the whole panel
    fireEvent.click(rows()[1]);
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    expect(marked()).toEqual([null, 'true']);
    expect(scrubber().textContent).toContain('set');
    expect(scrubber().textContent).toContain('Post');
    expect(scrubber().textContent).not.toContain('setResponse');
    // the steps move between the record's changes, past the newest to live
    previous();
    expect(marked()).toEqual(['true', null]);
    const next = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Next change' }));
    next();
    expect(marked()).toEqual([null, 'true']);
    next();
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(marked()).toEqual([null, null]);
    // at the store, every change is a step
    toRoot();
    openPane();
    previous();
    expect(marked()).toEqual([null, null, 'true']);
  });

  it('names what changed a row expanded in place in a list', async () => {
    class Article extends Entity {
      id = '';
      title = '';
      body = '';
      summary = '';
      notes = '';
    }
    const { ctrl } = mount();
    await act(() =>
      ctrl().set(
        Article,
        { id: '1' },
        {
          id: '1',
          title: 'An article title that is long enough to take its column',
          body: 'A body that wants plenty of room in its column',
          summary: 'Another long string field to push columns onto pages',
          notes: 'Notes about the article, long as well',
        },
      ),
    );
    // the fields that didn't fit show below the row, with its meta
    fireEvent.click(
      within(top()).getAllByLabelText(/Show \d+ more fields below/)[0],
    );
    expect(top().textContent).toContain('changed by');
    expect(within(top()).getByRole('button', { name: /^set/ })).toBeTruthy();
  });

  it('keeps a snapshot, and steps from it, once its action drops off', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    previous();
    previous();
    showAfter();
    act(() => {
      for (let i = 0; i < 510; i++) ctrl().dispatch(unsubscribe() as any);
    });
    await act(() => ctrl().fetch(getPosts));
    const bar = scrubber();
    expect(bar.textContent).toContain('setResponse');
    const next = within(bar).getByRole('button', { name: 'Next change' });
    expect((next as HTMLButtonElement).disabled).toBe(false);
    // its records still say what changed them
    fireEvent.click(
      top().querySelector<HTMLElement>(
        `tr[data-id="${entityId('Post', '1')}"]`,
      )!,
    );
    expect(top().textContent).toContain('changed by');
    // to the refetch, which left the log too, then to one still in it
    const previousButton = () =>
      within(bar).getByRole('button', {
        name: 'Previous change',
      }) as HTMLButtonElement;
    fireEvent.click(next);
    expect(screen.getByRole('button', { name: 'Live' })).toBeTruthy();
    expect(previousButton().disabled).toBe(false);
    fireEvent.click(next);
    expect(previousButton().disabled).toBe(false);
    fireEvent.click(previousButton());
    expect(screen.getByRole('button', { name: 'Live' })).toBeTruthy();
    expect(bar.textContent).toContain('setResponse');
  });
});

describe('storeAt', () => {
  const store = { before: initialState, after: initialState };
  const entries: LogEntry[] = [
    { seq: 1, at: 0, action: subscribe() as any, newStore: true },
    { seq: 2, at: 1, action: unsubscribe() as any, store },
    { seq: 3, at: 2, action: subscribe() as any, newStore: true },
    { seq: 4, at: 3, action: subscribe() as any },
    { seq: 5, at: 4, action: unsubscribe() as any, store },
  ];
  it('shows an action the store never saw as the last one of its store did', () => {
    expect(storeAt(entries, entries[4])).toEqual({ seq: 5 });
    // not the store before it: as its own store's first found it
    expect(storeAt(entries, entries[3])).toEqual({ seq: 5, before: true });
    expect(storeAt(entries, entries[2])).toEqual({ seq: 5, before: true });
    expect(storeAt(entries, entries[0])).toEqual({ seq: 2, before: true });
    // a store that started without dispatching
    const quiet = entries.filter(e => e.seq !== 3);
    expect(storeAt(quiet, entries[3], 3)).toEqual({ seq: 5, before: true });
    expect(storeAt(quiet, entries[3])).toEqual({ seq: 2 });
    // nor the store after it, when its own never stored anything
    const unseen = entries.filter(e => e.seq !== 2);
    expect(storeAt(unseen, entries[0])).toBeUndefined();
    expect(storeAt(unseen, entries[0], 3)).toBeUndefined();
  });
});

describe('groupEntries', () => {
  const entry = (seq: number, action: any): LogEntry => ({
    seq,
    action,
    at: seq,
  });
  const poll = { key: 'GET /price', endpoint: { pollFrequency: 5000 } };

  it('joins a read to the request NetworkManager still holds', () => {
    const read = { key: 'GET /a', endpoint: {} };
    const fetch = (seq: number, deduped: boolean) => ({
      ...entry(seq, {
        type: actionTypes.FETCH,
        ...read,
        meta: { fetchedAt: seq },
      }),
      deduped,
    });
    const groups = groupEntries([
      fetch(1, false),
      entry(2, {
        type: actionTypes.SET_RESPONSE,
        ...read,
        meta: { fetchedAt: 1 },
      }),
      // an effect reacting to the response, before the store commits it
      fetch(3, true),
      // a read chained on the first one's promise: a new request
      fetch(4, false),
    ]);
    expect(groups.map(g => g.entries.map(e => e.seq))).toEqual([
      [1, 2, 3],
      [4],
    ]);
  });

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
  /** A log that compacts on every action, unless a test is about batching */
  const newLog = (options?: LogOptions) =>
    new ActionLog({ trimEvery: 1, ...options });
  const empty: State<unknown> = {
    ...initialState,
    entities: { Post: { 1: { id: '1' }, 2: { id: '2' } } },
    endpoints: { a: '1' },
  };
  /** A store whose actions go to `history` */
  const connect = (
    log: ActionLog,
    history: number,
    {
      keep,
      state = empty,
      skipLogging,
    }: {
      keep?: number;
      state?: State<unknown>;
      skipLogging?: (action: ActionTypes) => boolean;
    } = {},
  ) => {
    const { head, tail } = log.connect(history, keep, skipLogging);
    const store = { getState: () => state } as any;
    return head.middleware!(store)(
      tail.middleware!(store)(() => Promise.resolve()),
    ) as (action: any) => Promise<void>;
  };

  it('collects garbage without touching earlier states', () => {
    const log = newLog();
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

  it('keeps what the store collects in place', () => {
    const log = newLog();
    const state = {
      ...initialState,
      entities: { Post: { 1: { id: '1' } } },
    } as State<unknown>;
    const store = { getState: () => state } as any;
    const reduce = createReducer(new Controller());
    const { head, tail } = log.connect(0);
    head.middleware!(store)(
      tail.middleware!(store)((action: ActionTypes) => {
        reduce(state, action);
        return Promise.resolve();
      }),
    )({
      type: actionTypes.GC,
      entities: [{ key: 'Post', pk: '1' }],
      endpoints: [],
    });
    expect(state.entities.Post).not.toHaveProperty('1');
    const [gc] = log.history(0).entries;
    expect(gc.store?.before.entities.Post).toHaveProperty('1');
    expect(log.changes(gc).map(c => c.kind)).toEqual(['removed']);
  });

  it('keeps each store’s history, which a restored store continues', () => {
    const log = newLog();
    const first = connect(log, 0);
    first(subscribe());
    first(subscribe());
    // an automatic retry with a fresh store, keeping the first's history
    const retry = connect(log, 1, { keep: 0 });
    retry(subscribe());
    // the replaced store unmounting
    first(unsubscribe('k'));
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

  it('starts a restored store that dispatches nothing', () => {
    const log = newLog();
    connect(
      log,
      0,
    )({
      type: actionTypes.FETCH,
      key: 'k',
      endpoint: {},
      meta: { fetchedAt: 1 },
    });
    // error recovery gives the store back, its pending updates cleared
    const restored = { ...initialState, optimistic: [] };
    log.connect(0).head.init!(restored);
    const history = log.history(0);
    expect(history.state).toEqual(restored);
    const [request] = groupEntries(history.entries, history.storeFrom);
    expect(request).toMatchObject({ kind: 'request', cancelled: true });
  });

  it('starts a restored store whose first reads the network holds', () => {
    const log = newLog();
    connect(log, 0, { keep: 0 })(subscribe());
    // the restored store reads while it renders, before its managers start;
    // NetworkManager keeps the fetch from the store
    const { head } = log.connect(0);
    head.middleware!({} as any)(() => Promise.resolve())({
      type: actionTypes.FETCH,
      key: 'k',
      endpoint: {},
      meta: { fetchedAt: 1 },
    });
    const restored = { ...initialState, optimistic: [] };
    head.init!(restored);
    expect(log.history(0).state).toEqual(restored);
    expect(log.history(0).storeFrom).toBeUndefined();
  });

  it('follows each store’s own state', () => {
    const log = newLog();
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

  it('shows a fetch with the store change after it', async () => {
    const log = newLog();
    const heard = jest.fn();
    log.subscribe(heard);
    const store = { getState: () => empty } as any;
    // what managers stop before the store: a read, a subscribe
    const dispatch = log.connect(0).head.middleware!(store)(() =>
      Promise.resolve(),
    ) as (action: any) => Promise<void>;
    dispatch({ type: actionTypes.FETCH, key: 'k', endpoint: {}, meta: {} });
    await Promise.resolve();
    // components fetch while they render: rendering the panel would retry
    // a suspended one, which would fetch again
    expect(heard).not.toHaveBeenCalled();
    expect(log.history(0).entries).toHaveLength(1);
    dispatch(subscribe());
    await Promise.resolve();
    expect(heard).toHaveBeenCalledTimes(1);
    // a mutation never comes from a render, so it shows while in flight
    dispatch({
      type: actionTypes.FETCH,
      key: 'm',
      endpoint: { sideEffect: true },
      meta: {},
    });
    await Promise.resolve();
    expect(heard).toHaveBeenCalledTimes(2);
  });

  it('keeps only the newest actions', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    for (let i = 0; i < 255; i++) {
      dispatch(subscribe());
      dispatch(unsubscribe('k'));
    }
    const { entries } = log.history(0);
    expect(entries).toHaveLength(500);
    expect(entries[0].seq).toBe(11);
  });

  it('keeps a request’s fetch past a reset and a shared fetch time', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    const fetch = (key: string) =>
      dispatch({
        type: actionTypes.FETCH,
        key,
        endpoint: { sideEffect: true },
        meta: { fetchedAt: 1 },
      });
    const respond = (key: string) =>
      dispatch({
        type: actionTypes.SET_RESPONSE,
        key,
        response: 1,
        meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
        endpoint: { schema: undefined },
      });
    // two mutations sharing a fetch time; one answered right away
    fetch('m');
    fetch('m');
    respond('m');
    fetch('k');
    for (let i = 0; i < 500; i++) dispatch(unsubscribe());
    respond('k');
    const fetches = () =>
      log
        .history(0)
        .entries.flatMap(({ action }) =>
          action.type === actionTypes.FETCH ? [action.key] : [],
        );
    expect(fetches()).toEqual(['m', 'k']);
    // cancels only what is still in flight
    dispatch({ type: actionTypes.RESET, date: 2 });
    expect(fetches()).toEqual(['k']);
  });

  it('keeps the fetch still waiting when mutations share a fetch time', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    const meta = { fetchedAt: 1, date: 1, expiresAt: 2 };
    const fetch = (id: number) =>
      dispatch({
        type: actionTypes.FETCH,
        key: 'm',
        args: [{ id }],
        endpoint: { sideEffect: true },
        meta,
      });
    fetch(1);
    fetch(2);
    // the second resolves first
    dispatch({
      type: actionTypes.SET_RESPONSE,
      key: 'm',
      args: [{ id: 2 }],
      response: 2,
      meta,
      endpoint: { schema: undefined },
    });
    for (let i = 0; i < 500; i++) dispatch(unsubscribe());
    const { entries } = log.history(0);
    expect(entries).toHaveLength(501);
    expect(entries[0].action).toMatchObject({ args: [{ id: 1 }] });
  });

  it('keeps the response of a request a kept fetch joined', () => {
    const log = newLog();
    const { head, tail } = log.connect(
      0,
      undefined,
      action =>
        action.type === actionTypes.FETCH && action.meta.fetchedAt === 2,
    );
    const store = { getState: () => empty } as any;
    const dispatch = head.middleware!(store)(
      tail.middleware!(store)(() => Promise.resolve()),
    ) as (action: any) => Promise<void>;
    const fetch = (fetchedAt: number) =>
      dispatch({
        type: actionTypes.FETCH,
        key: 'k',
        endpoint: {},
        meta: { fetchedAt },
      });
    fetch(1);
    dispatch({
      type: actionTypes.SET_RESPONSE,
      key: 'k',
      response: 1,
      meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
      endpoint: { schema: undefined },
    });
    // joins while the store commits the response
    fetch(2);
    for (let i = 0; i < 499; i++) dispatch(unsubscribe());
    const [request] = groupEntries(log.history(0).entries);
    expect(request).toMatchObject({
      kind: 'request',
      response: expect.anything(),
    });
    expect(request.entries).toHaveLength(3);
  });

  it('keeps a subscription that ended before a poll it started resolved', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    dispatch(subscribe());
    dispatch({
      type: actionTypes.FETCH,
      key: 'k',
      endpoint: {},
      meta: { fetchedAt: 1 },
    });
    dispatch(unsubscribe('k'));
    for (let i = 0; i < 498; i++) dispatch(unsubscribe());
    dispatch({
      type: actionTypes.SET_RESPONSE,
      key: 'k',
      response: 1,
      meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
      endpoint: { schema: undefined },
    });
    for (let i = 0; i < 3; i++) dispatch(unsubscribe());
    const [sub] = groupEntries(log.history(0).entries);
    expect(sub).toMatchObject({ kind: 'subscription', key: 'k', open: 0 });
    expect((sub as any).requests[0].response).toBeTruthy();
  });

  it('keeps the subscribers that held a subscription open over its polls', () => {
    const log = newLog();
    // each poll its own fetch
    const dispatch = connect(log, 0, { skipLogging: () => false });
    const poll = (fetchedAt: number) =>
      dispatch({
        type: actionTypes.FETCH,
        key: 'k',
        endpoint: {},
        meta: { fetchedAt },
      });
    dispatch(subscribe());
    poll(1);
    dispatch(subscribe());
    // the first subscriber leaves before the second poll
    dispatch(unsubscribe('k'));
    poll(2);
    dispatch(unsubscribe('k'));
    for (let i = 0; i < 500; i++) dispatch(unsubscribe());
    const [sub] = groupEntries(log.history(0).entries);
    expect(sub).toMatchObject({ kind: 'subscription', key: 'k', open: 0 });
    expect((sub as any).requests).toHaveLength(2);
  });

  it('keeps a subscription’s newest polls', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    dispatch(subscribe());
    for (let fetchedAt = 1; fetchedAt <= 25; fetchedAt++) {
      dispatch({
        type: actionTypes.FETCH,
        key: 'k',
        endpoint: {},
        meta: { fetchedAt },
      });
      dispatch({
        type: actionTypes.SET_RESPONSE,
        key: 'k',
        response: fetchedAt,
        meta: { fetchedAt, date: fetchedAt, expiresAt: fetchedAt + 1 },
        endpoint: { schema: undefined },
      });
    }
    const [sub] = groupEntries(log.history(0).entries);
    expect(sub).toMatchObject({ kind: 'subscription', open: 1 });
    const { requests } = sub as any;
    expect(requests).toHaveLength(20);
    expect(requests[0].response.action.response).toBe(6);
    // and the oldest kept says how many came before it
    expect(log.history(0).dropped?.get(requests[0].entries[0].seq)).toBe(5);
  });

  it('keeps a poll still waiting for its response past updateLimit', () => {
    const log = newLog({ updateLimit: 2 });
    const dispatch = connect(log, 0, { skipLogging: () => false });
    const fetch = (fetchedAt: number) =>
      dispatch({
        type: actionTypes.FETCH,
        key: 'k',
        endpoint: {},
        meta: { fetchedAt },
      });
    dispatch(subscribe());
    fetch(0);
    for (let fetchedAt = 1; fetchedAt <= 3; fetchedAt++) {
      fetch(fetchedAt);
      dispatch({
        type: actionTypes.SET_RESPONSE,
        key: 'k',
        response: fetchedAt,
        meta: { fetchedAt, date: fetchedAt, expiresAt: fetchedAt + 1 },
        endpoint: { schema: undefined },
      });
    }
    const fetched = log
      .history(0)
      .entries.flatMap(({ action }) =>
        action.type === actionTypes.FETCH ? [action.meta.fetchedAt] : [],
      );
    expect(fetched).toEqual([0, 2, 3]);
  });

  it('keeps at least one update of a row, whatever updateLimit says', () => {
    const log = newLog({ updateLimit: 0 });
    const dispatch = connect(log, 0);
    for (let response = 1; response <= 3; response++)
      dispatch({
        type: actionTypes.SET_RESPONSE,
        key: 'k',
        response,
        meta: { fetchedAt: response, date: response, expiresAt: response + 1 },
        endpoint: { schema: undefined },
      });
    // the first stays as the store it started from
    const { entries, dropped } = log.history(0);
    expect(entries.map(e => e.seq)).toEqual([1, 3]);
    expect(dropped?.get(3)).toBe(1);
  });

  it('finds no gap where a restored store starts from its own copy of the state', () => {
    const log = newLog();
    let at = 0;
    const set = (dispatch: (action: any) => unknown, title: string) =>
      dispatch({
        type: actionTypes.SET,
        schema: Post,
        args: [],
        value: { id: '3', title },
        meta: { fetchedAt: ++at, date: at, expiresAt: at + 1 },
      });
    set(connect(log, 0), 'a');
    // the store's own state: equal, but not the log's objects
    const restored = structuredClone(log.history(0).state!);
    set(connect(log, 0, { state: restored }), 'b');
    const items = rowTimeline(
      log,
      log.history(0).entries,
      entityId('Post', '3'),
    );
    expect(items.map(i => i.kind)).toEqual(['version', 'version']);
  });

  it('notes each stretch the log dropped on its own', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    let at = 0;
    const set = (id: string, title: string) =>
      dispatch({
        type: actionTypes.SET,
        schema: Post,
        args: [],
        value: { id, title },
        meta: { fetchedAt: ++at, date: at, expiresAt: at + 1 },
      });
    set('3', 'a');
    set('3', 'b');
    set('4', 'x');
    set('3', 'c');
    set('3', 'd');
    // drop the sets of 'b' and 'c', with a set of another record between them
    const kept = log
      .history(0)
      .entries.filter(
        ({ action }) => !['b', 'c'].includes((action as any).value?.title),
      );
    const items = rowTimeline(log, kept, entityId('Post', '3'));
    const seqOf = (title: string) =>
      log
        .history(0)
        .entries.find(e => (e.action as any).value?.title === title)!.seq;
    expect(items).toMatchObject([
      { kind: 'version' },
      { kind: 'missing', change: 'updated', seq: seqOf('x') },
      { kind: 'missing', change: 'updated', seq: seqOf('d') },
      { kind: 'version' },
    ]);
  });

  it('builds a row’s timeline once, reading only the actions appended since', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    let at = 0;
    const set = (id: string, title: string) =>
      dispatch({
        type: actionTypes.SET,
        schema: Post,
        args: [],
        value: { id, title },
        meta: { fetchedAt: ++at, date: at, expiresAt: at + 1 },
      });
    const id = entityId('Post', '3');
    const timeline = () => rowTimeline(log, log.history(0).entries, id);
    set('3', 'a');
    set('3', 'b');
    const first = timeline();
    expect(first.map(i => i.kind)).toEqual(['version', 'version']);
    expect(timeline()).toBe(first);
    // the next action is the only one read
    const reads = jest.spyOn(log, 'changes');
    set('3', 'c');
    const next = timeline();
    expect(next.map(i => i.kind)).toEqual(['version', 'version', 'version']);
    expect(reads).toHaveBeenCalledTimes(1);
    // continued, it is what a build from scratch makes: each kept set, as
    // the store saw it
    expect(next.map(i => i.kind === 'version' && i.entry.seq)).toEqual(
      log
        .history(0)
        .entries.filter(e => e.store)
        .map(e => e.seq),
    );
    expect(next.map(i => i.kind === 'version' && i.change.kind)).toEqual([
      'added',
      'updated',
      'updated',
    ]);
    expect(timeline()).toBe(next);
    // the log trimmed at the front starts over (what the cut hid is a gap)
    reads.mockClear();
    const kept = log.history(0).entries.slice(1);
    expect(rowTimeline(log, kept, id).map(i => i.kind)).toEqual([
      'missing',
      'version',
      'version',
    ]);
    expect(reads).toHaveBeenCalledTimes(2);
    reads.mockRestore();
  });

  it('keeps the dropped counts as they are while nothing more drops', () => {
    const log = newLog({ updateLimit: 2 });
    const dispatch = connect(log, 0);
    let at = 0;
    class Draft extends Post {}
    const set = (id: string, title: string, schema = Post) =>
      dispatch({
        type: actionTypes.SET,
        schema,
        args: [],
        value: { id, title },
        meta: { fetchedAt: ++at, date: at, expiresAt: at + 1 },
      });
    // the store's first action stays; of the rest, the newest two
    set('3', 'a');
    set('3', 'b');
    set('3', 'c');
    set('3', 'd');
    const { dropped } = log.history(0);
    expect([...dropped!.values()]).toEqual([1]);
    // another entity's set has a row of its own: nothing more drops
    set('4', 'x', Draft);
    expect(log.history(0).dropped).toBe(dropped);
    set('3', 'e');
    expect(log.history(0).dropped).not.toBe(dropped);
    expect([...log.history(0).dropped!.values()]).toEqual([2]);
  });

  it('keeps as many pushed sets of each entity as updateLimit says', () => {
    const log = newLog({ updateLimit: 2 });
    const dispatch = connect(log, 0);
    dispatch(unsubscribe());
    const set = (schema: typeof Post, id: string, title: string) =>
      dispatch({
        type: actionTypes.SET,
        schema,
        args: [],
        value: { id, title },
        meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
      });
    class Draft extends Post {}
    set(Post, '1', 'a');
    set(Draft, '1', 'x');
    set(Post, '1', 'b');
    set(Post, '1', 'c');
    const titles = log
      .history(0)
      .entries.flatMap(({ action }) =>
        action.type === actionTypes.SET ? [(action.value as any).title] : [],
      );
    expect(titles).toEqual(['x', 'b', 'c']);
    const dropped = () =>
      log
        .history(0)
        .entries.filter(({ action }) => action.type === actionTypes.SET)
        .map(e => log.history(0).dropped?.get(e.seq));
    expect(dropped()).toEqual([undefined, 1, undefined]);
    // a dropped update's own count carries over
    set(Post, '1', 'd');
    expect(dropped()).toEqual([undefined, 2, undefined]);
  });

  it('trims in batches', () => {
    const log = new ActionLog();
    const dispatch = connect(log, 0);
    const other = () => dispatch(unsubscribe());
    for (let i = 0; i < 549; i++) other();
    expect(log.history(0).entries).toHaveLength(549);
    other();
    expect(log.history(0).entries).toHaveLength(500);
  });

  it('records once the Store panel listens, with recordFrom open', () => {
    const log = new ActionLog({ recordFrom: 'open' });
    const dispatch = connect(log, 0);
    dispatch(subscribe());
    expect(log.history(0).entries).toHaveLength(0);
    log.subscribe(() => {});
    dispatch({
      type: actionTypes.SET_RESPONSE,
      key: 'k',
      response: 1,
      meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
      endpoint: { schema: undefined },
    });
    const { entries } = log.history(0);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ newStore: true });
    expect(entries[0].store?.after.endpoints).toMatchObject({ k: 1 });
  });

  it('starts with what is pending when the Store panel opens, with recordFrom open', () => {
    const log = new ActionLog({ recordFrom: 'open' });
    const pending = {
      type: actionTypes.OPTIMISTIC,
      key: 'k',
      endpoint: { schema: undefined },
      meta: { fetchedAt: 1 },
    } as any;
    connect(log, 0, { state: { ...empty, optimistic: [pending] } });
    expect(log.history(0).state).toBeUndefined();
    log.subscribe(() => {});
    expect(log.history(0).state?.optimistic).toEqual([pending]);
    expect(log.history(0).entries).toHaveLength(0);
  });

  it('keeps the subscribers still polling past the limit', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    const poll = (type: string, pollFrequency: number) =>
      dispatch({ type, key: 'k', endpoint: { pollFrequency } });
    poll(actionTypes.SUBSCRIBE, 5000);
    poll(actionTypes.SUBSCRIBE, 1000);
    poll(actionTypes.UNSUBSCRIBE, 5000);
    for (let i = 0; i < 500; i++) dispatch(unsubscribe());
    const [first] = log.history(0).entries;
    expect(first.action).toMatchObject({
      type: actionTypes.SUBSCRIBE,
      endpoint: { pollFrequency: 1000 },
    });
    expect(log.history(0).entries).toHaveLength(501);
  });

  it('keeps a fetch whose response a restored store kept', () => {
    const log = newLog();
    const first = connect(log, 0);
    first({
      type: actionTypes.FETCH,
      key: 'k',
      endpoint: {},
      meta: { fetchedAt: 1 },
    });
    first({
      type: actionTypes.SET_RESPONSE,
      key: 'k',
      response: 1,
      meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
      endpoint: { schema: undefined },
    });
    const restored = connect(log, 0);
    for (let i = 0; i < 499; i++) restored(unsubscribe());
    const [request] = groupEntries(log.history(0).entries);
    expect(request).toMatchObject({ kind: 'request', key: 'k' });
    expect(request.entries).toHaveLength(2);
  });

  it('keeps the fetch of a response kept past the limit', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    dispatch({
      type: actionTypes.FETCH,
      key: 'k',
      endpoint: {},
      meta: { fetchedAt: 1 },
    });
    for (let i = 0; i < 500; i++) dispatch(unsubscribe());
    dispatch({
      type: actionTypes.SET_RESPONSE,
      key: 'k',
      response: 1,
      meta: { fetchedAt: 1, date: 1, expiresAt: 2 },
      endpoint: { schema: undefined },
    });
    const { entries } = log.history(0);
    expect(entries).toHaveLength(501);
    expect(entries[0].seq).toBe(1);
    expect(groupEntries(entries).find(g => g.kind === 'request')).toMatchObject(
      { response: entries[500] },
    );
  });

  it('keeps the subscribes of subscriptions still open past the limit', () => {
    const log = newLog();
    const dispatch = connect(log, 0);
    dispatch(subscribe());
    dispatch(subscribe());
    for (let i = 0; i < 500; i++) dispatch(unsubscribe());
    dispatch(unsubscribe('k'));
    const { entries } = log.history(0);
    // one dropped subscribe still pairs with the kept unsubscribe; the other
    // keeps the subscription open
    expect(entries.map(e => e.seq).slice(0, 2)).toEqual([1, 2]);
    expect(entries).toHaveLength(502);
    const sub = groupEntries(entries).find(
      g => g.kind === 'subscription' && g.key === 'k',
    );
    expect(sub).toMatchObject({ open: 1 });
  });
});

describe('mergeChanges', () => {
  const post = { id: '1', title: 'a' };
  const posts = (rows: Record<string, object>): State<unknown> => ({
    ...initialState,
    entities: { Post: rows },
  });
  const steps = (...states: State<unknown>[]) =>
    states.slice(1).map((after, i) => ({
      seq: i + 1,
      before: states[i],
      after,
      changes: diffStates(states[i], after),
    }));

  it('cancels a change a later action rolled back', () => {
    const before = posts({ 1: post });
    // a failed optimistic create, update and delete
    expect(mergeChanges(steps(posts({}), before, posts({})))).toEqual([]);
    expect(
      mergeChanges(
        steps(before, posts({ 1: { ...post, title: 'b' } }), before),
      ),
    ).toEqual([]);
    expect(mergeChanges(steps(before, posts({}), before))).toEqual([]);
  });

  it("leaves out another request's update in between", () => {
    const row = (title: string, count: number) =>
      posts({ 1: { ...post, title, count } });
    // ours sets title, another request sets count, then ours settles
    const [own, , failed] = steps(
      row('a', 0),
      row('b', 0),
      row('b', 1),
      row('a', 1),
    );
    expect(mergeChanges([own, failed])).toEqual([]);
    const [, , resolved] = steps(
      row('a', 0),
      row('b', 0),
      row('b', 1),
      row('c', 1),
    );
    expect(mergeChanges([own, resolved])).toMatchObject([
      { kind: 'updated', fields: ['title'] },
    ]);
  });

  it('keeps a row the group only refreshed as refreshed', () => {
    const stored = (value: number, date: number): State<unknown> => ({
      ...initialState,
      endpoints: { k: value },
      meta: { k: { date, fetchedAt: date, expiresAt: date + 10 } },
    });
    // polls in between another request's update
    const [poll, , again] = steps(
      stored(1, 1),
      stored(1, 2),
      stored(2, 2),
      stored(2, 3),
    );
    expect(mergeChanges([poll, again])).toMatchObject([{ kind: 'refreshed' }]);
    // and one it updated as updated
    const [, , update] = steps(
      stored(1, 1),
      stored(1, 2),
      stored(2, 2),
      stored(3, 3),
    );
    expect(mergeChanges([poll, update])).toMatchObject([{ kind: 'updated' }]);
    // a response that changes the endpoint, alone
    expect(mergeChanges(steps(stored(1, 1), stored(2, 2)))).toMatchObject([
      { kind: 'updated' },
    ]);
  });

  it('remembers which action removed a row', () => {
    expect(
      mergeChanges(
        steps(
          posts({ 1: post }),
          posts({ 1: { ...post, title: 'b' } }),
          posts({}),
        ),
      ),
    ).toEqual([
      {
        kind: 'removed',
        id: entityId('Post', '1'),
        table: 'Post',
        pk: '1',
        removedBy: 2,
      },
    ]);
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

  it('calls a row Invalidate adds invalidated', () => {
    const posts = (rows: Record<string, unknown>): State<unknown> => ({
      ...initialState,
      entities: { Post: rows },
    });
    expect(
      diffStates(posts({}), posts({ 1: Symbol('INVALID') })).map(c => c.kind),
    ).toEqual(['invalidated']);
  });

  it('tells a refetch, an expiry and a recovery apart', () => {
    expect(kinds({}, { date: 2, expiresAt: 20 })).toEqual(['refreshed']);
    // expireAll()
    expect(kinds({}, { expiresAt: 1 })).toEqual(['expired']);
    expect(kinds({ error: new Error('x') }, { date: 2 })).toEqual(['updated']);
    expect(kinds({ invalidated: true }, { date: 2 })).toEqual(['updated']);
  });

  it('ignores invalidating or expiring a row again', () => {
    expect(kinds({ invalidated: true }, { invalidated: true })).toEqual([]);
    expect(kinds({ expiresAt: 1 }, { expiresAt: 1 })).toEqual([]);
  });

  it('counts a refetched Blob or Map as a change', () => {
    const stored = (value: unknown, date: number): State<unknown> => ({
      ...state({ date }),
      endpoints: { a: value },
    });
    const refetch = (a: unknown, b: unknown) =>
      diffStates(stored(a, 1), stored(b, 2)).map(c => c.kind);
    // their contents aren't in their fields, so equal fields say nothing
    expect(refetch(new Map([[1, 1]]), new Map([[1, 2]]))).toEqual(['updated']);
    expect(refetch({ a: [1] }, { a: [1] })).toEqual(['refreshed']);
  });

  it('compares refetched dates by their time', () => {
    const stored = (value: unknown, date: number): State<unknown> => ({
      ...state({ date }),
      endpoints: { a: value },
    });
    const refetch = (a: unknown, b: unknown) =>
      diffStates(stored(a, 1), stored(b, 2)).map(c => c.kind);
    class Instant {
      readonly [Symbol.toStringTag] = 'Temporal.Instant';
      constructor(readonly at: string) {}
      toString() {
        return this.at;
      }
    }
    expect(refetch([new Date(5)], [new Date(5)])).toEqual(['refreshed']);
    expect(refetch([new Date(5)], [new Date(6)])).toEqual(['updated']);
    expect(refetch([new Instant('x')], [new Instant('x')])).toEqual([
      'refreshed',
    ]);
    expect(refetch([new Instant('x')], [new Instant('y')])).toEqual([
      'updated',
    ]);
  });
});
