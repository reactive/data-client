import Controller from '../../controller/Controller';
import { Manager } from '../../types';
import initManager from '../initManager';

describe('initManager()', () => {
  it("passes the store's current state to init(), including on resume", () => {
    const init = jest.fn();
    const manager: Manager = {
      middleware: () => next => next,
      init,
      cleanup() {},
    };
    const controller = new Controller();
    let state: any = { entities: {}, version: 1 };
    controller.getState = () => state;
    const effect = initManager([manager], controller);
    const cleanup = effect();
    expect(init).toHaveBeenLastCalledWith(state);
    cleanup();
    state = { ...state, version: 2 };
    effect();
    expect(init).toHaveBeenLastCalledWith(state);
  });
});
