import { Controller, initialState } from '../..';
import { RESET, SET } from '../../actionTypes';
import DevToolsManager from '../DevtoolsManager.js';

const controllers = () =>
  (globalThis as any).__DC_CONTROLLERS__ as Map<string, Controller>;
const actionLogs = () =>
  (globalThis as any).__DC_ACTIONS__ as Map<string, unknown[]>;

function setup(manager: DevToolsManager, controller = new Controller()) {
  const next = jest.fn(() => Promise.resolve());
  const dispatch = manager.middleware(controller as any)(next);
  return { controller, dispatch, next };
}

const setAction = (i: number): any => ({ type: SET, value: i });

afterEach(() => {
  delete (globalThis as any).__DC_CONTROLLERS__;
  delete (globalThis as any).__DC_ACTIONS__;
});

describe('DevToolsManager', () => {
  describe('action log', () => {
    it('logs actions from startup without the extension', () => {
      const manager = new DevToolsManager({ name: 'App' });
      const { dispatch, next } = setup(manager);
      // dispatched before init, like the first fetches of a page load
      dispatch(setAction(1));
      manager.init(initialState);
      dispatch(setAction(2));

      expect(next).toHaveBeenCalledTimes(2);
      expect(actionLogs().get('App')).toEqual([setAction(1), setAction(2)]);
    });

    it('trims in place to maxBufferLength', () => {
      const manager = new DevToolsManager({ name: 'App', maxAge: 5 });
      const { dispatch } = setup(manager);
      manager.init(initialState);
      const log = actionLogs().get('App');
      for (let i = 0; i < 12; i++) dispatch(setAction(i));

      expect(actionLogs().get('App')).toBe(log);
      expect(log!.length).toBeLessThanOrEqual(10);
      expect(log!.at(-1)).toEqual(setAction(11));
    });

    it('skips actions skipLogging rejects', () => {
      const manager = new DevToolsManager(
        { name: 'App' },
        action => action.type === SET,
      );
      const { dispatch } = setup(manager);
      manager.init(initialState);
      dispatch(setAction(1));
      dispatch({ type: RESET, date: 0 } as any);

      expect(actionLogs().get('App')).toEqual([{ type: RESET, date: 0 }]);
    });
  });

  describe('registry', () => {
    it('registers controllers that share a name under distinct keys', () => {
      const a = new DevToolsManager({ name: 'App' });
      const b = new DevToolsManager({ name: 'App' });
      const c = new DevToolsManager({ name: 'App' });
      const { controller: ctrlA } = setup(a);
      const { controller: ctrlB, dispatch: dispatchB } = setup(b);
      const { controller: ctrlC } = setup(c);
      a.init(initialState);
      b.init(initialState);
      c.init(initialState);
      dispatchB(setAction(1));

      expect([...controllers().entries()]).toEqual([
        ['App', ctrlA],
        ['App (2)', ctrlB],
        ['App (3)', ctrlC],
      ]);
      expect(actionLogs().get('App')).toEqual([]);
      expect(actionLogs().get('App (2)')).toEqual([setAction(1)]);

      b.cleanup();
      expect([...controllers().keys()]).toEqual(['App', 'App (3)']);
      expect([...actionLogs().keys()]).toEqual(['App', 'App (3)']);
      a.cleanup();
      c.cleanup();
      expect(controllers().size).toBe(0);
      expect(actionLogs().size).toBe(0);
    });

    it('keeps its key when init runs again (StrictMode remount)', () => {
      const manager = new DevToolsManager({ name: 'App' });
      const { controller } = setup(manager);
      manager.init(initialState);
      manager.init(initialState);
      expect([...controllers().entries()]).toEqual([['App', controller]]);

      manager.cleanup();
      manager.init(initialState);
      expect([...controllers().entries()]).toEqual([['App', controller]]);
    });

    it('cleanup leaves a controller registered by another manager', () => {
      const manager = new DevToolsManager({ name: 'App' });
      setup(manager);
      // cleanup before init has nothing to remove
      manager.cleanup();
      manager.init(initialState);
      const other = new Controller();
      controllers().set('App', other);
      manager.cleanup();
      expect(controllers().get('App')).toBe(other);
      expect(actionLogs().has('App')).toBe(true);
    });
  });
});
