import { actions, initManager, initialState } from '@data-client/core';
import type { Middleware, State } from '@data-client/core';
import { Endpoint } from '@data-client/endpoint';

import ClientStore from '../ClientStore';

const endpoint = new Endpoint((id: number) => Promise.resolve(id), {
  name: 'stored',
});

function setResponse(id: number) {
  return actions.createSetResponse(endpoint, {
    args: [id],
    response: id,
    fetchedAt: Date.now(),
  });
}

// like a provider's render: binds the controller, then builds the chain once
function bind(store: ClientStore) {
  const { controller } = store;
  let mountedState: State<unknown> = store.state;
  const reduced = jest.fn((action: any) => {
    mountedState = store.reducer(mountedState, action);
    return Promise.resolve();
  });
  controller.bindMiddleware({
    dispatch: (action: any) => dispatch(action),
    getState: () => mountedState,
  });
  const dispatch = (store.middleware as Middleware)(controller)(reduced);
  const seed = store.state;
  return {
    reduced,
    getMounted: () => mountedState,
    mount: initManager([store], controller, seed),
  };
}

const has = (state: State<unknown>, id: number) =>
  !!state.endpoints[endpoint.key(id)];

describe('ClientStore', () => {
  it('reduces results before mount, and the provider that mounts starts from them', async () => {
    const store = new ClientStore({ managers: [] });
    const discarded = bind(store);
    let settled = false;
    void store.controller.dispatch(setResponse(1)).then(() => (settled = true));
    expect(has(store.state, 1)).toBe(true);
    expect(store.controller.getState()).toBe(store.state);
    expect(discarded.reduced).not.toHaveBeenCalled();

    const committed = bind(store);
    expect(has(committed.getMounted(), 1)).toBe(true);
    await Promise.resolve();
    // stays in flight until mount, so a shown render reuses the fetch
    expect(settled).toBe(false);
    committed.mount();
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(true);
    // nothing to catch up on
    expect(committed.reduced).not.toHaveBeenCalled();
  });

  it('catches up on results that settle after the mounting render', async () => {
    const store = new ClientStore({ managers: [] });
    const committed = bind(store);
    void store.controller.dispatch(setResponse(2));
    expect(has(committed.getMounted(), 2)).toBe(false);
    committed.mount();
    expect(committed.reduced).toHaveBeenCalledTimes(1);
    expect(has(committed.getMounted(), 2)).toBe(true);
  });

  it('passes actions through once mounted', () => {
    const store = new ClientStore({ managers: [] });
    const { reduced, mount } = bind(store);
    mount();
    void store.controller.dispatch(setResponse(3));
    expect(reduced).toHaveBeenCalledTimes(1);
    expect(store.state).toBe(initialState);
  });

  it('drops earlier results on a RESET before mount', () => {
    const store = new ClientStore({ managers: [] });
    bind(store);
    void store.controller.dispatch(setResponse(4));
    void store.controller.dispatch(actions.createReset());
    expect(has(store.state, 4)).toBe(false);
    const committed = bind(store);
    committed.mount();
    expect(has(committed.getMounted(), 4)).toBe(false);
  });

  it('keeps the latest state after unmount for the next provider', () => {
    const store = new ClientStore({ managers: [] });
    const first = bind(store);
    const unmount = first.mount();
    void store.controller.dispatch(setResponse(5));
    unmount();
    expect(has(store.state, 5)).toBe(true);
    const second = bind(store);
    expect(has(second.getMounted(), 5)).toBe(true);
  });
});
