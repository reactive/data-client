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

  it('works without a NetworkManager', async () => {
    // applyManager() warns that NetworkManager is missing
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { recorder, types } = makeRecorder();
    const { controller, allSettled } = renderDataHook(() => useController(), {
      managers: () => [recorder],
    });

    await controller.setResponse(getValue, { id: 2 }, { id: 2 });
    expect(types).toContain(actionTypes.SET_RESPONSE);
    expect(allSettled()).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('NetworkManager not found'),
    );
    warn.mockRestore();
  });

  it('calls the factory once per renderDataHook() call', () => {
    const managers = jest.fn(() => [new NetworkManager()]);
    renderDataHook(() => useController(), { managers });
    renderDataHook(() => useController(), { managers });
    expect(managers).toHaveBeenCalledTimes(2);
  });
});
