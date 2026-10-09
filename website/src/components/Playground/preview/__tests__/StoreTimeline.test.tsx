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
/** The box the strip slides in */
const revealBox = (timeline: HTMLElement) =>
  timeline.parentElement!.parentElement!;
/** What scrolls in the strip: the tracks, beside the lane labels */
const tracks = (timeline: HTMLElement) =>
  timeline.lastElementChild as HTMLElement;
/** The box the snapshot bar slides in, from something the bar shows */
const barBox = (shown: HTMLElement) => revealBox(shown.parentElement!);
/** The next frame, when a box just opened slides */
const nextFrame = () =>
  act(() => new Promise<void>(r => requestAnimationFrame(() => r())));

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

describe('Store Timeline strip', () => {
  it('keeps its scroller from before the first action, so it follows from it', async () => {
    const { ctrl } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    expect(timeline.textContent).toContain('Nothing dispatched yet');
    await act(() => ctrl().fetch(getPosts));
    expect(screen.getByRole('group', { name: /^Timeline/ })).toBe(timeline);
    expect(timeline.textContent).not.toContain('Nothing dispatched yet');
  });

  it('shows State as it was after the action picked on the timeline', async () => {
    const { ctrl } = mount();
    title = 'One';
    await act(() => ctrl().fetch(getPosts));
    title = 'Two';
    await act(() => ctrl().fetch(getPosts));

    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    const panel = within(
      screen.getByRole('tablist', { name: 'Store' }).parentElement!,
    );
    // one lane for the endpoint, both requests on it
    expect(timeline.textContent).toContain('/posts');
    expect(panel.getByText(/^Live\./)).toBeTruthy();
    // live State shows below
    expect(panel.getAllByText('"Two"').length).toBeGreaterThan(0);

    // only actions that reached the store can be picked
    const marks = within(timeline).getAllByRole('button', {
      name: /^setResponse at/,
    });
    expect(marks).toHaveLength(2);
    fireEvent.click(marks[0]);
    expect(panel.getByText('After')).toBeTruthy();
    expect(panel.getAllByText('"One"').length).toBeGreaterThan(0);
    expect(panel.queryAllByText('"Two"')).toHaveLength(0);
    expect(marks[0].hasAttribute('data-selected')).toBe(true);

    // the arrow keys step through changes, past the newest back to live
    fireEvent.keyDown(timeline, { key: 'ArrowRight' });
    expect(panel.getAllByText('"Two"').length).toBeGreaterThan(0);
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    fireEvent.keyDown(timeline, { key: 'ArrowRight' });
    expect(panel.getByText(/^Live\./)).toBeTruthy();
    fireEvent.keyDown(timeline, { key: 'ArrowLeft' });
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    // and so does the snapshot bar's ›
    fireEvent.click(panel.getByRole('button', { name: 'Next change' }));
    expect(panel.getByText(/^Live\./)).toBeTruthy();

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

    // the strip stays above the Actions tab, without State's view switch
    fireEvent.click(screen.getByRole('tab', { name: /Actions/ }));
    expect(screen.getByRole('group', { name: /^Timeline/ })).toBe(timeline);
    expect(screen.queryByRole('group', { name: 'Store view' })).toBeNull();
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    // toggled off, the bar stays while a moment is set
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Live' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(screen.getByText(/^Live\./)).toBeTruthy();
  });

  it('slides the strip shut, letting go of it once the slide ends', async () => {
    mount();
    const toggle = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    toggle();
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    // the box mounts shut and opens a frame later, so it slides open
    const box = revealBox(timeline);
    expect(box.hasAttribute('data-open')).toBe(false);
    await nextFrame();
    expect(box.hasAttribute('data-open')).toBe(true);
    // the live bar slides in its own box, in step with it
    const live = screen.getByText(/^Live\./);
    const bar = barBox(live);
    expect(bar).not.toBe(box);
    expect(bar.hasAttribute('data-open')).toBe(true);
    toggle();
    // still there for the slide, but neither focusable nor announced
    expect(timeline.isConnected).toBe(true);
    expect(live.isConnected).toBe(true);
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    expect(screen.queryByText(/^Live\./)).toBe(live);
    expect(screen.queryByRole('button', { name: 'Next change' })).toBeNull();
    for (const el of [box, bar]) {
      expect(el.hasAttribute('data-open')).toBe(false);
      expect(el.hasAttribute('inert')).toBe(true);
    }
    // reopened mid-slide, it turns around from where it is: no snap shut
    toggle();
    expect(box.hasAttribute('inert')).toBe(false);
    await nextFrame();
    expect(box.hasAttribute('data-open')).toBe(true);
    expect(screen.getByRole('group', { name: /^Timeline/ })).toBe(timeline);
    toggle();
    fireEvent.transitionEnd(box);
    expect(timeline.isConnected).toBe(false);
    // the bar stays, for the next moment
    expect(live.isConnected).toBe(true);
  });

  it('lets go of the strip once its slide must be over, should its end go unseen', () => {
    jest.useFakeTimers();
    try {
      mount();
      const toggle = () =>
        fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
      toggle();
      const timeline = screen.getByRole('group', { name: /^Timeline/ });
      // flipped shut and open again before the slide ends: it stays
      toggle();
      toggle();
      act(() => jest.runOnlyPendingTimers());
      expect(screen.getByRole('group', { name: /^Timeline/ })).toBe(timeline);
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

  it('keeps the snapshot bar out of the strip’s box, so it stays as the strip shuts', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    const box = revealBox(timeline);
    fireEvent.click(
      within(timeline).getByRole('button', { name: /^setResponse at/ }),
    );
    const live = screen.getByRole('button', { name: 'Live' });
    expect(box.contains(live)).toBe(false);
    const bar = barBox(live);
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(screen.getByRole('button', { name: 'Live' })).toBe(live);
    expect(bar.hasAttribute('inert')).toBe(false);
    fireEvent.transitionEnd(box);
    expect(timeline.isConnected).toBe(false);
    expect(screen.getByRole('button', { name: 'Live' })).toBe(live);
    // back to live, the bar slides shut saying what it did until it is
    fireEvent.click(live);
    expect(bar.hasAttribute('inert')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(live.isConnected).toBe(true);
    fireEvent.transitionEnd(bar);
    expect(live.isConnected).toBe(false);
    expect(screen.queryByText('After')).toBeNull();
  });

  it('keeps focus on the bar’s ‹ as it steps from live under the open strip', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const previous = screen.getByRole('button', { name: 'Previous change' });
    previous.focus();
    fireEvent.click(previous);
    expect(screen.getByText('After')).toBeTruthy();
    expect(document.activeElement).toBe(previous);
    fireEvent.click(screen.getByRole('button', { name: 'Next change' }));
    expect(screen.getByText(/^Live\./)).toBeTruthy();
    expect(document.activeElement).toBe(previous);
  });

  it('says when earlier actions of a lane are no longer kept, as the list does', async () => {
    const { ctrl } = mount();
    await act(async () => {
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '1' }, { id: '1', title: `t${i}` });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(
      screen.getByRole('img', {
        name: '4 earlier sets not kept: the log keeps the newest',
      }),
    ).toBeTruthy();
  });

  it('offers no History on a lane whose dropped actions changed nothing', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    expect(
      within(timeline).getByRole('img', { name: /earlier polls not kept/ }),
    ).toBeTruthy();
    // none of them, nor what the log kept, stored the endpoint
    expect(
      within(timeline).queryByRole('button', { name: 'History' }),
    ).toBeNull();
  });

  it('stays on a picked action as new ones come in', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
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

  it('stays on the newest until scrolled back, as live', async () => {
    // shown with a height from the start, as a browser lays it out
    const height = jest
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(100);
    const { ctrl } = mount();
    let timeline: HTMLElement;
    try {
      await act(() => ctrl().fetch(getPosts));
      fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
      timeline = screen.getByRole('group', { name: /^Timeline/ });
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

  it('keeps the lane labels beside their tracks as either scrolls', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
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

  it('scrolls in the detailed spacing, fitting the whole history on demand', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
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

  it('moves focus to the tab as "Live" hides the bar under the shut strip', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    fireEvent.click(
      within(timeline).getByRole('button', { name: /^setResponse at/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    fireEvent.transitionEnd(revealBox(timeline));
    const live = screen.getByRole('button', { name: 'Live' });
    live.focus();
    expect(document.activeElement).toBe(live);
    fireEvent.click(live);
    expect(barBox(live).hasAttribute('inert')).toBe(true);
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'State' }),
    );
  });

  it('keeps focus in the bar as "Live" goes under the open strip', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    fireEvent.click(
      within(timeline).getByRole('button', { name: /^setResponse at/ }),
    );
    const live = screen.getByRole('button', { name: 'Live' });
    live.focus();
    fireEvent.click(live);
    expect(screen.queryByRole('button', { name: 'Live' })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Previous change' }),
    );
  });

  it('slides the action the bar opens into a first-shown Actions tab', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    fireEvent.click(
      within(timeline).getByRole('button', { name: /^setResponse at/ }),
    );
    fireEvent.click(screen.getByTitle('Open action'));
    const level = document.activeElement as HTMLElement;
    expect(level.hasAttribute('data-level')).toBe(true);
    expect(level.hasAttribute('data-covered')).toBe(false);
    expect(level.querySelector('[aria-current="page"]')).toBeTruthy();
  });

  it('opens an endpoint lane’s History on the State tab', async () => {
    const { ctrl } = mount();
    title = 'One';
    await act(() => ctrl().fetch(getPosts));
    title = 'Two';
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
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

  it('keeps the bar on the Actions tab, stepping the same moment', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('tab', { name: /Actions/ }));
    const row = [
      ...document.querySelectorAll<HTMLElement>('[aria-expanded]'),
    ].find(el => !el.closest('[hidden]'))!;
    fireEvent.click(row);
    fireEvent.click(
      screen.getAllByText('setResponse')[0].closest('[role="button"]')!,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'View State after this' }),
    );
    expect(screen.getByText('After')).toBeTruthy();

    // the same bar on every tab
    fireEvent.click(screen.getByRole('tab', { name: /Actions/ }));
    expect(screen.getByText('After')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(screen.getByText('After')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    expect(screen.getByText('After')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.queryByText('After')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: /Actions/ }));
    expect(screen.queryByText('After')).toBeNull();
  });
});
