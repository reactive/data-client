/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import LivePreview from '../LivePreview';

// the real scope pulls in the website's design system and dependencies
jest.mock('../scope', () => ({
  previewScope: {
    ...require('@data-client/react'),
    ...require('@data-client/endpoint'),
  },
}));
jest.mock('../../DesignSystem/Loading', () => ({ Loading: () => null }));
jest.mock('../../../../utils/tabStorage', () => ({
  useTabStorage: () => require('react').useState(null),
}));
jest.mock(
  '@docusaurus/BrowserOnly',
  () =>
    ({ children }: { children: () => React.ReactNode }) =>
      children(),
  { virtual: true },
);
jest.mock(
  '@docusaurus/Translate',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children,
  { virtual: true },
);
jest.mock(
  '@docusaurus/theme-common/internal',
  () => ({
    useScrollPositionBlocker: () => ({
      blockElementScrollPositionUntilNextRender: () => {},
    }),
  }),
  { virtual: true },
);

/** Each manager reports its lifecycle to `log` under its label */
const log: string[] = [];
(globalThis as any).managerLog = log;

const managerDoc = (label: string, extra = '') => `
class LogManager {
  label = '${label}';
  init() { managerLog.push('init ' + this.label); }
  cleanup() { managerLog.push('cleanup ' + this.label); }
  middleware = controller => next => action => {
    ${extra}
    return next(action);
  };
}
export default function getManagers() {
  return [new LogManager(), ...getDefaultManagers()];
}`;
const appDoc = (text: string) => `render(<div>${text}</div>);`;

function renderPlayground(documents: string[]) {
  const props = (docs: string[]) => {
    return {
      documents: docs.map(value => ({ value }) as any),
      storeOpen: false,
      toggleStore: () => {},
      storeHost: null,
      row: false,
      fixtures: [],
      renderCount: false,
    };
  };
  const result = render(<LivePreview {...props(documents)} />);
  return {
    ...result,
    edit: (docs: string[]) => result.rerender(<LivePreview {...props(docs)} />),
  };
}

beforeEach(() => {
  log.length = 0;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it('builds the store with the managers getManagers() returns', async () => {
  const { unmount } = renderPlayground([managerDoc('a'), appDoc('hi')]);
  await screen.findByText('hi');
  await waitFor(() => expect(log).toEqual(['init a']));
  unmount();
  expect(log).toEqual(['init a', 'cleanup a']);
});

it('keeps the managers when other documents change', async () => {
  const { edit } = renderPlayground([managerDoc('a'), appDoc('one')]);
  await screen.findByText('one');
  await waitFor(() => expect(log).toEqual(['init a']));
  edit([managerDoc('a'), appDoc('two')]);
  await screen.findByText('two');
  expect(log).toEqual(['init a']);
});

it('swaps managers when their source changes, keeping the data', async () => {
  const app = `const ep = new Endpoint(async () => { managerLog.push('fetch'); return 'data'; }, { name: 'ep' });
function App() { return <div>{useSuspense(ep)}</div>; }
render(<App />);`;
  const { edit } = renderPlayground([managerDoc('a'), app]);
  await screen.findByText('data');
  // one fetch: the code never rendered against a store without these managers
  // (DataProvider inits managers after its children's effects)
  expect(log).toEqual(['fetch', 'init a']);
  edit([managerDoc('b'), app]);
  await waitFor(() =>
    expect(log).toEqual(['fetch', 'init a', 'cleanup a', 'init b']),
  );
  expect(await screen.findByText('data')).toBeTruthy();
});

it('keeps the managers it has when the new code fails', async () => {
  const { edit } = renderPlayground([managerDoc('a'), appDoc('one')]);
  await waitFor(() => expect(log).toEqual(['init a']));
  edit([managerDoc('b') + '\nthrow new Error("half typed");', appDoc('one')]);
  await screen.findByText(/half typed/);
  expect(log).toEqual(['init a']);
});

it('shows a manager error and keeps the preview running', async () => {
  renderPlayground([
    managerDoc(
      'a',
      `if (action.type === 'rdc/fetch') throw new Error('mgr broke');`,
    ),
    `const ep = new Endpoint(async () => 'data', { name: 'ep' });
function App() { return <div>{useSuspense(ep)}</div>; }
render(<App />);`,
  ]);
  expect(await screen.findByText('Manager error')).toBeTruthy();
  expect(screen.getByText(/mgr broke/)).toBeTruthy();
  expect(await screen.findByText('data')).toBeTruthy();
});

it('calls middleware written as a method with its manager as this', async () => {
  renderPlayground([
    `class MethodManager {
  label = 'method';
  middleware(controller) {
    managerLog.push('middleware ' + this.label);
    return next => action => next(action);
  }
  cleanup() {}
}
function getManagers() { return [new MethodManager(), ...getDefaultManagers()]; }`,
    appDoc('ok'),
  ]);
  await screen.findByText('ok');
  expect(log).toContain('middleware method');
  expect(screen.queryByText('Manager error')).toBeNull();
});

it('swaps managers when a Manager class in its own document changes', async () => {
  const managerClass = (label: string) => `
export class LogManager implements Manager {
  init() { managerLog.push('init ${label}'); }
  cleanup() { managerLog.push('cleanup ${label}'); }
}`;
  const factory = `export default function getManagers() {
  return [new LogManager(), ...getDefaultManagers()];
}`;
  const { edit } = renderPlayground([
    managerClass('a'),
    factory,
    appDoc('one'),
  ]);
  await waitFor(() => expect(log).toEqual(['init a']));
  edit([managerClass('b'), factory, appDoc('one')]);
  await waitFor(() => expect(log).toEqual(['init a', 'cleanup a', 'init b']));
});

it('swaps managers when a structurally typed class in its own document changes', async () => {
  const managerClass = (label: string) => `
export class LogManager {
  init() { managerLog.push('init ${label}'); }
  cleanup() { managerLog.push('cleanup ${label}'); }
}`;
  const factory = `export default function getManagers() {
  return [new LogManager(), ...getDefaultManagers()];
}`;
  const { edit } = renderPlayground([
    managerClass('a'),
    factory,
    appDoc('one'),
  ]);
  await waitFor(() => expect(log).toEqual(['init a']));
  edit([managerClass('a'), factory, appDoc('two')]);
  await screen.findByText('two');
  expect(log).toEqual(['init a']);
  edit([managerClass('b'), factory, appDoc('two')]);
  await waitFor(() => expect(log).toEqual(['init a', 'cleanup a', 'init b']));
});

it('swaps managers when a subclass in its own document changes', async () => {
  const managerClass = (label: string) => `
export class LogNetworkManager extends NetworkManager {
  init(state) { managerLog.push('init ${label}'); super.init?.(state); }
}`;
  const factory = `export default function getManagers() {
  return [new LogNetworkManager()];
}`;
  const { edit } = renderPlayground([
    managerClass('a'),
    factory,
    appDoc('one'),
  ]);
  await waitFor(() => expect(log).toEqual(['init a']));
  edit([managerClass('b'), factory, appDoc('one')]);
  await waitFor(() => expect(log).toEqual(['init a', 'init b']));
});

it('passes an action on once when middleware throws after next()', async () => {
  renderPlayground([
    `class Thrower implements Manager {
  middleware = controller => next => action => {
    if (action.type !== 'rdc/fetch') return next(action);
    next(action);
    throw new Error('after next');
  };
  cleanup() {}
}
class Counter implements Manager {
  seen = new WeakSet();
  middleware = controller => next => action => {
    if (this.seen.has(action)) managerLog.push('passed twice');
    this.seen.add(action);
    return next(action);
  };
  cleanup() {}
}
function getManagers() {
  return [new Thrower(), new Counter(), ...getDefaultManagers()];
}`,
    `const ep = new Endpoint(async () => 'data', { name: 'ep' });
function App() { return <div>{useSuspense(ep)}</div>; }
render(<App />);`,
  ]);
  expect(await screen.findByText('data')).toBeTruthy();
  expect(await screen.findByText('Manager error')).toBeTruthy();
  expect(log).toEqual([]);
});

it('keeps the preview running when async middleware rejects', async () => {
  renderPlayground([
    `class AsyncThrower implements Manager {
  middleware = controller => next => async action => {
    if (action.type === 'rdc/fetch') throw new Error('async broke');
    return next(action);
  };
  cleanup() {}
}
function getManagers() { return [new AsyncThrower(), ...getDefaultManagers()]; }`,
    `const ep = new Endpoint(async () => 'data', { name: 'ep' });
function App() { return <div>{useSuspense(ep)}</div>; }
render(<App />);`,
  ]);
  expect(await screen.findByText('data')).toBeTruthy();
  expect(await screen.findByText(/async broke/)).toBeTruthy();
});

it('shows a manager error when getMiddleware() throws', async () => {
  renderPlayground([
    `class Legacy implements Manager {
  getMiddleware() { throw new Error('legacy broke'); }
  cleanup() {}
}
function getManagers() { return [new Legacy(), ...getDefaultManagers()]; }`,
    appDoc('ok'),
  ]);
  expect(await screen.findByText(/legacy broke/)).toBeTruthy();
  expect(screen.getByText('ok')).toBeTruthy();
});

it('reads a typed getManagers declaration', async () => {
  renderPlayground([
    `class LogManager {
  init() { managerLog.push('init typed'); }
  cleanup() {}
}
const getManagers: () => Manager[] = () => [new LogManager(), ...getDefaultManagers()];`,
    appDoc('ok'),
  ]);
  await waitFor(() => expect(log).toEqual(['init typed']));
});

it('uses the default managers without getManagers()', async () => {
  renderPlayground([
    `const ep = new Endpoint(async () => 'fetched', { name: 'ep' });
function App() { return <div>{useSuspense(ep)}</div>; }
render(<App />);`,
  ]);
  expect(await screen.findByText('fetched')).toBeTruthy();
  expect(log).toEqual([]);
});
