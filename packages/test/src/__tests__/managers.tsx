import { Endpoint } from '@data-client/endpoint';
import { actionTypes, NetworkManager, useController } from '@data-client/react';
import type { Manager } from '@data-client/react';

import { renderDataHook } from '..';

const getValue = new Endpoint(
  ({ id }: { id: number }) => Promise.resolve({ id }),
  { name: 'getValue' },
);

function makeRecorder() {
  const types: string[] = [];
  const recorder: Manager = {
    middleware: () => next => action => {
      types.push(action.type);
      return next(action);
    },
    cleanup: jest.fn(),
  };
  return { recorder, types };
}

describe('renderDataHook() managers', () => {
  it('runs the managers it returns', async () => {
    const { recorder, types } = makeRecorder();
    const { controller, cleanup } = renderDataHook(() => useController(), {
      managers: () => [recorder, new NetworkManager()],
    });

    await expect(controller.fetch(getValue, { id: 1 })).resolves.toEqual({
      id: 1,
    });
    expect(types).toContain(actionTypes.FETCH);
    expect(types).toContain(actionTypes.SET_RESPONSE);

    cleanup();
    expect(recorder.cleanup).toHaveBeenCalled();
  });

  it('requires a NetworkManager', () => {
    const { recorder } = makeRecorder();
    expect(() =>
      renderDataHook(() => useController(), { managers: () => [recorder] }),
    ).toThrow('managers must include a NetworkManager');
    expect(recorder.cleanup).toHaveBeenCalled();
  });

  it('calls the factory once per renderDataHook() call', () => {
    const managers = jest.fn(() => [new NetworkManager()]);
    renderDataHook(() => useController(), { managers });
    renderDataHook(() => useController(), { managers });
    expect(managers).toHaveBeenCalledTimes(2);
  });
});
