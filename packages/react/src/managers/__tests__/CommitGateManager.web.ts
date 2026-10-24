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

  it('drops held results on a RESET before mount', async () => {
    const gate = new CommitGateManager();
    const { controller, reduced, mount } = bind(gate);
    const held = controller.dispatch(setResponse());
    void controller.dispatch(actions.createReset());
    mount();
    await held;
    expect(reduced).toHaveBeenCalledTimes(1);
    expect(reduced.mock.calls[0][0]).toMatchObject({ type: 'rdc/reset' });
  });

  it('rejects the held promise when its replay fails', async () => {
    const gate = new CommitGateManager();
    const discarded = bind(gate);
    const held = discarded.controller.dispatch(setResponse());
    const committed = bind(gate);
    const failure = new Error('replay failed');
    committed.reduced.mockImplementationOnce(() => Promise.reject(failure));
    committed.mount();
    await expect(held).rejects.toBe(failure);
  });

  it('shows a replay that throws as that fetch error, and replays the rest', async () => {
    const gate = new CommitGateManager();
    const discarded = bind(gate);
    const first = discarded.controller.dispatch(setResponse());
    const second = discarded.controller.dispatch(setResponse());
    const committed = bind(gate);
    const failure = new Error('middleware threw');
    committed.reduced.mockImplementationOnce(() => {
      throw failure;
    });
    committed.mount();
    await first;
    await second;
    const reduced = committed.reduced.mock.calls.map(([action]) => action);
    // the call that threw, then its error, then the next result
    expect(reduced).toHaveLength(3);
    expect(reduced[1]).toMatchObject({ error: true, response: failure });
    expect(reduced[2]).toMatchObject({ error: false, response: 5 });
  });

  it('swallows a throw while replaying a held error, like a mounted provider', async () => {
    const gate = new CommitGateManager();
    const discarded = bind(gate);
    const held = discarded.controller.dispatch(
      actions.createSetResponse(endpoint, {
        args: [],
        response: new Error('fetch failed'),
        fetchedAt: Date.now(),
        error: true,
      }),
    );
    const committed = bind(gate);
    const failure = new Error('middleware threw');
    committed.reduced.mockImplementationOnce(() => {
      throw failure;
    });
    committed.mount();
    await expect(held).resolves.toBeUndefined();
    expect(committed.reduced).toHaveBeenCalledTimes(1);
  });

  it('keeps replaying when publishing the error also throws', async () => {
    const gate = new CommitGateManager();
    const discarded = bind(gate);
    const first = discarded.controller.dispatch(setResponse());
    const second = discarded.controller.dispatch(setResponse());
    const committed = bind(gate);
    committed.reduced
      .mockImplementationOnce(() => {
        throw new Error('middleware threw');
      })
      .mockImplementationOnce(() => {
        throw new Error('error publish threw');
      });
    committed.mount();
    await first;
    await second;
    expect(committed.reduced).toHaveBeenCalledTimes(3);
    expect(committed.reduced.mock.calls[2][0]).toMatchObject({ response: 5 });
  });
});
