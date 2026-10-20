import { Controller, initialState } from '../..';
import DevToolsManager from '../DevtoolsManager.js';

const registry = (): Map<string, { controller: Controller; actions: any[] }> =>
  (globalThis as any).__DC__?.registry ?? new Map();
const controllers = () =>
  new Map([...registry()].map(([key, { controller }]) => [key, controller]));

afterEach(() => {
  delete (globalThis as any).__DC__;
});

// server rendering makes a store per request and never cleans it up
it('replaces a same-named controller when server rendering', () => {
  expect(typeof window).toBe('undefined');
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

// React Native defines window but not document
it('registers same-named controllers under distinct keys with a window', () => {
  (globalThis as any).window = globalThis;
  try {
    const a = new DevToolsManager({ name: 'App' });
    const b = new DevToolsManager({ name: 'App' });
    const ctrlA = new Controller();
    const ctrlB = new Controller();
    a.middleware(ctrlA as any);
    b.middleware(ctrlB as any);
    a.init(initialState);
    b.init(initialState);

    expect([...controllers().entries()]).toEqual([
      ['App', ctrlA],
      ['App (2)', ctrlB],
    ]);
  } finally {
    delete (globalThis as any).window;
  }
});
