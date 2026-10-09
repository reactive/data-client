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
import StorePanel from '../store/StorePanel';
import { lanesOf, timeScale } from '../store/Timeline';

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

describe('Store Timeline tab', () => {
  it('keeps its scroller from before the first action, so it follows from it', async () => {
    const { ctrl } = mount();
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
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

    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    const panel = within(timeline.parentElement!);
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
    Object.defineProperty(timeline, 'scrollWidth', { value: 900 });
    fireEvent.click(marks[0]);
    timeline.scrollLeft = 0;
    fireEvent.keyDown(timeline, { key: 'Escape' });
    expect(timeline.scrollLeft).toBe(900);
    // live already, End still brings the newest back
    timeline.scrollLeft = 0;
    fireEvent.keyDown(timeline, { key: 'End' });
    expect(timeline.scrollLeft).toBe(900);
    fireEvent.keyDown(timeline, { key: 'ArrowLeft' });

    // State shows the same moment
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    expect(screen.getAllByRole('button', { name: 'Live' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByText(/^Live\./)).toBeTruthy();

    // the Actions tab is the list alone, without State's view switch
    fireEvent.click(screen.getByRole('tab', { name: /Actions/ }));
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Store view' })).toBeNull();
  });

  it('says when earlier actions of a lane are no longer kept, as the list does', async () => {
    const { ctrl } = mount();
    await act(async () => {
      for (let i = 0; i < 25; i++)
        await ctrl().set(Post, { id: '1' }, { id: '1', title: `t${i}` });
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(
      screen.getByRole('img', {
        name: '4 earlier sets not kept: the log keeps the newest',
      }),
    ).toBeTruthy();
  });

  it('stays on a picked action as new ones come in', async () => {
    const { ctrl } = mount();
    await act(() => ctrl().fetch(getPosts));
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    Object.defineProperty(timeline, 'clientHeight', { value: 100 });
    Object.defineProperty(timeline, 'scrollWidth', { value: 900 });
    const [mark] = within(timeline).getAllByRole('button', {
      name: /^setResponse at/,
    });
    fireEvent.click(mark);
    timeline.scrollLeft = 0;
    await act(() => ctrl().fetch(getPosts));
    expect(timeline.scrollLeft).toBe(0);
    // back to live, it follows again
    fireEvent.keyDown(timeline, { key: 'Escape' });
    timeline.scrollLeft = 0;
    await act(() => ctrl().fetch(getPosts));
    expect(timeline.scrollLeft).toBe(900);
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
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByText('After')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    expect(screen.getByText('After')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.queryByText('After')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: /Actions/ }));
    expect(screen.queryByText('After')).toBeNull();
  });
});
