import { Endpoint, Entity } from '@data-client/endpoint';
import { jest } from '@jest/globals';

import { ExpiryStatus } from '../..';
import Controller from '../../controller/Controller';
import type { ActionTypes, State } from '../../types';
import { GCPolicy } from '../GCPolicy';
import createReducer, { initialState } from '../reducer/createReducer';

/** Characterization of today's GC deletion model, not a statement of
 * desired behavior.
 *
 * GCPolicy counts references per mounted consumer. An endpoint result that
 * was written but never counted (prefetch, `controller.set*`, hydration) is
 * never queued, so it survives. An entity it names can still be swept when
 * a different consumer releases it. The surviving result then denormalizes
 * without that entity while its expiry stays `Valid`, so nothing refetches.
 *
 * See plans/gc-handoff.md, decision 1 ("What is a GC root").
 */
describe('GCPolicy deletes entities still named by uncounted endpoints', () => {
  class Article extends Entity {
    id = 0;
    title = '';
  }
  const getList = new Endpoint(() => Promise.resolve(), {
    key: () => 'articles',
    schema: [Article],
  });
  const getDetail = new Endpoint((_: { id: number }) => Promise.resolve(), {
    key: ({ id }) => `article ${id}`,
    schema: Article,
  });

  let state: State<unknown>;
  let controller: Controller;
  let gcPolicy: GCPolicy;
  const now = 1_000_000;

  beforeEach(() => {
    jest.useFakeTimers({ now });
    const reducer = createReducer(new Controller());
    state = initialState;
    gcPolicy = new GCPolicy({ expiresAt: () => 0 });
    controller = new Controller({
      gcPolicy,
      getState: () => state,
      dispatch: (action: ActionTypes) => {
        state = reducer(state, action);
        return Promise.resolve();
      },
    });
    gcPolicy.init(controller);

    // list is written but never mounted; detail 1 is written too
    controller.setResponse(getList, [
      { id: 1, title: 'one' },
      { id: 2, title: 'two' },
    ]);
    controller.setResponse(getDetail, { id: 1 }, { id: 1, title: 'one' });
  });

  afterEach(() => {
    gcPolicy.cleanup();
    jest.useRealTimers();
  });

  function mountDetailThenUnmountAndSweep() {
    const meta = controller.getResponseMeta(getDetail, { id: 1 }, state);
    const release = meta.countRef();
    release();
    gcPolicy['runSweep']();
  }

  it('list shrinks and stays Valid after a detail consumer releases an entity', () => {
    expect(controller.getResponseMeta(getList, state).data).toHaveLength(2);

    mountDetailThenUnmountAndSweep();

    expect(state.entities[Article.key]?.['1']).toBeUndefined();
    expect(state.endpoints[getList.key()]).toEqual(['1', '2']);

    const list = controller.getResponseMeta(getList, state);
    expect(list.data).toEqual([expect.objectContaining({ id: 2 })]);
    expect(list.expiryStatus).toBe(ExpiryStatus.Valid);
  });

  it('a surviving detail result is undefined and still Valid after a list consumer releases its entity', () => {
    const meta = controller.getResponseMeta(getList, state);
    meta.countRef()();
    gcPolicy['runSweep']();

    expect(state.endpoints[getList.key()]).toBeUndefined();
    expect(state.entities[Article.key]?.['1']).toBeUndefined();
    expect(state.endpoints[getDetail.key({ id: 1 })]).toBe('1');

    const detail = controller.getResponseMeta(getDetail, { id: 1 }, state);
    expect(detail.data).toBeUndefined();
    expect(detail.expiryStatus).toBe(ExpiryStatus.Valid);
  });
});
