/// <reference types="jest" />
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  actionTypes,
  Controller,
  DataProvider,
  NetworkManager,
  useController,
} from '@data-client/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { groupEntries } from '../store/actionGroups';
import type { LogEntry } from '../store/actionLog';
import SchemaRegistry from '../store/schemaRegistry';
import StorePanel, { TIMELINE_CLOSE_MS } from '../store/StorePanel';
import { axisLabels, lanesOf, timeScale } from '../store/Timeline';

jest.mock('../../../../utils/tabStorage', () => ({
  useTabStorage: () => require('react').useState(null),
}));

class Post extends Entity {
  id = '';
  title = '';
}
const POSTS = 'GET https://example.com/posts';
let title = 'One';
const getPosts = new Endpoint(async () => [{ id: '1', title }], {
  schema: [Post],
  key: () => POSTS,
  name: 'getPosts',
});

function mount() {
  const registry = new SchemaRegistry({ trimEvery: 1 });
  const log = registry.log.connect(0);
  const ref: { ctrl?: Controller } = {};
  function Grab() {
    ref.ctrl = useController();
    return null;
  }
  render(
    <DataProvider
      managers={[log.head, registry, new NetworkManager(), log.tail]}
      devButton={null}
    >
      <Grab />
      <StorePanel registry={registry} history={0} />
    </DataProvider>,
  );
  return { ctrl: () => ref.ctrl! };
}

const entry = (seq: number, at: number, action: any): LogEntry => ({
  seq,
  at,
  action,
});
/** The box the timeline slides in */
const revealBox = (timeline: HTMLElement) =>
  timeline.parentElement!.parentElement!.parentElement!;
/** What scrolls in the strip: the tracks, beside the lane labels */
const tracks = (timeline: HTMLElement) =>
  timeline.lastElementChild as HTMLElement;
/** The scrubber on top: ‹ › and the one lane, with the moment's action */
const scrubber = () => screen.getByRole('group', { name: /^Scrubber/ });
/** Expands or collapses the timeline under the scrubber */
const toggle = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
/** The strip lens: the lanes */
const lanes = () => screen.getByRole('group', { name: /^Timeline/ });
/** Draws the expanded timeline as `lens` */
const draw = (lens: 'Strip' | 'List') =>
  fireEvent.click(screen.getByRole('button', { name: lens }));
/** The list lens's rows (not those left in a box sliding shut) */
const rows = () =>
  [
    ...document.querySelectorAll<HTMLElement>('[role="button"][aria-expanded]'),
  ].filter(el => !el.closest('[inert]'));
const tab = (name: string) =>
  screen.getByRole('tab', { name }).getAttribute('aria-selected');
/** The next frame, when a box just opened slides */
const nextFrame = () =>
  act(() => new Promise<void>(r => requestAnimationFrame(() => r())));
/** Mounts with a panel `width` px wide, as a browser would lay it out */
// every observed width `mountAt` reports; `resize` changes them all
let observed: ((entries: unknown[]) => void)[] = [];
const resize = (width: number) =>
  act(() => observed.forEach(cb => cb([{ contentRect: { width } }])));
function mountAt(width: number) {
  class Observer {
    constructor(private cb: (entries: unknown[]) => void) {}
    observe() {
      this.cb([{ contentRect: { width } }]);
      observed.push(this.cb);
    }

    disconnect() {}
  }
  observed = [];
  (globalThis as any).ResizeObserver = Observer;
  try {
    return mount();
  } finally {
    delete (globalThis as any).ResizeObserver;
  }
}

describe('timeScale', () => {
  it('spreads bursts apart and shortens idle stretches', () => {
    const fetch = { type: actionTypes.FETCH, key: 'a' };
    const scale = timeScale([
      entry(1, 0, fetch),
      // 1ms later: spread to the minimum gap
      entry(2, 1, fetch),
      // 200ms later: to scale
      entry(3, 201, fetch),
      // a minute later: cut short, with a break
      entry(4, 60201, fetch),
    ]);
    const [a, b, c, d] = [1, 2, 3, 4].map(seq => scale.x.get(seq)!);
    expect(b - a).toBe(10);
    expect(c - b).toBeCloseTo(16);
    expect(d - c).toBe(56);
    expect(scale.breaks).toEqual([c + 28]);
    expect(scale.end).toBe(d);
    expect(scale.width).toBe(d + 24);
  });
});

describe('axisLabels', () => {
  it('thins the labels out to the gap asked for', () => {
    const fetch = { type: actionTypes.FETCH, key: 'a' };
    // 500ms apart: 40px each
    const entries = [0, 500, 1000, 1500].map((at, i) =>
      entry(i + 1, at, fetch),
    );
    const scale = timeScale(entries);
    expect(axisLabels(entries, scale, 40).map(l => l.seq)).toEqual([
      1, 2, 3, 4,
    ]);
    // fit into half the room: every other label
    expect(axisLabels(entries, scale, 80).map(l => l.seq)).toEqual([1, 3]);
  });
});

describe('lanesOf', () => {
  it('puts every group about one key in one lane, in first-seen order', () => {
    const fetch = (key: string) => ({
      type: actionTypes.FETCH,
      key,
      endpoint: { sideEffect: false },
      meta: { fetchedAt: 0 },
    });
    const lanes = lanesOf(
      groupEntries([
        entry(1, 0, fetch('b')),
        entry(2, 1, fetch('a')),
        entry(3, 2, { type: actionTypes.INVALIDATE, key: 'b' }),
      ]),
    );
    expect(lanes.map(l => [l.key, l.groups.length])).toEqual([
      ['b', 2],
      ['a', 1],
    ]);
  });
});

describe('Store scrubber', () => {
  it('shows the whole history on one lane, live, over the tabs', async () => {
    const { ctrl } = mount();
    const bar = scrubber();
    // live: nothing to step to, and Live is said, not offered
    expect(bar.textContent).toContain('Live');
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(screen.queryByText('After')).toBeNull();
    expect(
      (screen.getByRole('button', { name: 'Next change' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    // before the tabs, which keep State's view switch
    expect(
      bar.compareDocumentPosition(
        screen.getByRole('tablist', { name: 'Store' }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('group', { name: 'Store view' })).toBeTruthy();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    // only actions that reached the store can be picked; the rest show
    const marks = within(bar).getAllByRole('button', {
      name: /^setResponse at/,
    });
    expect(marks).toHaveLength(2);
    expect(within(bar).getAllByTitle(/^fetch at/)).toHaveLength(2);
    expect(within(bar).queryByRole('button', { name: /^fetch at/ })).toBeNull();
    // the lanes stay collapsed
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
  });

  it('shows State as it was after the mark picked, and says which action', async () => {
    const { ctrl } = mount();
    title = 'One';
    await act(() => ctrl().fetch(getPosts));
    title = 'Two';
    await act(() => ctrl().fetch(getPosts));
    expect(screen.getAllByText('"Two"').length).toBeGreaterThan(0);
    const bar = scrubber();
    const marks = within(bar).getAllByRole('button', {
      name: /^setResponse at/,
    });
    fireEvent.click(marks[0]);
    expect(bar.textContent).toContain('After');
    expect(bar.textContent).toContain('setResponse');
    expect(bar.textContent).toMatch(/· [\d.]+s/);
    expect(marks[0].hasAttribute('data-selected')).toBe(true);
    expect(screen.getAllByText('"One"').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('"Two"')).toHaveLength(0);
    // the same moment under the Action facet
    fireEvent.click(screen.getByRole('tab', { name: 'Action' }));
    expect(bar.textContent).toContain('After');
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    // Live lets go, and the label with it
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.queryByText('After')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(screen.getAllByText('"Two"').length).toBeGreaterThan(0);
    expect(marks[0].hasAttribute('data-selected')).toBe(false);
  });

  it('steps through changes with ‹ › and the arrow keys, past the newest to live', async () => {
    const { ctrl } = mount();
    title = 'One';
    await act(() => ctrl().fetch(getPosts));
    title = 'Two';
    await act(() => ctrl().fetch(getPosts));
    const bar = scrubber();
    const previous = screen.getByRole('button', {
      name: 'Previous change',
    }) as HTMLButtonElement;
    const next = screen.getByRole('button', {
      name: 'Next change',
    }) as HTMLButtonElement;
    const marks = within(bar).getAllByRole('button', {
      name: /^setResponse at/,
    });
    // live: ‹ goes to the newest change
    fireEvent.click(previous);
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    expect(screen.getAllByText('"Two"').length).toBeGreaterThan(0);
    fireEvent.keyDown(bar, { key: 'ArrowLeft' });
    expect(marks[0].hasAttribute('data-selected')).toBe(true);
    expect(screen.getAllByText('"One"').length).toBeGreaterThan(0);
    // the first change: nothing earlier
    expect(previous.disabled).toBe(true);
    fireEvent.keyDown(bar, { key: 'ArrowLeft' });
    expect(marks[0].hasAttribute('data-selected')).toBe(true);
    fireEvent.keyDown(bar, { key: 'ArrowRight' });
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    // past the newest change: live
    expect(next.disabled).toBe(false);
    fireEvent.keyDown(bar, { key: 'ArrowRight' });
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(next.disabled).toBe(true);
    // End from anywhere
    fireEvent.click(previous);
    fireEvent.click(previous);
    expect(marks[0].hasAttribute('data-selected')).toBe(true);
    fireEvent.keyDown(bar, { key: 'End' });
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    fireEvent.click(previous);
    fireEvent.click(next);
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
  });

  it('keeps focus in the scrubber as the button pressed goes', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    const previous = screen.getByRole('button', { name: 'Previous change' });
    previous.focus();
    fireEvent.click(previous);
    expect(screen.getByText('After')).toBeTruthy();
    // ‹ is turned off at the first change: focus moves to a button still on
    expect(document.activeElement).not.toBe(document.body);
    expect(scrubber().contains(document.activeElement)).toBe(true);
    const live = screen.getByRole('button', { name: 'Live' });
    live.focus();
    fireEvent.click(live);
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(document.activeElement).toBe(previous);
  });

  it('opens the Action facet on the moment’s action from its label', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Previous change' }));
    expect(tab('State')).toBe('true');
    const label = screen.getByTitle('Open action');
    label.focus();
    fireEvent.click(label);
    expect(tab('Action')).toBe('true');
    const level = document.querySelector<HTMLElement>(
      '[data-level]:not([data-covered])',
    )!;
    expect(level.textContent).toContain('setResponse');
    expect(level.textContent).toContain('dispatchedAt');
    // the subject stays, and so does focus
    expect(level.querySelector('[aria-current="page"]')).toBeNull();
    expect(document.activeElement).toBe(label);
  });

  it('keeps a snapshot’s action once it drops off the log', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Previous change' }));
    const marks = () =>
      within(scrubber()).getAllByRole('button', { name: /^setResponse at/ });
    expect(marks()).toHaveLength(1);
    await act(async () => {
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '1' }, { id: '1', title: `t${i}` });
    });
    // still first on the lane, picked, though the log let go of it
    expect(marks()[0].hasAttribute('data-selected')).toBe(true);
    expect(scrubber().textContent).toContain('setResponse');
  });
});

describe('Store Timeline lanes', () => {
  it('expand under the scrubber, collapsing back', async () => {
    const { ctrl } = mount();
    const expand = screen.getByRole('button', { name: 'Timeline' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    toggle();
    expect(expand.getAttribute('aria-expanded')).toBe('true');
    const timeline = lanes();
    expect(timeline.textContent).toContain('Nothing dispatched yet');
    // under the scrubber, over the tabs
    expect(scrubber().compareDocumentPosition(timeline)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(
      timeline.compareDocumentPosition(
        screen.getByRole('tablist', { name: 'Store' }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    // its scroller is kept from before the first action, so it follows from it
    await act(() => ctrl().fetch(getPosts));
    expect(lanes()).toBe(timeline);
    expect(timeline.textContent).not.toContain('Nothing dispatched yet');
    // one lane for the endpoint, both requests on it; the scrubber keeps
    // its own lane
    await act(() => ctrl().fetch(getPosts));
    expect(timeline.textContent).toContain('/posts');
    expect(
      within(timeline).getAllByRole('button', { name: /^setResponse at/ }),
    ).toHaveLength(2);
    expect(
      within(scrubber()).getAllByRole('button', { name: /^setResponse at/ }),
    ).toHaveLength(2);
    toggle();
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
  });

  it('shows State as it was after the action picked on a lane', async () => {
    const { ctrl } = mount();
    title = 'One';
    await act(() => ctrl().fetch(getPosts));
    title = 'Two';
    await act(() => ctrl().fetch(getPosts));
    toggle();
    const timeline = lanes();
    const marks = within(timeline).getAllByRole('button', {
      name: /^setResponse at/,
    });
    fireEvent.click(marks[0]);
    expect(scrubber().textContent).toContain('After');
    expect(screen.getAllByText('"One"').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('"Two"')).toHaveLength(0);
    expect(marks[0].hasAttribute('data-selected')).toBe(true);
    // the scrubber's mark too
    expect(
      within(scrubber())
        .getAllByRole('button', { name: /^setResponse at/ })[0]
        .hasAttribute('data-selected'),
    ).toBe(true);

    // the arrow keys step through changes, past the newest back to live
    fireEvent.keyDown(timeline, { key: 'ArrowRight' });
    expect(screen.getAllByText('"Two"').length).toBeGreaterThan(0);
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    fireEvent.keyDown(timeline, { key: 'ArrowRight' });
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    fireEvent.keyDown(timeline, { key: 'ArrowLeft' });
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    // and so does the scrubber's ›
    fireEvent.click(screen.getByRole('button', { name: 'Next change' }));
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();

    // back to live, it scrolls to the newest again, from wherever a pick left it
    Object.defineProperty(tracks(timeline), 'scrollWidth', { value: 900 });
    fireEvent.click(marks[0]);
    tracks(timeline).scrollLeft = 0;
    fireEvent.keyDown(timeline, { key: 'End' });
    expect(tracks(timeline).scrollLeft).toBe(900);
    // live already, End still brings the newest back
    tracks(timeline).scrollLeft = 0;
    fireEvent.keyDown(timeline, { key: 'End' });
    expect(tracks(timeline).scrollLeft).toBe(900);
    fireEvent.keyDown(timeline, { key: 'ArrowLeft' });

    // the lanes stay above the Action facet, without State's view switch
    fireEvent.click(screen.getByRole('tab', { name: 'Action' }));
    expect(lanes()).toBe(timeline);
    expect(screen.queryByRole('group', { name: 'Store view' })).toBeNull();
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    // collapsed, the scrubber keeps the moment
    toggle();
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Live' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
  });

  it('slide shut, let go of once the slide ends', async () => {
    mount();
    toggle();
    const timeline = lanes();
    // the box mounts shut and opens a frame later, so it slides open
    const box = revealBox(timeline);
    expect(box.hasAttribute('data-open')).toBe(false);
    await nextFrame();
    expect(box.hasAttribute('data-open')).toBe(true);
    // the scrubber is outside the box, so it stays as the lanes shut
    expect(box.contains(scrubber())).toBe(false);
    toggle();
    // still there for the slide, but neither focusable nor announced
    expect(timeline.isConnected).toBe(true);
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    expect(box.hasAttribute('data-open')).toBe(false);
    expect(box.hasAttribute('inert')).toBe(true);
    expect(scrubber()).toBeTruthy();
    // reopened mid-slide, it turns around from where it is: no snap shut
    toggle();
    expect(box.hasAttribute('inert')).toBe(false);
    await nextFrame();
    expect(box.hasAttribute('data-open')).toBe(true);
    expect(lanes()).toBe(timeline);
    toggle();
    fireEvent.transitionEnd(box);
    expect(timeline.isConnected).toBe(false);
  });

  it('let go once the slide must be over, should its end go unseen', () => {
    jest.useFakeTimers();
    try {
      mount();
      toggle();
      const timeline = lanes();
      // flipped shut and open again before the slide ends: it stays
      toggle();
      toggle();
      act(() => jest.runOnlyPendingTimers());
      expect(lanes()).toBe(timeline);
      // shut, with no transitionend (hidden mid-slide): let go anyway
      toggle();
      expect(timeline.isConnected).toBe(true);
      act(() => jest.advanceTimersByTime(TIMELINE_CLOSE_MS - 1));
      expect(timeline.isConnected).toBe(true);
      act(() => jest.advanceTimersByTime(1));
      expect(timeline.isConnected).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('hand focus back to the expand as they shut under it', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    toggle();
    const timeline = lanes();
    timeline.focus();
    expect(document.activeElement).toBe(timeline);
    toggle();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Timeline' }),
    );
  });

  it('say when earlier actions of a lane are no longer kept, as the list does', async () => {
    const { ctrl } = mount();
    await act(async () => {
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '1' }, { id: '1', title: `t${i}` });
    });
    toggle();
    expect(
      screen.getByRole('img', {
        name: '4 earlier sets not kept: the log keeps the newest',
      }),
    ).toBeTruthy();
  });

  it('offer no History on a lane whose dropped actions changed nothing', async () => {
    const { ctrl } = mount();
    // a read that never resolves; a reset cancels each one in flight
    const stuck = new Endpoint(() => new Promise<Post[]>(() => {}), {
      schema: [Post],
      key: () => POSTS,
      name: 'stuck',
      pollFrequency: 1e6,
    });
    await act(async () => {
      await ctrl().set(Post, { id: '2' }, { id: '2', title: 'Two' });
      ctrl().subscribe(stuck);
      // past updateLimit: the oldest cancelled polls drop off
      for (let i = 0; i < 25; i++) {
        ctrl().resetEntireStore();
        ctrl()
          .fetch(stuck)
          .catch(() => {});
      }
    });
    toggle();
    const timeline = lanes();
    expect(
      within(timeline).getByRole('img', { name: /earlier polls not kept/ }),
    ).toBeTruthy();
    // none of them, nor what the log kept, stored the endpoint
    expect(
      within(timeline).queryByRole('button', { name: 'History' }),
    ).toBeNull();
  });

  it('stay on a picked action as new ones come in', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    toggle();
    const timeline = lanes();
    Object.defineProperty(tracks(timeline), 'clientHeight', { value: 100 });
    Object.defineProperty(tracks(timeline), 'scrollWidth', { value: 900 });
    const [mark] = within(timeline).getAllByRole('button', {
      name: /^setResponse at/,
    });
    fireEvent.click(mark);
    tracks(timeline).scrollLeft = 0;
    await act(() => ctrl().fetch(getPosts));
    expect(tracks(timeline).scrollLeft).toBe(0);
    // back to live, it follows again
    fireEvent.keyDown(timeline, { key: 'End' });
    tracks(timeline).scrollLeft = 0;
    await act(() => ctrl().fetch(getPosts));
    expect(tracks(timeline).scrollLeft).toBe(900);
  });

  it('stay on the newest until scrolled back, as live', async () => {
    // shown with a height from the start, as a browser lays it out
    const height = jest
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(100);
    const { ctrl } = mount();
    let timeline: HTMLElement;
    try {
      await act(() => ctrl().fetch(getPosts));
      toggle();
      timeline = lanes();
    } finally {
      height.mockRestore();
    }
    Object.defineProperty(tracks(timeline), 'clientHeight', { value: 100 });
    Object.defineProperty(tracks(timeline), 'clientWidth', { value: 300 });
    Object.defineProperty(tracks(timeline), 'scrollWidth', {
      value: 900,
      configurable: true,
    });
    await act(() => ctrl().fetch(getPosts));
    expect(tracks(timeline).scrollLeft).toBe(900);
    // scrolled back into the history: it stays there as actions come in
    tracks(timeline).scrollLeft = 100;
    fireEvent.scroll(tracks(timeline));
    await act(() => ctrl().fetch(getPosts));
    expect(tracks(timeline).scrollLeft).toBe(100);
    // fitting and back doesn't pull it to the newest either, though the
    // fit has nothing to scroll and clamps it
    const fit = within(timeline).getByRole('button', { name: 'Fit timeline' });
    fireEvent.click(fit);
    tracks(timeline).scrollLeft = 0;
    Object.defineProperty(tracks(timeline), 'scrollWidth', {
      value: 300,
      configurable: true,
    });
    fireEvent.scroll(tracks(timeline));
    Object.defineProperty(tracks(timeline), 'scrollWidth', {
      value: 900,
      configurable: true,
    });
    fireEvent.click(fit);
    expect(tracks(timeline).scrollLeft).toBe(100);
    // the scroll back there lets go again
    fireEvent.scroll(tracks(timeline));
    await act(() => ctrl().fetch(getPosts));
    expect(tracks(timeline).scrollLeft).toBe(100);
    // going to the newest while fit drops the spot to come back to
    fireEvent.click(fit);
    fireEvent.keyDown(timeline, { key: 'End' });
    fireEvent.click(fit);
    expect(tracks(timeline).scrollLeft).toBe(900);
    tracks(timeline).scrollLeft = 100;
    fireEvent.scroll(tracks(timeline));
    // scrolled back to the newest, it follows again
    tracks(timeline).scrollLeft = 600;
    fireEvent.scroll(tracks(timeline));
    await act(() => ctrl().fetch(getPosts));
    expect(tracks(timeline).scrollLeft).toBe(900);
  });

  it('keep the lane labels beside their tracks as either scrolls', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    toggle();
    const timeline = lanes();
    const labels = timeline.firstElementChild as HTMLElement;
    tracks(timeline).scrollTop = 20;
    fireEvent.scroll(tracks(timeline));
    expect(labels.scrollTop).toBe(20);
    labels.scrollTop = 5;
    fireEvent.scroll(labels);
    expect(tracks(timeline).scrollTop).toBe(5);
    // the keys that would scroll a focused scroller scroll the lanes
    fireEvent.keyDown(timeline, { key: 'ArrowDown' });
    expect(tracks(timeline).scrollTop).toBe(23);
    fireEvent.keyDown(timeline, { key: 'ArrowUp' });
    expect(tracks(timeline).scrollTop).toBe(5);
  });

  it('scroll in the detailed spacing, fitting the whole history on demand', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    toggle();
    const timeline = lanes();
    const body = timeline.querySelector<HTMLElement>('[style*="--tl-width"]')!;
    // detailed by default: everything placed as a fraction of the track
    expect(body.hasAttribute('data-fit')).toBe(false);
    expect(body.style.getPropertyValue('--tl-width')).toMatch(/px$/);
    const marks = within(timeline).getAllByRole('button', {
      name: /^setResponse at/,
    });
    const fractions = marks.map(m =>
      Number(m.style.getPropertyValue('--tl-f')),
    );
    for (const f of fractions) {
      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThan(1);
    }
    expect(fractions[1]).toBeGreaterThan(fractions[0]);
    const fit = within(timeline).getByRole('button', {
      name: 'Fit timeline',
    });
    expect(fit.getAttribute('aria-pressed')).toBe('false');

    // fit: the whole history in the strip, the picked action still in view
    fireEvent.click(marks[0]);
    const seen = jest.fn();
    marks[0].scrollIntoView = seen;
    fireEvent.click(fit);
    expect(fit.getAttribute('aria-pressed')).toBe('true');
    expect(body.hasAttribute('data-fit')).toBe(true);
    expect(seen).toHaveBeenCalled();
    expect(marks[0].style.getPropertyValue('--tl-f')).toBe(
      String(fractions[0]),
    );
    // and back
    fireEvent.click(fit);
    expect(body.hasAttribute('data-fit')).toBe(false);
    expect(fit.getAttribute('aria-pressed')).toBe('false');
  });

  it('open an endpoint lane’s History on the levels', async () => {
    const { ctrl } = mount();
    title = 'One';
    await act(() => ctrl().fetch(getPosts));
    title = 'Two';
    await act(() => ctrl().fetch(getPosts));
    toggle();
    const timeline = lanes();
    fireEvent.click(within(timeline).getByRole('button', { name: 'History' }));
    expect(
      screen.getByRole('tab', { name: 'State' }).getAttribute('aria-selected'),
    ).toBe('true');
    const level = document.querySelector<HTMLElement>(
      '[data-level]:not([data-covered])',
    )!;
    expect(level.querySelector('[aria-current="page"]')!.textContent).toBe(
      'History',
    );
    expect(level.textContent).toContain('/posts');
    // the second response stored the same ids again
    expect(level.querySelectorAll('[data-version]')).toHaveLength(1);
    expect(level.textContent).toContain('stored again, unchanged');
  });

  it('draw the history as a list on demand, where a row sets the moment', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    toggle();
    const strip = screen.getByRole('button', { name: 'Strip' });
    const list = screen.getByRole('button', { name: 'List' });
    expect(strip.getAttribute('aria-pressed')).toBe('true');
    expect(list.getAttribute('aria-pressed')).toBe('false');
    expect(rows()).toHaveLength(0);
    // the list: one row per request; fit is the strip's alone
    draw('List');
    expect(list.getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Fit timeline' })).toBeNull();
    expect(rows()).toHaveLength(2);
    expect(rows()[0].textContent).toContain('/posts');
    // a row sets the moment alone: the facet stays
    fireEvent.click(rows()[0]);
    expect(scrubber().textContent).toContain('After');
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(tab('State')).toBe('true');
    // the scrubber steps it, which the list follows
    fireEvent.click(screen.getByRole('button', { name: 'Next change' }));
    expect(rows()[1].getAttribute('aria-current')).toBe('true');
    // a row's › opens the Action facet on it
    fireEvent.click(
      within(rows()[0]).getByRole('button', { name: 'Open action' }),
    );
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    expect(tab('Action')).toBe('true');
    expect(
      document.querySelector('[data-level]:not([data-covered])')!.textContent,
    ).toContain('setResponse');
    // back to the strip, with the moment on it
    draw('Strip');
    expect(rows()).toHaveLength(0);
    expect(
      within(lanes())
        .getAllByRole('button', { name: /^setResponse at/ })[0]
        .hasAttribute('data-selected'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.queryByText('After')).toBeNull();
  });
});

describe('Store Timeline sheet', () => {
  it('opens over the content on a narrow panel, closing as asked or on a pick', async () => {
    const { ctrl } = mountAt(360);
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    expect(screen.queryByRole('button', { name: 'Close timeline' })).toBeNull();
    toggle();
    const timeline = lanes();
    const close = screen.getByRole('button', { name: 'Close timeline' });
    // in the tabs' box, before them, not between the scrubber and the tabs
    const body = screen.getByRole('tablist', { name: 'Store' }).parentElement!;
    expect(body.contains(timeline)).toBe(true);
    expect(body.contains(scrubber())).toBe(false);
    expect(revealBox(timeline).contains(close)).toBe(true);
    // the tabs and content stay put under it
    expect(screen.getByRole('tab', { name: 'State' })).toBeTruthy();
    // ✕ closes it
    fireEvent.click(close);
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    expect(
      screen
        .getByRole('button', { name: 'Timeline' })
        .getAttribute('aria-expanded'),
    ).toBe('false');
    // so does Escape, in it or on the ▾ that opened it
    toggle();
    fireEvent.keyDown(lanes(), { key: 'Escape' });
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    toggle();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Timeline' }), {
      key: 'Escape',
    });
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    // and picking a moment, which the scrubber then shows
    toggle();
    const [mark] = within(lanes()).getAllByRole('button', {
      name: /^setResponse at/,
    });
    fireEvent.click(mark);
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    expect(scrubber().textContent).toContain('After');
    // stepping with the keys keeps it open
    toggle();
    fireEvent.keyDown(lanes(), { key: 'ArrowRight' });
    expect(lanes()).toBeTruthy();
    expect(
      within(lanes())
        .getAllByRole('button', { name: /^setResponse at/ })[1]
        .hasAttribute('data-selected'),
    ).toBe(true);
    // as a list, a row keeps it open to browse; its › shows the action under
    draw('List');
    fireEvent.click(rows()[0]);
    expect(rows()).toHaveLength(2);
    expect(rows()[0].getAttribute('aria-current')).toBe('true');
    fireEvent.click(
      within(rows()[0]).getByRole('button', { name: 'Open action' }),
    );
    expect(rows()).toHaveLength(0);
    expect(tab('Action')).toBe('true');
    // and so does a chip, drilling into what the action changed
    toggle();
    fireEvent.click(within(rows()[0]).getByRole('button', { name: /Post 1/ }));
    expect(rows()).toHaveLength(0);
    expect(
      document
        .querySelector('[data-level]:not([data-covered])')!
        .querySelector('[aria-current="page"]')!.textContent,
    ).toBe('Post 1');
  });

  it('is not used on a wide panel, where Escape leaves the lanes', async () => {
    mountAt(800);
    toggle();
    expect(screen.queryByRole('button', { name: 'Close timeline' })).toBeNull();
    fireEvent.keyDown(lanes(), { key: 'Escape' });
    expect(lanes()).toBeTruthy();
  });

  it('keeps the lanes, and focus in them, across the narrow width', async () => {
    const { ctrl } = mountAt(800);
    await act(() => ctrl().fetch(getPosts));
    toggle();
    const timeline = lanes();
    timeline.focus();
    resize(360);
    expect(screen.getByRole('button', { name: 'Close timeline' })).toBeTruthy();
    expect(lanes()).toBe(timeline);
    expect(document.activeElement).toBe(timeline);
    resize(800);
    expect(screen.queryByRole('button', { name: 'Close timeline' })).toBeNull();
    expect(lanes()).toBe(timeline);
  });
});
