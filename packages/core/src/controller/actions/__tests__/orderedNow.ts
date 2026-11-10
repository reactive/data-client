import { ArticleResource, OptimisticArticleResource } from '__tests__/new';

import { Controller } from '../../..';
import createReducer, {
  initialState,
} from '../../../state/reducer/createReducer';
import type { FetchAction, State } from '../../../types';
import { createFetch } from '../createFetch';
import { createReset } from '../createReset';
import { createSetResponse } from '../createSetResponse';
import { orderedNow } from '../orderedNow';

afterEach(() => {
  jest.useRealTimers();
});

describe('orderedNow()', () => {
  it('keeps calls in one millisecond in order', () => {
    jest.useFakeTimers({ now: 1000 });
    const times = Array.from({ length: 3000 }, () => orderedNow());
    expect(times[0]).toBe(1000);
    expect(times.findIndex((t, i) => i > 0 && t <= times[i - 1])).toBe(-1);
  });

  it('returns Date.now() once the clock passes earlier calls', () => {
    jest.useFakeTimers({ now: 10000 });
    orderedNow();
    orderedNow();
    jest.advanceTimersByTime(1);
    expect(orderedNow()).toBe(10001);
  });

  it('restarts from Date.now() when the clock is set back', () => {
    jest.useFakeTimers({ now: 5000 });
    orderedNow();
    jest.setSystemTime(1000);
    expect(orderedNow()).toBe(1000);
  });
});

describe('actions in one millisecond', () => {
  const reducer = createReducer(new Controller());
  /** Reduces the response to a fetch action */
  const settle = (state: State<unknown>, action: FetchAction, response: any) =>
    reducer(
      state,
      createSetResponse(action.endpoint, {
        args: action.args,
        response,
        fetchedAt: action.meta.fetchedAt,
      }),
    );

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000 });
  });

  it('a create adds an item once to a list fetched after it, whose response already has it', () => {
    const body = { title: 'new' };
    const create = createFetch(ArticleResource.getList.unshift, {
      args: [body],
    });
    const list = createFetch(ArticleResource.getList, { args: [] });
    let state = settle(initialState, list, [{ id: 2, ...body }, { id: 1 }]);
    state = settle(state, create, { id: 2, ...body });
    expect(
      state.entities[ArticleResource.getList.schema.key as string],
    ).toEqual({ '{}': ['2', '1'] });
  });

  it('drops a reply to a fetch started before a reset, and keeps one started after', () => {
    const before = createFetch(ArticleResource.get, { args: [{ id: 1 }] });
    let state = reducer(initialState, createReset());
    const after = createFetch(ArticleResource.get, { args: [{ id: 2 }] });
    state = settle(state, before, { id: 1 });
    state = settle(state, after, { id: 2 });
    expect(Object.keys(state.endpoints)).toEqual([after.key]);
  });

  it('a create reply settles only its own optimistic update', () => {
    const create = OptimisticArticleResource.getList.push;
    const first = createFetch(create, { args: [{ title: 'first' }] });
    const second = createFetch(create, { args: [{ title: 'second' }] });
    let state = reducer(reducer(initialState, first), second);
    expect(state.optimistic).toHaveLength(2);
    state = settle(state, first, { id: 1, title: 'first' });
    expect(state.optimistic.map(action => action.meta.fetchedAt)).toEqual([
      second.meta.fetchedAt,
    ]);
  });
});
