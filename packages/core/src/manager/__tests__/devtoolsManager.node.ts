import { Controller, initialState } from '../..';
import DevToolsManager from '../DevtoolsManager.js';

const controllers = () =>
  (globalThis as any).__DC_CONTROLLERS__ as Map<string, Controller>;

afterEach(() => {
  delete (globalThis as any).__DC_CONTROLLERS__;
  delete (globalThis as any).__DC_ACTIONS__;
});

// server rendering makes a store per request and never cleans it up
it('replaces a same-named controller when there is no page', () => {
  expect(globalThis.document).toBeUndefined();
  const a = new DevToolsManager({ name: 'App' });
  const b = new DevToolsManager({ name: 'App' });
  const ctrlB = new Controller();
  a.middleware(new Controller() as any);
  b.middleware(ctrlB as any);
  a.init(initialState);
  b.init(initialState);

  expect([...controllers().entries()]).toEqual([['App', ctrlB]]);
  a.cleanup();
  expect(controllers().get('App')).toBe(ctrlB);
});
