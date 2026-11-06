import Controller from '../../controller/Controller';
import { Manager } from '../../types';
import applyManager from '../applyManager';
import createManagers from '../createManagers';
import initManager from '../initManager';
import NetworkManager from '../NetworkManager';

/** Binds `managers` to a new store, like a DataProvider render */
function bind(managers: Manager[], controller = new Controller()) {
  applyManager(managers, controller).forEach(mw =>
    mw({ getState: controller.getState, dispatch: () => Promise.resolve() }),
  );
  return controller;
}

describe('createManagers()', () => {
  it('calls a function once for each store', () => {
    const factory = jest.fn(() => [new NetworkManager()]);
    const first = createManagers(factory, () => []);
    const second = createManagers(factory, () => []);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(first[0]).not.toBe(second[0]);
  });

  it('returns the defaults when managers are not given', () => {
    const defaults = [new NetworkManager()];
    expect(createManagers(undefined, () => defaults)).toBe(defaults);
  });

  it('returns an array as given', () => {
    const managers = [new NetworkManager()];
    expect(createManagers(managers, () => [])).toBe(managers);
  });
});

describe('initManager()', () => {
  it("passes the store's current state to init(), including on resume", () => {
    const init = jest.fn();
    const manager: Manager = { middleware: () => next => next, init, cleanup() {} };
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

describe('Manager shared by two stores', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('warns once when a started store hands its Managers to another store', () => {
    const managers = [new NetworkManager()];
    // a store React discards before it starts, like a StrictMode render
    bind(managers);
    const kept = bind(managers);
    // binding the same store again, like a re-render
    bind(managers, kept);
    expect(warn).not.toHaveBeenCalled();

    initManager(managers, kept)();
    // a remount with the same managers
    bind(managers);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch('is used by more than one store');

    initManager(managers, bind(managers))();
    bind(managers);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
