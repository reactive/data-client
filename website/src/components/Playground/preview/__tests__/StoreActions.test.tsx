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
/** Toggles the Actions pane: the subject's actions, one row per request */
const openPane = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
const pane = () => screen.getByRole('region', { name: 'Actions' });
/** The pane's head: `Actions`, the subject below the store, and the count */
const paneHead = () => pane().firstElementChild!.textContent;
/** The pane's rows */
const rows = () => [
  ...document.querySelectorAll<HTMLElement>('[role="button"][aria-expanded]'),
];
/** What a row (or step) shows under itself: the moment's action's detail */
const under = (row: HTMLElement) => row.parentElement!.textContent!;
/** The pane's rows and steps marked as the moment's (not the "At this
 * moment" block over the list) */
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
  it('shows what the moment’s action did under its row, nothing while live', async () => {
    const { ctrl } = mount();
    openPane();
    expect(pane().textContent).toContain('Nothing dispatched yet');
    await act(() => ctrl().fetch(getPosts));
    expect(rows()).toHaveLength(1);
    expect(marked()).toEqual([]);
    expect(pane().textContent).not.toContain('dispatchedAt');
    // the moment's row opens, with what its action did and the action
    previous();
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(under(rows()[0])).toContain('dispatchedAt');
    expect(
      within(pane()).getByRole('button', { name: '+ Post 1' }),
    ).toBeTruthy();
    expect(
      within(pane()).getByRole('button', { name: '+ Post 2' }),
    ).toBeTruthy();
    // a step is a moment too: the store never saw the fetch
    const fetchStep = () =>
      within(rows()[0].parentElement!)
        .getByText('fetch')
        .closest<HTMLElement>('[role="button"]')!;
    fireEvent.click(fetchStep());
    expect(scrubber().textContent).toContain('fetch');
    expect(under(fetchStep())).toContain('Started the request');
    expect(pane().textContent).not.toContain('+ Post 1');
    // live again: no moment, no detail
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(marked()).toEqual([]);
    expect(pane().textContent).not.toContain('dispatchedAt');
  });

  it('scopes the changes to the subject', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    openPane();
    previous();
    // the store: every row the response added
    const chip = (name: string) =>
      within(pane()).queryAllByRole('button', { name })[0] ?? null;
    expect(chip('+ Post 1')).toBeTruthy();
    expect(chip('+ Post 2')).toBeTruthy();
    expect(chip('+ GET /posts')).toBeTruthy();
    // a record: just its own
    openPost('1');
    expect(current()).toBe('Post 1');
    expect(chip('+ Post 1')).toBeTruthy();
    expect(chip('+ Post 2')).toBeNull();
    expect(chip('+ GET /posts')).toBeNull();
    // the moment on an action that left the record alone: it shows on top
    // of a list that leaves it out, saying so
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Other' }));
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    previous();
    openPost('1');
    expect(rows()).toHaveLength(1);
    expect(marked()).toEqual([]);
    const pinned = () =>
      within(pane()).getByText('At this moment').parentElement!;
    expect(pinned().textContent).toContain('set');
    expect(pane().textContent).toContain('No change to this record');
    // a list of rows
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    fireEvent.click(
      within(rows()[0]).getByRole('button', { name: '+ 2 Post' }),
    );
    expect(current()).toBe('new Post2');
    expect(rows()).toHaveLength(2);
    expect(chip('~ Post 2')).toBeTruthy();
    previous();
    expect(chip('+ Post 1')).toBeTruthy();
    expect(chip('+ Post 2')).toBeTruthy();
    expect(chip('+ GET /posts')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    await act(() => ctrl().set(Post, { id: '3' }, { id: '3', title: 'Third' }));
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    previous();
    fireEvent.click(
      within(rows()[0]).getByRole('button', { name: '+ 2 Post' }),
    );
    expect(pane().textContent).toContain('No change to these rows');
  });

  it('shows the action from the scrubber’s label and a record’s last change, with focus on its row', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    // the label names the moment's action, and opens the pane on it
    previous();
    expect(scrubber().textContent).toContain('set');
    expect(screen.queryByRole('region', { name: 'Actions' })).toBeNull();
    fireEvent.click(screen.getByTitle('Show in Actions'));
    expect(rows()[1].getAttribute('aria-current')).toBe('true');
    expect(document.activeElement).toBe(rows()[1]);
    expect(under(rows()[1])).toMatch(/title: "One" → "Edited"/);
    // a record links to the action that last changed it, moving the moment
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    openPane();
    openPost('1');
    expect(top().textContent).toContain('changed by');
    const changedBy = within(top()).getByRole('button', { name: /^set Post/ });
    changedBy.focus();
    fireEvent.click(changedBy);
    expect(current()).toBe('Post 1');
    expect(scrubber().textContent).toContain('After');
    expect(rows()[1].getAttribute('aria-current')).toBe('true');
    expect(document.activeElement).toBe(rows()[1]);
    expect(under(rows()[1])).toMatch(/title: "One" → "Edited"/);
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
  });

  it('shows a removed record as the action found it', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    openPane();
    openPost('2');
    await act(async () => {
      ctrl().dispatch({
        type: actionTypes.GC,
        entities: [{ key: 'Post', pk: '2' }],
        endpoints: [],
      });
    });
    expect(rows()).toHaveLength(2);
    fireEvent.click(rows()[1]);
    expect(under(rows()[1])).toContain('Removed; it was:');
    expect(under(rows()[1])).toContain('"Two"');
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
    fireEvent.click(row);
    expect(
      screen.getByText('1 more fetch deduped into this request'),
    ).toBeTruthy();
    fireEvent.click(row);

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
    fireEvent.click(oldest);
    expect(
      screen.getByText('4 earlier sets not kept: the log keeps the newest'),
    ).toBeTruthy();
  });

  it('sets the moment from a row, showing what its action did under it', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    openPane();
    // a request's row stands for its response
    fireEvent.click(rows()[0]);
    expect(scrubber().textContent).toContain('After');
    expect(scrubber().textContent).toContain('setResponse');
    expect(rows()[0].getAttribute('aria-expanded')).toBe('true');
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(top().textContent).toContain('"One"');
    expect(under(rows()[0])).toContain('dispatchedAt');
    // its steps are moments too; the store never saw the fetch, so State
    // stays as it was before the response
    const fetchStep = () =>
      within(rows()[0].parentElement!)
        .getByText('fetch')
        .closest<HTMLElement>('[role="button"]')!;
    fireEvent.click(fetchStep());
    expect(scrubber().textContent).toContain('fetch');
    expect(top().textContent).not.toContain('"One"');
    expect(under(fetchStep())).toContain('Started the request');
    // another row; the steps follow the moment from there
    fireEvent.click(rows()[1]);
    expect(under(rows()[1])).toMatch(/title: "One" → "Edited"/);
    expect(rows()[1].getAttribute('aria-current')).toBe('true');
    previous();
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(under(rows()[0])).toContain('dispatchedAt');
    // a moment the store never saw stays, as the log grows
    fireEvent.click(fetchStep());
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Later' }));
    expect(under(fetchStep())).toContain('Started the request');
    expect(scrubber().textContent).toContain('fetch');
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
      fireEvent.click(rows()[0]);
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
      openPane();
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
    fireEvent.click(rows()[1]);
    const step = screen
      .getByText('optimistic')
      .closest<HTMLElement>('[role="button"]')!;
    fireEvent.click(step);
    expect(under(step)).toMatch(/title: "One" → "Edited"/);

    const statePanel = top().parentElement!.parentElement!;
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
    // the pane lists the record's actions; a moment picked there outranks
    // the store the chip opened the record at
    expect(rows()).toHaveLength(2);
    fireEvent.click(rows()[1]);
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

describe('Store Actions pane on a record', () => {
  it('lists the actions that touched the record, with what each did', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    // stored again unchanged, twice in a row
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    openPane();
    openPost('1');
    expect(paneHead()).toBe('ActionsPost 1' + '4');
    expect(rows()).toHaveLength(4);
    expect(rows()[1].textContent).toContain('stored again, unchanged');
    expect(rows()[2].textContent).toContain('stored again, unchanged');
    expect(rows()[3].textContent).toContain('set');
    // a row sets the moment: State shows the record as it was then
    fireEvent.click(rows()[0]);
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(current()).toBe('Post 1');
    expect(top().textContent).toContain('"One"');
    // and what the action did to the record shows under the row
    fireEvent.click(rows()[3]);
    expect(current()).toBe('Post 1');
    expect(under(rows()[3])).toMatch(/title: "One" → "Edited"/);
    // an action that left the record alone is not listed
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Other' }));
    expect(rows()).toHaveLength(4);
    // the store lists every action
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    expect(paneHead()).toBe('Actions' + '5');
    expect(rows()).toHaveLength(5);
  });

  it('says where actions the log dropped changed a record', async () => {
    const { ctrl } = mount();
    await act(async () => {
      await ctrl().set(Post, { id: '1' }, { id: '1', title: 'one' });
      // past updateLimit: the oldest sets of Post drop off
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '2' }, { id: '2', title: `t${i}` });
    });
    openPane();
    openPost('2');
    expect(pane().textContent).toContain('Changed by actions not kept');
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    // Post 1's own set is still there
    openPost('1');
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
    openPane();
    openPost('1');
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
    openPane();
    openPost('1');
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
    openPost('1');
    expect(marked()).toEqual([]);
    expect(within(pane()).getByText('At this moment')).toBeTruthy();
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
    expect(under(rows()[1])).toContain('No change to this record');
    expect(changedBy()).toContain('actions not kept');
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
    openPane();
    openPost('1');
    const subscription = rows()[1];
    fireEvent.click(subscription);
    const note = within(pane()).getByText(
      /^Changed by actions not kept/,
    ).parentElement!;
    expect(note.hasAttribute('aria-current')).toBe(false);
    // the gap is found at the first kept poll's response: the step after the
    // note, which alone is current once picked
    const step = note.nextElementSibling!.firstElementChild as HTMLElement;
    expect(step.textContent).toContain('setResponse');
    fireEvent.click(step);
    expect(step.getAttribute('aria-current')).toBe('true');
    expect([
      ...pane().querySelectorAll('[data-seq][aria-current="true"]'),
    ]).toEqual([subscription, step]);
    expect(under(step)).toContain('title:');
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
    openPane();
    fireEvent.click(
      top().querySelector<HTMLElement>(`tr[data-id="${endpointId(POSTS)}"]`)!,
    );
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
    openPane();
    openPost('1');
    const marked = () => rows().map(r => r.getAttribute('aria-current'));
    expect(marked()).toEqual(['true', null]);
    // picking a row moves the moment there, for the whole panel
    fireEvent.click(rows()[1]);
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
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    previous();
    expect(marked()).toEqual([null, null, 'true']);
  });

  it('shows the action that last changed a record from the tree view', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    fireEvent.click(screen.getByLabelText('Tree view'));
    const tree = () =>
      screen.getByLabelText('Tree view').getAttribute('aria-pressed');
    const node = (id: string) =>
      [...document.querySelectorAll<HTMLElement>('[data-id]')].find(
        el => el.dataset.id === id,
      )!;
    fireEvent.click(node(entityId('Post', '1')));
    expect(screen.getByText('changed by')).toBeTruthy();
    // the action that last changed it shows in the pane, beside the tree
    fireEvent.click(within(top()).getByRole('button', { name: /^set/ }));
    expect(pane().textContent).toMatch(/title: "One" → "Edited"/);
    expect(rows()[1].getAttribute('aria-current')).toBe('true');
    expect(tree()).toBe('true');
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
