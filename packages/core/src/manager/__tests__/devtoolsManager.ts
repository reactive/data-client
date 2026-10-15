import { Controller, initialState } from '../..';
import {
  FETCH,
  RESET,
  SET,
  SET_RESPONSE,
  SUBSCRIBE,
  UNSUBSCRIBE,
} from '../../actionTypes';
import DevToolsManager from '../DevtoolsManager.js';

const controllers = () =>
  (globalThis as any).__DC_CONTROLLERS__ as Map<string, Controller>;
const actionLogs = () =>
  (globalThis as any).__DC_ACTIONS__ as Map<string, any[]>;

function setup(manager: DevToolsManager, controller = new Controller()) {
  const next = jest.fn(() => Promise.resolve());
  const dispatch = manager.middleware(controller as any)(next);
  return { controller, dispatch, next };
}

const setAction = (i: number): any => ({ type: SET, value: i });
const typesAndKeys = () =>
  actionLogs()
    .get('App')!
    .map(a => [a.type, a.key]);
const pollEndpoint = { name: 'poll', pollFrequency: 1000 };
const subscribe = (key: string): any => ({
  type: SUBSCRIBE,
  key,
  endpoint: pollEndpoint,
  args: [],
});
const unsubscribe = (key: string): any => ({
  ...subscribe(key),
  type: UNSUBSCRIBE,
});
const fetchAction = (key: string, i: number): any => ({
  type: FETCH,
  key,
  endpoint: pollEndpoint,
  args: [i],
  meta: { fetchedAt: i, promise: Promise.resolve(), resolve() {}, reject() {} },
});
const responseAction = (key: string, i: number): any => ({
  type: SET_RESPONSE,
  key,
  endpoint: pollEndpoint,
  args: [i],
  response: { i },
  meta: { fetchedAt: i, date: i, expiresAt: i },
});

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

    it('starts a fresh log when reused for another store', () => {
      const manager = new DevToolsManager({ name: 'App' });
      const { dispatch } = setup(manager);
      manager.init(initialState);
      dispatch(setAction(1));
      manager.cleanup();
      const { dispatch: dispatch2 } = setup(manager);
      manager.init(initialState);
      dispatch2(setAction(2));
      expect(actionLogs().get('App')).toEqual([setAction(2)]);
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

  describe('summaries', () => {
    it('drops payloads from all but the newest 20 actions', () => {
      const manager = new DevToolsManager({ name: 'App' });
      const { dispatch } = setup(manager);
      manager.init(initialState);
      dispatch(fetchAction('a', 1));
      dispatch({
        ...responseAction('a', 2),
        error: true,
        response: { message: 'boom' },
      });
      dispatch(responseAction('a', 3));
      for (let i = 0; i < 20; i++) dispatch(setAction(i));
      const log = actionLogs().get('App')!;

      expect(log.slice(0, 3)).toEqual([
        {
          type: FETCH,
          key: 'a',
          endpoint: pollEndpoint,
          meta: { fetchedAt: 1 },
        },
        {
          type: SET_RESPONSE,
          key: 'a',
          endpoint: pollEndpoint,
          error: true,
          response: { message: 'boom' },
          meta: { fetchedAt: 2, date: 2, expiresAt: 2 },
        },
        {
          type: SET_RESPONSE,
          key: 'a',
          endpoint: pollEndpoint,
          meta: { fetchedAt: 3, date: 3, expiresAt: 3 },
        },
      ]);
      expect(log.slice(3)).toEqual(
        Array.from({ length: 20 }, (_, i) => setAction(i)),
      );
    });
  });

  describe('polling', () => {
    function pollingDispatch() {
      const manager = new DevToolsManager({
        name: 'App',
        maxPollingActions: 2,
      });
      const { dispatch } = setup(manager);
      manager.init(initialState);
      return dispatch;
    }

    it('keeps only the latest maxPollingActions for a polling key', () => {
      const dispatch = pollingDispatch();
      dispatch(subscribe('a'));
      dispatch(subscribe('a'));
      dispatch(setAction(0));
      for (let i = 1; i <= 3; i++) {
        dispatch(fetchAction('a', i));
        dispatch(responseAction('a', i));
      }
      dispatch(fetchAction('b', 9));

      expect(typesAndKeys()).toEqual([
        [SET, undefined],
        [FETCH, 'a'],
        [SET_RESPONSE, 'a'],
        [FETCH, 'b'],
      ]);
      expect(actionLogs().get('App')![1].args).toEqual([3]);
    });

    it('trims actions logged before polling started', () => {
      const dispatch = pollingDispatch();
      for (let i = 1; i <= 3; i++) {
        dispatch(fetchAction('a', i));
        dispatch(responseAction('a', i));
      }
      dispatch(subscribe('a'));
      dispatch(fetchAction('a', 4));

      expect(typesAndKeys()).toEqual([
        [SUBSCRIBE, 'a'],
        [FETCH, 'a'],
      ]);
    });

    it('holds the cap across unsubscribe and resubscribe', () => {
      const dispatch = pollingDispatch();
      for (let cycle = 0; cycle < 3; cycle++) {
        dispatch(subscribe('a'));
        for (let i = 1; i <= 3; i++) {
          dispatch(fetchAction('a', i));
          dispatch(responseAction('a', i));
        }
        dispatch(unsubscribe('a'));
        dispatch(fetchAction('a', 9));
        dispatch(responseAction('a', 9));
      }
      dispatch(subscribe('a'));
      dispatch(fetchAction('a', 10));
      dispatch(responseAction('a', 10));

      expect(typesAndKeys()).toEqual([
        [FETCH, 'a'],
        [SET_RESPONSE, 'a'],
      ]);
    });

    it('tracks polling even when skipLogging hides subscribes', () => {
      const manager = new DevToolsManager(
        { name: 'App', maxPollingActions: 2 },
        action => action.type === SUBSCRIBE,
      );
      const { dispatch } = setup(manager);
      manager.init(initialState);
      dispatch(subscribe('a'));
      for (let i = 1; i <= 3; i++) dispatch(fetchAction('a', i));
      expect(typesAndKeys()).toEqual([
        [FETCH, 'a'],
        [FETCH, 'a'],
      ]);
    });

    it('stops capping once every subscriber leaves', () => {
      const dispatch = pollingDispatch();
      dispatch(subscribe('a'));
      dispatch(subscribe('a'));
      dispatch(unsubscribe('a'));
      dispatch(fetchAction('a', 1));
      dispatch(responseAction('a', 1));
      expect(typesAndKeys()).toEqual([
        [FETCH, 'a'],
        [SET_RESPONSE, 'a'],
      ]);

      dispatch(unsubscribe('a'));
      dispatch(fetchAction('a', 2));
      expect(actionLogs().get('App')).toHaveLength(4);
    });

    it('forgets polling keys on cleanup', () => {
      const manager = new DevToolsManager({
        name: 'App',
        maxPollingActions: 2,
      });
      const { dispatch } = setup(manager);
      manager.init(initialState);
      dispatch(subscribe('a'));
      manager.cleanup();
      manager.init(initialState);
      for (let i = 1; i <= 3; i++) dispatch(fetchAction('a', i));
      expect(typesAndKeys().filter(([type]) => type === FETCH)).toHaveLength(3);
    });

    it('does not cap subscriptions without pollFrequency', () => {
      const dispatch = pollingDispatch();
      dispatch({ ...subscribe('a'), endpoint: { name: 'live' } });
      for (let i = 1; i <= 3; i++) dispatch(fetchAction('a', i));
      expect(actionLogs().get('App')).toHaveLength(4);
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

    it('keeps a suffixed key when init runs again after a lower one frees', () => {
      const a = new DevToolsManager({ name: 'App' });
      const b = new DevToolsManager({ name: 'App' });
      const c = new DevToolsManager({ name: 'App' });
      setup(a);
      setup(b);
      const { controller: ctrlC } = setup(c);
      a.init(initialState);
      b.init(initialState);
      c.init(initialState);
      b.cleanup();
      c.init(initialState);

      expect(controllers().get('App (3)')).toBe(ctrlC);
      expect(controllers().has('App (2)')).toBe(false);
      c.cleanup();
      expect(controllers().has('App (3)')).toBe(false);
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
