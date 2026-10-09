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
import ActionLog, { type LogEntry, type LogOptions } from '../store/actionLog';
import { entityId } from '../store/model';
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
const actionsTab = () => screen.getByRole('tab', { name: /Actions/ });
const rows = () =>
  [...document.querySelectorAll<HTMLElement>('[aria-expanded]')].filter(
    el => !el.closest('[hidden]'),
  );
/** The shown level's breadcrumb */
const current = () =>
  within(top())
    .getByRole('navigation', { name: 'Store location' })
    .querySelector('[aria-current="page"]')!.textContent;
/** Opens Post `pk`'s History from the table; its text */
const postHistory = (pk: string) => {
  fireEvent.click(
    top().querySelector<HTMLElement>(`tr[data-id="${entityId('Post', pk)}"]`)!,
  );
  fireEvent.click(within(top()).getByRole('button', { name: 'History' }));
  return top().textContent;
};
/** Opens the one action of a lone row of the Actions list, which moves the
 * moment to it */
const openLone = (row: HTMLElement) => {
  fireEvent.click(row);
  fireEvent.click(
    row.parentElement!.querySelector<HTMLElement>(
      '[data-id][role="button"]:not([aria-expanded])',
    )!,
  );
};
/** The shown level */
const top = () =>
  [...document.querySelectorAll<HTMLElement>('[data-level]')].find(
    el => !el.closest('[hidden]') && !el.hasAttribute('data-covered'),
  )!;

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
    // the bar names the action; it opens the Actions list
    fireEvent.click(screen.getByTitle('Open action'));
    expect(actionsTab().getAttribute('aria-selected')).toBe('true');
  });

  it('says how many earlier updates a row no longer has', async () => {
    const { ctrl } = mount();
    await act(async () => {
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '1' }, { id: '1', title: `t${i}` });
    });
    fireEvent.click(actionsTab());
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

  it('shows how a record changed, linking each change to its action', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    fireEvent.click(
      top().querySelector<HTMLElement>(
        `tr[data-id="${entityId('Post', '1')}"]`,
      )!,
    );
    fireEvent.click(within(top()).getByRole('button', { name: 'History' }));
    expect(current()).toBe('History');
    const history = top();
    expect(history.textContent).toContain('setResponse');
    expect(history.textContent).toMatch(/title: "One" → "Edited"/);
    // each version opens its action on the same stack
    fireEvent.click(
      within(history).getByRole('button', { name: 'Open action' }),
    );
    expect(current()).toMatch(/^set Post/);
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    expect(current()).toBe('History');
  });

  it('lists a record’s versions as a timeline, one open at a time', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    // stored again unchanged, twice in a row
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    fireEvent.click(
      top().querySelector<HTMLElement>(
        `tr[data-id="${entityId('Post', '1')}"]`,
      )!,
    );
    // the record's header opens its history
    fireEvent.click(within(top()).getByRole('button', { name: 'History' }));
    expect(current()).toBe('History');
    const timeline = within(top()).getByRole('list', { name: 'Versions' });
    const items = within(timeline).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1].textContent).toContain('stored again, unchanged ×2');
    const versions = () => [
      ...timeline.querySelectorAll<HTMLElement>('[data-version]'),
    ];
    // the latest version starts open, showing the whole record then
    expect(versions().map(v => v.getAttribute('aria-expanded'))).toEqual([
      'false',
      'true',
    ]);
    const body = () => items.find(i => i.textContent?.includes('Open action'))!;
    expect(body()).toBe(items[2]);
    expect(body().textContent).toContain('title:"Edited"');
    // opening another closes it, and shows the record as it was then
    fireEvent.click(versions()[0]);
    expect(versions().map(v => v.getAttribute('aria-expanded'))).toEqual([
      'true',
      'false',
    ]);
    expect(body()).toBe(items[0]);
    expect(body().textContent).toContain('title:"One"');
    // arrows step through the versions
    fireEvent.keyDown(versions()[0], { key: 'ArrowDown' });
    expect(versions()[1].getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(versions()[1]);
    fireEvent.keyDown(versions()[1], { key: 'ArrowDown' });
    expect(versions()[1].getAttribute('aria-expanded')).toBe('true');
    // arrows inside the open version leave it open
    fireEvent.keyDown(
      within(body()).getByRole('button', { name: 'Open action' }),
      {
        key: 'ArrowUp',
      },
    );
    expect(versions()[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('says where actions the log dropped changed a record', async () => {
    const { ctrl } = mount();
    await act(async () => {
      await ctrl().set(Post, { id: '1' }, { id: '1', title: 'one' });
      // past updateLimit: the oldest sets of Post drop off
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '2' }, { id: '2', title: `t${i}` });
    });
    expect(postHistory('2')).toContain('Changed by actions not kept');
    for (let i = 0; i < 2; i++)
      fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    // Post 1's own set is still there
    expect(postHistory('1')).not.toContain('not kept');
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
    expect(postHistory('1')).toContain(`${says} by actions not kept`);
  });

  it('says when actions the log dropped changed a record last', async () => {
    const { ctrl } = mount();
    await act(async () => {
      await ctrl().fetch(getPosts);
      await ctrl().set(Post, { id: '1' }, { id: '1', title: 'last' });
      // past updateLimit: Post 1's set drops with the oldest sets of Post
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '2' }, { id: '2', title: `t${i}` });
    });
    postHistory('1');
    const items = () => within(top()).getAllByRole('listitem');
    expect(items().at(-1)!.textContent).toBe(
      'Changed by actions not kept: the log keeps the newest',
    );
    // live, the latest version is open
    expect(
      items()[0]
        .querySelector('[aria-expanded]')!
        .getAttribute('aria-expanded'),
    ).toBe('true');
    expect(items().at(-1)!.hasAttribute('aria-current')).toBe(false);
    // at a moment among the dropped actions, the record's value isn't known:
    // the note is marked instead of the version before it
    fireEvent.click(actionsTab());
    openLone(rows().at(-1)!);
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    expect(items().at(-1)!.getAttribute('aria-current')).toBe('true');
    expect(top().querySelector('[aria-expanded="true"]')).toBeNull();
  });

  it('opens the version current at the moment, and moves it to the one picked', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    await act(() => ctrl().set(Post, { id: '2' }, { id: '2', title: 'Other' }));
    // between Post 1's versions: the earlier one is current
    fireEvent.click(actionsTab());
    openLone(rows()[2]);
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous change' }));
    postHistory('1');
    const versions = () => [
      ...top().querySelectorAll<HTMLElement>('[data-version]'),
    ];
    expect(versions().map(v => v.getAttribute('aria-expanded'))).toEqual([
      'true',
      'false',
    ]);
    // picking a version moves the moment there, for every tab
    fireEvent.click(versions()[1]);
    expect(versions().map(v => v.getAttribute('aria-expanded'))).toEqual([
      'false',
      'true',
    ]);
    const bar = () =>
      screen.getByRole('button', { name: 'Live' }).parentElement!;
    expect(bar().textContent).toContain('set');
    expect(bar().textContent).toContain('Post');
    expect(bar().textContent).not.toContain('setResponse');
    // and the moment moves the open version
    fireEvent.click(screen.getByRole('button', { name: 'Previous change' }));
    expect(versions().map(v => v.getAttribute('aria-expanded'))).toEqual([
      'true',
      'false',
    ]);
    // live, it stays at the version last picked
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(versions()[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('opens State after a version, and back to that version', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    fireEvent.click(
      top().querySelector<HTMLElement>(
        `tr[data-id="${entityId('Post', '1')}"]`,
      )!,
    );
    fireEvent.click(within(top()).getByRole('button', { name: 'History' }));
    const first = () => top().querySelector<HTMLElement>('[data-version]')!;
    fireEvent.click(first());
    fireEvent.click(
      within(top()).getByRole('button', { name: 'View State after this' }),
    );
    // State as the first version left it, on the record it came from
    expect(screen.getByRole('button', { name: 'Live' })).toBeTruthy();
    expect(current()).not.toBe('History');
    expect(top().textContent).toContain('"One"');
    // History reopens at that version
    fireEvent.click(within(top()).getByRole('button', { name: 'History' }));
    expect(current()).toBe('History');
    expect(first().getAttribute('aria-expanded')).toBe('true');
  });

  it('opens History from the tree view, in the table view', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    // the tree has no stack: the history opens on the table view's
    expect(tree()).toBe('false');
    expect(current()).toBe('History');
    expect(top().textContent).toMatch(/title: "One" → "Edited"/);
    // as does the action that last changed it
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByLabelText('Tree view'));
    fireEvent.click(node(entityId('Post', '1')));
    fireEvent.click(screen.getByRole('button', { name: /^set/ }));
    expect(current()).toMatch(/^set Post/);
  });

  it('offers History from a row expanded in place in a list', async () => {
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
    fireEvent.click(within(top()).getByRole('button', { name: 'History' }));
    expect(current()).toBe('History');
    expect(top().textContent).toContain('set');
    // the record's own level offers it once, from its header
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    fireEvent.click(
      top().querySelector<HTMLElement>(
        `tr[data-id="${entityId('Article', '1')}"]`,
      )!,
    );
    expect(
      within(top()).getAllByRole('button', { name: 'History' }),
    ).toHaveLength(1);
  });

  it('opens the whole history from a record shown as an action left it', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() =>
      ctrl().set(Post, { id: '1' }, { id: '1', title: 'Edited' }),
    );
    fireEvent.click(actionsTab());
    // the response's new rows open as it left them
    fireEvent.click(
      within(rows()[0]).getByRole('button', { name: '+ 2 Post' }),
    );
    fireEvent.click(
      top().querySelector<HTMLElement>(
        `tr[data-id="${entityId('Post', '1')}"]`,
      )!,
    );
    expect(top().textContent).toContain('after this action');
    fireEvent.click(within(top()).getByRole('button', { name: 'History' }));
    const versions = [
      ...top().querySelectorAll<HTMLElement>('[data-version]'),
    ].map(v => v.getAttribute('aria-expanded'));
    // every version, with the one that level showed open
    expect(versions).toEqual(['true', 'false']);
    expect(top().textContent).not.toContain('after this action');
  });

  it('steps through the actions of a row, and back from State by the bar', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(actionsTab());
    fireEvent.click(rows()[0]);
    fireEvent.click(screen.getByText('fetch').closest('[role="button"]')!);
    const crumbs = () =>
      screen.getByRole('navigation', { name: 'Store location' }).parentElement!;
    expect(crumbs().textContent).toContain('1 of 2');
    expect(crumbs().textContent).toContain('fetch');
    fireEvent.click(
      within(crumbs()).getByRole('button', {
        name: 'Next action in this row',
      }),
    );
    expect(crumbs().textContent).toContain('2 of 2');
    expect(crumbs().textContent).toContain('setResponse');
    fireEvent.click(
      screen.getByRole('button', { name: 'View State after this' }),
    );
    expect(
      screen.getByRole('tab', { name: 'State' }).getAttribute('aria-selected'),
    ).toBe('true');
    // the bar's action opens the Actions tab, where the action stays open
    fireEvent.click(screen.getByTitle('Open action'));
    expect(actionsTab().getAttribute('aria-selected')).toBe('true');
    expect(crumbs().textContent).toContain('setResponse');
  });

  it('moves the moment to an action as it opens, and as its row steps', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(actionsTab());
    fireEvent.click(rows()[0]);
    // a fetch never reached the store: still live
    fireEvent.click(screen.getByText('fetch').closest('[role="button"]')!);
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Next action in this row' }),
    );
    const bar = () =>
      screen.getByRole('button', { name: 'Live' }).parentElement!;
    expect(bar().textContent).toContain('After');
    expect(bar().textContent).toContain('setResponse');
    // State shows the store as it left it
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    expect(top().textContent).toContain('"One"');
    // stepping to an action the store never saw leaves it
    fireEvent.click(actionsTab());
    fireEvent.click(
      screen.getByRole('button', { name: 'Previous action in this row' }),
    );
    expect(bar().textContent).toContain('setResponse');
  });

  it('marks the moment’s action in the list, with its row open', async () => {
    const scrollTo = jest.fn();
    Element.prototype.scrollTo = scrollTo;
    try {
      const { ctrl } = mount();
      await act(() => ctrl().fetch(getPosts));
      await act(() => ctrl().fetch(getPosts));
      fireEvent.click(actionsTab());
      Object.defineProperty(top(), 'clientHeight', { value: 100 });
      const marked = () =>
        [...document.querySelectorAll<HTMLElement>('[aria-current="true"]')]
          .filter(el => !el.closest('[hidden]'))
          .map(el => el.textContent);
      // live: nothing is marked
      expect(marked()).toEqual([]);
      fireEvent.click(rows()[1]);
      fireEvent.click(
        screen.getAllByText('setResponse')[0].closest('[role="button"]')!,
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'View State after this' }),
      );
      // back to the first response: its row opens, marked, and scrolls into view
      fireEvent.click(screen.getByRole('button', { name: 'Previous change' }));
      fireEvent.click(screen.getByTitle('Open action'));
      fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
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

  it('keeps a snapshot, and steps from it, once its action drops off', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(actionsTab());
    fireEvent.click(rows()[0]);
    fireEvent.click(
      screen.getByText('setResponse').closest('[role="button"]')!,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'View State after this' }),
    );
    act(() => {
      for (let i = 0; i < 510; i++) ctrl().dispatch(unsubscribe() as any);
    });
    await act(() => ctrl().fetch(getPosts));
    const bar = screen.getByRole('button', { name: 'Live' }).parentElement!;
    expect(bar.textContent).toContain('setResponse');
    const next = within(bar).getByRole('button', { name: 'Next change' });
    expect((next as HTMLButtonElement).disabled).toBe(false);
    // its records still say what changed them
    const statePanel = bar.parentElement!;
    fireEvent.click(
      statePanel.querySelector<HTMLElement>(
        `tr[data-id="${entityId('Post', '1')}"]`,
      )!,
    );
    expect(statePanel.textContent).toContain('changed by');
    // to the refetch, which left the log too, then to one still in it
    const previous = () =>
      within(bar).getByRole('button', {
        name: 'Previous change',
      }) as HTMLButtonElement;
    fireEvent.click(next);
    expect(screen.getByRole('button', { name: 'Live' })).toBeTruthy();
    expect(previous().disabled).toBe(false);
    fireEvent.click(next);
    expect(previous().disabled).toBe(false);
    fireEvent.click(previous());
    expect(screen.getByRole('button', { name: 'Live' })).toBeTruthy();
    expect(bar.textContent).toContain('setResponse');
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
    fireEvent.click(actionsTab());
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
    fireEvent.click(actionsTab());
    // as the first fetch left it, though a later one changed it
    fireEvent.click(within(rows()[0]).getByRole('button', { name: /Post 1/ }));
    expect(top().textContent).toContain('after this action');
    expect(top().textContent).toContain('"Uno"');
    expect(top().textContent).not.toContain('"Later"');
    fireEvent.click(within(top()).getByRole('button', { name: 'Back' }));
    // a collected row opens as it was before
    fireEvent.click(within(rows()[2]).getByRole('button', { name: /Post 3/ }));
    expect(top().textContent).toContain('before this action');
    expect(top().textContent).toContain('"Three"');
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
    fireEvent.click(actionsTab());
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
    expect(actionsTab().textContent).toBe('Actions1');
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
