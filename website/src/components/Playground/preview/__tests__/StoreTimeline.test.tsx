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
  return { ctrl: () => ref.ctrl!, history: () => registry.log.history(0) };
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

describe('Store Actions timeline', () => {
  it('shows State as it was after the action picked on the timeline', async () => {
    const { ctrl } = mount();
    title = 'One';
    await act(() => ctrl().fetch(getPosts));
    title = 'Two';
    await act(() => ctrl().fetch(getPosts));

    fireEvent.click(screen.getByRole('tab', { name: /Actions/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Timeline view' }));
    const timeline = screen.getByRole('group', { name: /^Timeline/ });
    // the timeline's tab panel; State's stays mounted, hidden
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

    // the arrow keys step through them, past the newest back to live
    fireEvent.keyDown(timeline, { key: 'ArrowRight' });
    expect(panel.getAllByText('"Two"').length).toBeGreaterThan(0);
    expect(marks[1].hasAttribute('data-selected')).toBe(true);
    fireEvent.keyDown(timeline, { key: 'ArrowRight' });
    expect(panel.getByText(/^Live\./)).toBeTruthy();
    fireEvent.keyDown(timeline, { key: 'ArrowLeft' });
    expect(marks[1].hasAttribute('data-selected')).toBe(true);

    // State shows the same moment
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    expect(screen.getAllByRole('button', { name: 'Live' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    fireEvent.click(screen.getByRole('tab', { name: /Actions/ }));
    expect(screen.getByText(/^Live\./)).toBeTruthy();

    // and back to the list
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.queryByRole('group', { name: /^Timeline/ })).toBeNull();
  });
});
