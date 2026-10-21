import {
  Controller,
  actions,
  initManager,
  initialState,
} from '@data-client/core';
import type { Middleware } from '@data-client/core';
import { Endpoint } from '@data-client/endpoint';

import { CommitGateManager } from '..';

const endpoint = new Endpoint(() => Promise.resolve(5), { name: 'gated' });

function setResponse() {
  return actions.createSetResponse(endpoint, {
    args: [],
    response: 5,
    fetchedAt: Date.now(),
  });
}

function bind(gate: CommitGateManager) {
  const reduced = jest.fn((_action: unknown) => Promise.resolve());
  const controller = new Controller();
  // like a provider's render, which builds its middleware chain once
  const dispatch = (gate.middleware as Middleware)(controller)(reduced);
  controller.bindMiddleware({ dispatch, getState: () => initialState });
  return {
    controller,
    reduced,
    mount: initManager([gate], controller, initialState),
  };
}

describe('CommitGateManager', () => {
  it('holds results until init(), then replays them into the mounted store', async () => {
    const gate = new CommitGateManager();
    const discarded = bind(gate);
    const held = discarded.controller.dispatch(setResponse());
    const committed = bind(gate);
    committed.mount();
    expect(committed.reduced).not.toHaveBeenCalled();
    await held;
    expect(discarded.reduced).not.toHaveBeenCalled();
    expect(committed.reduced).toHaveBeenCalledTimes(1);
  });

  it('passes other actions and results once mounted', () => {
    const gate = new CommitGateManager();
    const { controller, reduced, mount } = bind(gate);
    void controller.dispatch(actions.createReset());
    mount();
    void controller.dispatch(setResponse());
    expect(reduced).toHaveBeenCalledTimes(2);
  });

  it('keeps holding when unmounted before the replay', async () => {
    const gate = new CommitGateManager();
    const { controller, reduced, mount } = bind(gate);
    void controller.dispatch(setResponse());
    mount()();
    await Promise.resolve();
    expect(reduced).not.toHaveBeenCalled();
    mount();
    await Promise.resolve();
    expect(reduced).toHaveBeenCalledTimes(1);
  });

  it('drops held results on RESET', async () => {
    const gate = new CommitGateManager();
    const discarded = bind(gate);
    const held = discarded.controller.dispatch(setResponse());
    const committed = bind(gate);
    committed.mount();
    void committed.controller.dispatch(actions.createReset());
    await held;
    expect(committed.reduced).toHaveBeenCalledTimes(1);
    expect(committed.reduced.mock.calls[0][0]).toMatchObject({
      type: 'rdc/reset',
    });
  });
});
