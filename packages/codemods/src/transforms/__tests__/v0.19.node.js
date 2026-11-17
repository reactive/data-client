'use strict';

const {
  applyTransform,
  defineInlineTest,
} = require('jscodeshift/dist/testUtils');

const transform = require('../v0.19');

const DEPRECATIONS_INPUT = `
import { renderDataHook } from '@data-client/test';
import { resource } from '@data-client/rest';

const PostResource = resource({ path: '/posts/:id', schema: Post });
await Promise.resolve(ctrl.fetchIfStale(PostResource.get, { id }));
ctrl.fetch(PostResource.create, body);
renderDataHook.cleanup();
`;

describe('v0.19 codemod', () => {
  describe('DataProvider managers', () => {
    defineInlineTest(
      transform,
      { path: 'App.tsx' },
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

const managers = [new MyManager(), ...getDefaultManagers()];

export default function App() {
  return <DataProvider managers={managers}><Main /></DataProvider>;
}
      `,
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

const managers = () => [new MyManager(), ...getDefaultManagers()];

export default function App() {
  return <DataProvider managers={managers}><Main /></DataProvider>;
}
      `,
      'turns a module-level array into a function',
    );

    defineInlineTest(
      transform,
      { path: 'App.tsx' },
      `
import { DataProvider, getDefaultManagers, type Manager } from '@data-client/react';

const managers: Manager[] = getDefaultManagers({ devToolsManager: null });

export const App = () => <DataProvider managers={managers}><Main /></DataProvider>;
      `,
      `
import { DataProvider, getDefaultManagers, type Manager } from '@data-client/react';

const managers: () => Manager[] = () => getDefaultManagers({ devToolsManager: null });

export const App = () => <DataProvider managers={managers}><Main /></DataProvider>;
      `,
      'turns a getDefaultManagers() variable into a function and updates its type',
    );

    defineInlineTest(
      transform,
      { path: 'App.tsx' },
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

export const A = () => <DataProvider managers={getDefaultManagers()} />;
export const B = () => (
  <DataProvider managers={getDefaultManagers({ devToolsManager: null })} />
);
export const C = () => <DataProvider managers={[new MyManager()]} />;
      `,
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

export const A = () => <DataProvider managers={getDefaultManagers} />;
export const B = () => (
  <DataProvider managers={() => getDefaultManagers({ devToolsManager: null })} />
);
export const C = () => <DataProvider managers={() => [new MyManager()]} />;
      `,
      'wraps managers written in the attribute',
    );

    defineInlineTest(
      transform,
      { path: 'App.tsx' },
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';
import { useMemo } from 'react';
import { sharedManagers } from './managers';

const managers = [new MyManager(), ...getDefaultManagers()];
const network = managers.find(m => m instanceof NetworkManager);

export function App() {
  const memoized = useMemo(() => getDefaultManagers(), []);
  return (
    <>
      <DataProvider managers={managers} />
      <DataProvider managers={memoized} />
      <DataProvider managers={sharedManagers} />
      <DataProvider managers={useMemo(() => [new MyManager()], [])} />
    </>
  );
}
      `,
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';
import { useMemo } from 'react';
import { sharedManagers } from './managers';

const managers = [new MyManager(), ...getDefaultManagers()];
const network = managers.find(m => m instanceof NetworkManager);

export function App() {
  const memoized = useMemo(() => getDefaultManagers(), []);
  // TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function
  return (
    <>
      <DataProvider managers={() => managers} />
      <DataProvider managers={() => memoized} />
      <DataProvider managers={() => sharedManagers} />
      <DataProvider managers={() => useMemo(() => [new MyManager()], [])} />
    </>
  );
}
      `,
      'wraps values it cannot turn into a function where they are passed',
    );

    defineInlineTest(
      transform,
      { path: 'App.tsx' },
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

const managers = () => [new MyManager(), ...getDefaultManagers()];
function getManagers() {
  return getDefaultManagers();
}

export const A = () => <DataProvider managers={managers} />;
export const B = () => <DataProvider managers={getManagers} />;
export const C = () => <DataProvider managers={getDefaultManagers} />;
      `,
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

const managers = () => [new MyManager(), ...getDefaultManagers()];
function getManagers() {
  return getDefaultManagers();
}

export const A = () => <DataProvider managers={managers} />;
export const B = () => <DataProvider managers={getManagers} />;
export const C = () => <DataProvider managers={getDefaultManagers} />;
      `,
      'leaves functions as they are',
    );

    defineInlineTest(
      transform,
      { path: 'App.tsx' },
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

const managers = getDefaultManagers();

export const A = () => (
  <DataProvider managers={managers}>
    <ManagerList list={managers} />
  </DataProvider>
);
      `,
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

const managers = getDefaultManagers();

// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function
export const A = () => (
  <DataProvider managers={() => managers}>
    <ManagerList list={managers} />
  </DataProvider>
);
      `,
      'keeps a variable another prop reads as an array',
    );
  });

  describe('Vue managers', () => {
    defineInlineTest(
      transform,
      { path: 'main.ts' },
      `
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';

const managers = [new MyManager(), ...getDefaultManagers()];
app.use(DataClientPlugin, { managers });
app.use(DataClientPlugin, { managers: getDefaultManagers() });
      `,
      `
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';

const managers = () => [new MyManager(), ...getDefaultManagers()];
app.use(DataClientPlugin, { managers });
app.use(DataClientPlugin, { managers: getDefaultManagers });
      `,
      'converts the DataClientPlugin option',
    );

    defineInlineTest(
      transform,
      { path: 'Comp.test.ts' },
      `
import { DataClientPlugin } from '@data-client/vue';
import { mountDataClient } from '@data-client/vue/test';

const customManagers = [new NetworkManager()];
mount(Comp, { global: { plugins: [[DataClientPlugin, { managers: customManagers }]] } });
customManagers[0].cleanup();
mountDataClient(Comp, { managers: [new NetworkManager()] });
      `,
      `
import { DataClientPlugin } from '@data-client/vue';
import { mountDataClient } from '@data-client/vue/test';

const customManagers = [new NetworkManager()];
// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function
mount(Comp, { global: { plugins: [[DataClientPlugin, { managers: () => customManagers }]] } });
customManagers[0].cleanup();
mountDataClient(Comp, { managers: () => [new NetworkManager()] });
      `,
      'converts plugin arrays and mountDataClient()',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { renderDataHook } from '@data-client/test';

renderDataHook(() => useThing(), { managers: [new NetworkManager(), logger] });
renderDataClient(() => useThing(), { managers: [new NetworkManager()] });
      `,
      `
import { renderDataHook } from '@data-client/test';

import { SubscriptionManager, PollingSubscription } from '@data-client/react';

// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function
renderDataHook(() => useThing(), { managers: () => [new NetworkManager(), logger] });
renderDataClient(() => useThing(), { managers: () => [new NetworkManager(), new SubscriptionManager(PollingSubscription)] });
      `,
      'converts renderDataHook() managers',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { renderDataHook } from '@data-client/test';

renderDataHook(() => useThing(), { managers: [new LoggingManager()] });
renderDataHook(() => useThing(), { managers: [new AuditNetworkManager()] });
renderDataHook(() => useThing(), { managers: [logger] });
      `,
      `
import { renderDataHook } from '@data-client/test';

import { NetworkManager, SubscriptionManager, PollingSubscription } from '@data-client/react';

renderDataHook(() => useThing(), { managers: () => [new LoggingManager(), new NetworkManager(), new SubscriptionManager(PollingSubscription)] });
renderDataHook(() => useThing(), { managers: () => [new AuditNetworkManager(), new SubscriptionManager(PollingSubscription)] });
// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function
renderDataHook(() => useThing(), { managers: () => [logger] });
      `,
      'adds the default Managers renderDataHook() lists of new Managers lack',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { useController } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

renderDataHook(() => useController(), { managers: [new LoggingManager()] });
      `,
      `
import { useController, NetworkManager, SubscriptionManager, PollingSubscription } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

renderDataHook(() => useController(), { managers: () => [new LoggingManager(), new NetworkManager(), new SubscriptionManager(PollingSubscription)] });
      `,
      'imports the default Managers next to an existing @data-client/react import',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import * as DC from '@data-client/react';
import { renderDataHook } from '@data-client/test';

renderDataHook(() => useThing(), { managers: [new LoggingManager()] });
renderDataHook(() => useThing(), { managers: [new LoggingManager()] });
renderDataHook(() => useThing(), { managers: [new DC.NetworkManager()] });
renderDataHook(() => useThing(), { 'managers': [new LoggingManager()] });
renderDataHook(() => useThing(), { initialProps: { managers: () => [new LoggingManager()] } });
renderDataHook(() => useThing(), { managers: [new LoggingManager()] as Manager[] });
renderDataHook(() => useThing(), { managers: enabled ? [new LoggingManager()] : undefined });
      `,
      `
import * as DC from '@data-client/react';
import { renderDataHook } from '@data-client/test';

import { NetworkManager, SubscriptionManager, PollingSubscription } from '@data-client/react';

renderDataHook(() => useThing(), { managers: () => [new LoggingManager(), new NetworkManager(), new SubscriptionManager(PollingSubscription)] });
renderDataHook(() => useThing(), { managers: () => [new LoggingManager(), new NetworkManager(), new SubscriptionManager(PollingSubscription)] });
renderDataHook(() => useThing(), { managers: () => [new DC.NetworkManager(), new SubscriptionManager(PollingSubscription)] });
renderDataHook(() => useThing(), { 'managers': () => [new LoggingManager(), new NetworkManager(), new SubscriptionManager(PollingSubscription)] });
renderDataHook(() => useThing(), { initialProps: { managers: () => [new LoggingManager()] } });
renderDataHook(() => useThing(), { managers: () => [new LoggingManager(), new NetworkManager(), new SubscriptionManager(PollingSubscription)] as Manager[] });
renderDataHook(() => useThing(), { managers: enabled ? () => [new LoggingManager(), new NetworkManager(), new SubscriptionManager(PollingSubscription)] : undefined });
      `,
      'imports the default Managers once, and sees a namespaced NetworkManager',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { NetworkManager as NM } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

class AuditManager extends NM {}
const Loop = class extends Loop {};
const Scoped = class extends DC.NetworkManager {};
renderDataHook(() => useThing(), { managers: [new NM()] });
renderDataHook(() => useThing(), { managers: [new AuditManager()] });
renderDataHook(() => useThing(), { managers: [new Scoped()] });
renderDataHook(() => useThing(), { managers: [new Loop()] });
      `,
      `
import { NetworkManager as NM, SubscriptionManager, PollingSubscription, NetworkManager } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

class AuditManager extends NM {}
const Loop = class extends Loop {};
const Scoped = class extends DC.NetworkManager {};
renderDataHook(() => useThing(), { managers: () => [new NM(), new SubscriptionManager(PollingSubscription)] });
renderDataHook(() => useThing(), { managers: () => [new AuditManager(), new SubscriptionManager(PollingSubscription)] });
renderDataHook(() => useThing(), { managers: () => [new Scoped(), new SubscriptionManager(PollingSubscription)] });
renderDataHook(() => useThing(), { managers: () => [new Loop(), new NetworkManager(), new SubscriptionManager(PollingSubscription)] });
      `,
      'sees a NetworkManager imported under another name or extended locally',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import type { NetworkManager, Manager } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

it('a', () => {
  const managers = [new NetworkManager()];
  renderDataHook(() => useThing(), { managers });
});
it('b', () => {
  const managers = [new LoggingManager()];
  renderDataHook(() => useThing(), { managers });
});
      `,
      `
import { NetworkManager, type Manager, SubscriptionManager, PollingSubscription } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

it('a', () => {
  const managers = () => [new NetworkManager(), new SubscriptionManager(PollingSubscription)];
  renderDataHook(() => useThing(), { managers });
});
it('b', () => {
  const managers = () => [new LoggingManager(), new NetworkManager(), new SubscriptionManager(PollingSubscription)];
  renderDataHook(() => useThing(), { managers });
});
      `,
      'adds a NetworkManager to a managers variable, and makes a type-only import a value import',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { renderDataCompose } from '@data-client/vue/test';

await renderDataCompose(() => useThing(), { managers: [new NetworkManager()] });
      `,
      `
import { renderDataCompose } from '@data-client/vue/test';

await renderDataCompose(() => useThing(), { managers: () => [new NetworkManager()] });
      `,
      'converts renderDataCompose() managers',
    );
  });

  describe('custom providers', () => {
    defineInlineTest(
      transform,
      { path: 'store.ts' },
      `
import { initManager, getDefaultManagers } from '@data-client/react';
import { prepareStore } from '@data-client/react/redux';

const { store, controller, managers } = prepareStore(
  initialState,
  getDefaultManagers(),
  Controller,
);
const start = initManager(managers, controller, initialState);
const persisted = createPersistedStore([new NetworkManager()]);
      `,
      `
import { initManager, getDefaultManagers } from '@data-client/react';
import { prepareStore } from '@data-client/react/redux';

const { store, controller, managers } = prepareStore(
  initialState,
  getDefaultManagers,
  Controller,
);
const start = initManager(managers, controller);
const persisted = createPersistedStore(() => [new NetworkManager()]);
      `,
      'converts prepareStore() and createPersistedStore(), and drops the third argument of initManager()',
    );

    defineInlineTest(
      transform,
      { path: 'store.ts' },
      `
import { createPersistedStore } from '@data-client/react';

const [ServerProvider] = createPersistedStore(undefined, false);
const [CustomProvider] = createPersistedStore(useCustom ? custom : undefined);
      `,
      `
import { createPersistedStore } from '@data-client/react';

const [ServerProvider] = createPersistedStore(undefined, false);
// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function
const [CustomProvider] = createPersistedStore(useCustom ? () => custom : undefined);
      `,
      'leaves undefined managers arguments alone, including conditional ones',
    );
  });

  describe('Manager classes', () => {
    defineInlineTest(
      transform,
      { path: 'Managers.ts' },
      `
import { Manager } from '@data-client/react';

class A implements Manager {}
class B implements Manager {}
class C implements Manager {
  private getMiddleware() {
    return controller => next => next;
  }
}
const mw = manager?.getMiddleware();
      `,
      `
import { Manager, type Middleware } from '@data-client/react';

class A implements Manager {
  middleware: Middleware = () => next => next;
}
class B implements Manager {
  middleware: Middleware = () => next => next;
}
class C implements Manager {
  private middleware = controller => next => next;
}
const mw = manager?.middleware;
      `,
      'imports Middleware once as a type, keeps modifiers, and rewrites optional calls',
    );

    defineInlineTest(
      transform,
      { path: 'Managers.ts' },
      `
import type { Manager, Middleware } from '@data-client/react';

class A implements Manager {
  getMiddleware() {
    return;
  }
  cleanup() {}
}
class B implements Manager {
  getMiddleware: Middleware;
  cleanup() {}
}
class C implements Manager {
  static getMiddleware() {
    return controller => next => next;
  }
  cleanup() {}
}
      `,
      `
import type { Manager, Middleware } from '@data-client/react';

class A implements Manager {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return;
  }
  cleanup() {}
}
class B implements Manager {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  getMiddleware: Middleware;
  cleanup() {}
}
class C implements Manager {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  static getMiddleware() {
    return controller => next => next;
  }
  cleanup() {}
}
      `,
      'marks getMiddleware members that hold no function to move',
    );

    defineInlineTest(
      transform,
      { path: 'LiveManager.js' },
      `
import { NetworkManager } from '@data-client/react';

class LiveManager {
  constructor() {
    this.getMiddleware = this.getMiddleware.bind(this);
  }
  getMiddleware() {
    return controller => next => next;
  }
}
      `,
      `
import { NetworkManager } from '@data-client/react';

class LiveManager {
  constructor() {
    // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
    this.getMiddleware = this.getMiddleware.bind(this);
  }
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return controller => next => next;
  }
}
      `,
      'keeps getMiddleware with a TODO when other code references it',
    );

    defineInlineTest(
      transform,
      { path: 'Logging.ts' },
      `
import { Manager, Middleware } from '@data-client/react';

class LoggingManager implements Manager {
  middleware: Middleware = controller => next => action => next(action);
  getMiddleware() {
    return this.middleware;
  }
}
const mw = new LoggingManager().getMiddleware();
      `,
      `
import { Manager, Middleware } from '@data-client/react';

class LoggingManager implements Manager {
  middleware: Middleware = controller => next => action => next(action);
}
const mw = new LoggingManager().middleware;
      `,
      'removes a getMiddleware() that returns the middleware property',
    );

    defineInlineTest(
      transform,
      { path: 'Logging.ts' },
      `
import { Manager, Middleware } from '@data-client/react';

class LoggingManager implements Manager {
  getMiddleware() {
    return controller => next => next;
  }
}
class Both implements Manager {
  middleware: Middleware = controller => next => action => next(action);
  getMiddleware() {
    return controller => next => next;
  }
}
const mw = new LoggingManager().getMiddleware();
      `,
      `
import { Manager, Middleware } from '@data-client/react';

class LoggingManager implements Manager {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return controller => next => next;
  }
}
class Both implements Manager {
  middleware: Middleware = controller => next => action => next(action);
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return controller => next => next;
  }
}
// TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
const mw = new LoggingManager().getMiddleware();
      `,
      'keeps every getMiddleware when one beside a middleware property cannot convert',
    );

    defineInlineTest(
      transform,
      { path: 'manager.ts' },
      `
import { NetworkManager } from '@data-client/react';

const manager = {
  getMiddleware() {
    return controller => next => next;
  },
};
const mw = manager.getMiddleware();
      `,
      `
import { NetworkManager } from '@data-client/react';

const manager = {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return controller => next => next;
  },
};
// TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
const mw = manager.getMiddleware();
      `,
      'marks object-literal getMiddleware and keeps its calls',
    );

    defineInlineTest(
      transform,
      { path: 'Boss.ts' },
      `
import { Manager, Middleware, useSuspense } from '@data-client/react';
import type { Manager as Job } from './types';

class Injected implements Manager {
  constructor(public middleware: Middleware) {}
}
      `,
      `
import { Manager, Middleware, useSuspense } from '@data-client/react';
import type { Manager as Job } from './types';

class Injected implements Manager {
  constructor(public middleware: Middleware) {}
}
      `,
      'sees a middleware parameter property',
    );

    defineInlineTest(
      transform,
      { path: 'Boss.ts' },
      `
import { useSuspense } from '@data-client/react';
import { Manager } from './types';

class Boss implements Manager {}
      `,
      `
import { useSuspense } from '@data-client/react';
import { Manager } from './types';

// TODO(data-client): if this is a data-client Manager, it throws on mount without a middleware property since 0.19; add \`middleware: Middleware = () => next => next\`: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
class Boss implements Manager {}
      `,
      'marks classes implementing a Manager from another module',
    );

    defineInlineTest(
      transform,
      { path: 'f.ts' },
      `
import { NetworkManager } from '@data-client/react';

function f(nm) { foo(); // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-cleanup
return nm.cleanupDate; }
function g(nm) {
  // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-cleanup
  if (nm)
    return nm.cleanupDate;
}
      `,
      `
import { NetworkManager } from '@data-client/react';

function f(nm) { foo(); // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-cleanup
return nm.cleanupDate; }
function g(nm) {
  // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-cleanup
  if (nm)
    return nm.cleanupDate;
}
      `,
      'adds no TODO a previous run left, wherever the parser attached it',
    );

    defineInlineTest(
      transform,
      { path: 'g.ts' },
      `
import { NetworkManager } from '@data-client/react';

function g(nm) {
  if (nm) return nm.cleanupDate;
}
      `,
      `
import { NetworkManager } from '@data-client/react';

function g(nm) {
  // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-cleanup
  if (nm)
    return nm.cleanupDate;
}
      `,
      'puts the TODO above an unbraced if',
    );

    defineInlineTest(
      transform,
      { path: 'Logging.js' },
      `
import { NetworkManager } from '@data-client/react';

class LoggingManager {
  getMiddleware() {
    return controller => next => next;
  }
  run() {
    return this['getMiddleware']();
  }
}
      `,
      `
import { NetworkManager } from '@data-client/react';

class LoggingManager {
  middleware = controller => next => next;
  run() {
    return this.middleware;
  }
}
      `,
      'rewrites computed getMiddleware calls',
    );

    defineInlineTest(
      transform,
      { path: 'Logging.ts' },
      `
import { Manager, Middleware, NetworkManager } from '@data-client/react';

class Defaulted implements Manager {
  constructor(private middleware: Middleware = () => next => next) {}
}
class Decorated extends NetworkManager {
  @bound
  getMiddleware(): Middleware {
    return controller => next => next;
  }
}
      `,
      `
import { Manager, Middleware, NetworkManager } from '@data-client/react';

class Defaulted implements Manager {
  constructor(private middleware: Middleware = () => next => next) {}
}
class Decorated extends NetworkManager {
  @bound
  middleware: Middleware = controller => next => next;
}
      `,
      'sees a defaulted middleware parameter property, and keeps decorators',
    );

    defineInlineTest(
      transform,
      { path: 'App.tsx' },
      `
import { DataProvider, NetworkManager, type Manager } from '@data-client/react';

const network = new NetworkManager();
const App = () => (
  <>
    <DataProvider managers={[network, new MyManager()]} />
    <DataProvider managers={[new MyManager()] as Manager[]} />
    <DataProvider managers={[options?.network]} />
  </>
);
      `,
      `
import { DataProvider, NetworkManager, type Manager } from '@data-client/react';

const network = new NetworkManager();
// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function
const App = () => (
  <>
    <DataProvider managers={() => [network, new MyManager()]} />
    <DataProvider managers={() => [new MyManager()] as Manager[]} />
    <DataProvider managers={() => [options?.network]} />
  </>
);
      `,
      'marks inline lists holding a shared instance',
    );

    defineInlineTest(
      transform,
      { path: 'Managers.ts' },
      `
import { Manager, NetworkManager } from '@data-client/react';

class A implements Manager {
  async getMiddleware() {
    return controller => next => next;
  }
}
class B extends Base implements Manager {}
class C implements Manager {
  ['middleware'] = () => next => next;
  ['getMiddleware2']() {}
}
const mw = manager.getMiddleware();
      `,
      `
import { Manager, NetworkManager } from '@data-client/react';

class A implements Manager {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  async getMiddleware() {
    return controller => next => next;
  }
}
class B extends Base implements Manager {}
class C implements Manager {
  ['middleware'] = () => next => next;
  ['getMiddleware2']() {}
}
// TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
const mw = manager.getMiddleware();
      `,
      'marks async getMiddleware and its calls; leaves subclasses and existing middleware alone',
    );

    defineInlineTest(
      transform,
      { path: 'LoggingManager.ts' },
      `
import type { Manager, Middleware } from '@data-client/react';

export class LoggingManager implements Manager {
  getMiddleware = (): Middleware => controller => next => async action => next(action);
  cleanup() {}
}
export class TimeManager implements Manager {
  getMiddleware() {
    return controller => next => action => next(action);
  }
  cleanup() {}
}
const mw = manager.getMiddleware();
      `,
      `
import type { Manager, Middleware } from '@data-client/react';

export class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => next(action);
  cleanup() {}
}
export class TimeManager implements Manager {
  middleware = controller => next => action => next(action);
  cleanup() {}
}
const mw = manager.middleware;
      `,
      'turns getMiddleware into a middleware property',
    );

    defineInlineTest(
      transform,
      { path: 'Managers.ts' },
      `
import { NetworkManager } from '@data-client/react';

class Lazy extends NetworkManager {
  getMiddleware() {
    const mw = super.getMiddleware();
    return mw;
  }
}
      `,
      `
import { NetworkManager } from '@data-client/react';

class Lazy extends NetworkManager {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware
  getMiddleware() {
    const mw = super.getMiddleware();
    return mw;
  }
}
      `,
      'marks getMiddleware code that does more than return a function',
    );

    defineInlineTest(
      transform,
      { path: 'PresenceManager.ts' },
      `
import { type Manager } from '@data-client/react';

export default class PresenceManager implements Manager {
  init() {}
  cleanup() {}
}
      `,
      `
import { type Manager, type Middleware } from '@data-client/react';

export default class PresenceManager implements Manager {
  middleware: Middleware = () => next => next;
  init() {}
  cleanup() {}
}
      `,
      'gives a Manager class without middleware a pass-through',
    );

    defineInlineTest(
      transform,
      { path: 'AuditNetworkManager.ts' },
      `
import { NetworkManager } from '@data-client/react';

export default class AuditNetworkManager extends NetworkManager {
  cleanup() {
    super.cleanup();
    console.info(this.cleanupDate);
  }
}
      `,
      `
import { NetworkManager } from '@data-client/react';

export default class AuditNetworkManager extends NetworkManager {
  cleanup() {
    super.cleanup();
    // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-cleanup
    console.info(this.cleanupDate);
  }
}
      `,
      'marks reads of cleanupDate',
    );
  });

  describe('other cases', () => {
    defineInlineTest(
      transform,
      { path: 'App.tsx' },
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

export const managers = [new MyManager(), ...getDefaultManagers()];

export const App = () => <DataProvider managers={managers} />;
      `,
      `
import { DataProvider, getDefaultManagers } from '@data-client/react';

export const managers = [new MyManager(), ...getDefaultManagers()];

// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function
export const App = () => <DataProvider managers={() => managers} />;
      `,
      'wraps exported arrays where they are passed, as their importers are, with a TODO',
    );

    defineInlineTest(
      transform,
      { path: 'Other.tsx' },
      `
import { Provider } from 'other-lib';

const managers = [1, 2];
export const A = () => <Provider managers={managers} />;
      `,
      `
import { Provider } from 'other-lib';

const managers = [1, 2];
export const A = () => <Provider managers={managers} />;
      `,
      'leaves files without @data-client imports alone',
    );
  });

  describe('fetchIfStale()', () => {
    defineInlineTest(
      transform,
      { path: 'loader.ts' },
      `
import type { Controller } from '@data-client/react';

export function loader(ctrl: Controller, id: number) {
  Promise.resolve(ctrl.fetchIfStale(CommentResource.getList, { id })).catch(() => {});
  return Promise.resolve(other());
}
      `,
      `
import type { Controller } from '@data-client/react';

export function loader(ctrl: Controller, id: number) {
  ctrl.fetchIfStale(CommentResource.getList, { id });
  return Promise.resolve(other());
}
      `,
      'unwraps Promise.resolve() around it, and drops the catch it no longer needs',
    );

    defineInlineTest(
      transform,
      { path: 'loader.ts' },
      `
import type { Controller } from '@data-client/react';

export function loader(ctrl: Controller, id: number, value: unknown) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  if (!(issue instanceof Promise)) {
    render(issue);
  }
  if (value) {
    log(value);
  } else if (ctrl.fetchIfStale(IssueResource.get, { id }) instanceof Promise) {
    log(id);
  }
  return value instanceof Promise;
}
      `,
      `
import type { Controller } from '@data-client/react';

export function loader(ctrl: Controller, id: number, value: unknown) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (!(issue instanceof Promise)) {
    render(issue);
  }
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (value) {
    log(value);
  } else if (ctrl.fetchIfStale(IssueResource.get, { id }) instanceof Promise) {
    log(id);
  }
  return value instanceof Promise;
}
      `,
      'marks instanceof Promise checks of its result with a TODO',
    );

    defineInlineTest(
      transform,
      { path: 'loader.ts' },
      `
import { Controller } from '@data-client/react';

export async function loader(ctrl, id) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  const { title } = ctrl.fetchIfStale(IssueResource.get, { id });
  if (ctrl.fetchIfStale(UserResource.get, { id })) {
    log(title);
  }
  const user = ctrl.fetchIfStale(UserResource.get, { id }) as User;
  return \`\${issue.title} by \${user.name}\`;
}
      `,
      `
import { Controller } from '@data-client/react';

export async function loader(ctrl, id) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  const { title } = ctrl.fetchIfStale(IssueResource.get, { id });
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (ctrl.fetchIfStale(UserResource.get, { id })) {
    log(title);
  }
  const user = ctrl.fetchIfStale(UserResource.get, { id }) as User;
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  return \`\${issue.title} by \${user.name}\`;
}
      `,
      'marks other reads of the result as data',
    );

    defineInlineTest(
      transform,
      { path: 'loader.ts' },
      `
import type { Controller } from '@data-client/react';

export async function loader(ctrl: Controller, id: number) {
  ctrl.fetchIfStale(CommentResource.getList, { id });
  const pending = ctrl.fetchIfStale(UserResource.get, { id });
  pending.then(render).catch(log).finally(done);
  await Promise.all([ctrl.fetchIfStale(A, { id }), pending]);
  track(ctrl.fetchIfStale(B, { id }));
  const issue = await ctrl.fetchIfStale(IssueResource.get, { id });
  return issue.title;
}
      `,
      `
import type { Controller } from '@data-client/react';

export async function loader(ctrl: Controller, id: number) {
  ctrl.fetchIfStale(CommentResource.getList, { id });
  const pending = ctrl.fetchIfStale(UserResource.get, { id });
  pending.then(render).catch(log).finally(done);
  await Promise.all([ctrl.fetchIfStale(A, { id }), pending]);
  track(ctrl.fetchIfStale(B, { id }));
  const issue = await ctrl.fetchIfStale(IssueResource.get, { id });
  return issue.title;
}
      `,
      'leaves Promise uses alone',
    );

    defineInlineTest(
      transform,
      { path: 'loader.test.ts' },
      `
import { Controller } from '@data-client/react';

const ctrl = new Controller();
jest.spyOn(ctrl, 'fetchIfStale').mockReturnValue(issue);
vi.spyOn(ctrl, 'fetchIfStale').mockReturnValueOnce(a).mockReturnValueOnce(b);
jest.spyOn(ctrl, 'fetch').mockReturnValue(other);
      `,
      `
import { Controller } from '@data-client/react';

const ctrl = new Controller();
jest.spyOn(ctrl, 'fetchIfStale').mockResolvedValue(issue);
vi.spyOn(ctrl, 'fetchIfStale').mockResolvedValueOnce(a).mockResolvedValueOnce(b);
jest.spyOn(ctrl, 'fetch').mockReturnValue(other);
      `,
      'makes fetchIfStale() mocks resolve their value',
    );
    defineInlineTest(
      transform,
      { path: 'loader.ts' },
      `
import type { Controller } from '@data-client/react';

export async function issueLoader(ctrl: Controller, id: number) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  // set the tab title
  if (issue instanceof Promise) {
    const loaded = await issue;
    setTitle(loaded.title);
  } else {
    setTitle(issue.title);
  }
  const user = ctrl.fetchIfStale(UserResource.get, { id });
  if (!(user instanceof Promise)) render(user);
  else user.then(render);
  const team = ctrl.fetchIfStale(TeamResource.get, { id });
  const loadedTeam = team instanceof Promise ? await team : team;
  const org = ctrl.fetchIfStale(OrgResource.get, { id });
  if (isPromise(org)) await org;
  const repo = ctrl.fetchIfStale(RepoResource.get, { id });
  if (repo instanceof Promise) return;
  render(repo);
}

export async function shadowed(ctrl: Controller, id: number, loaded: Issue) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  if (issue instanceof Promise) {
    const loaded = await issue;
    setTitle(loaded.title);
  } else setTitle(issue.title);
  return loaded;
}
      `,
      `
import type { Controller } from '@data-client/react';

export async function issueLoader(ctrl: Controller, id: number) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  // set the tab title
  const loaded = await issue;
  setTitle(loaded.title);
  const user = ctrl.fetchIfStale(UserResource.get, { id });
  user.then(render);
  const team = ctrl.fetchIfStale(TeamResource.get, { id });
  const loadedTeam = await team;
  const org = ctrl.fetchIfStale(OrgResource.get, { id });
  await org;
  const repo = ctrl.fetchIfStale(RepoResource.get, { id });
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (repo instanceof Promise)
    return;
  render(repo);
}

export async function shadowed(ctrl: Controller, id: number, loaded: Issue) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  {
    const loaded = await issue;
    setTitle(loaded.title);
  }
  return loaded;
}
      `,
      'keeps the Promise branch of a check on its result when that branch awaits it',
    );

    defineInlineTest(
      transform,
      { path: 'loader.test.ts' },
      `
import { Controller } from '@data-client/react';

const ctrl = { fetchIfStale: jest.fn(() => issue), fetch: jest.fn(() => other) };
const typed = { fetchIfStale: vi.fn().mockReturnValueOnce(a).mockImplementation(() => b) };
real.fetchIfStale = jest.fn(id => {
  if (id) return issue;
  return Promise.resolve(other);
});
const partial = { fetchIfStale: jest.fn(() => {
  if (ready) return cached;
  return;
}) };
const fallthrough = { fetchIfStale: jest.fn(() => {
  if (ready) return cached;
}) };
jest.spyOn(real, 'fetchIfStale').mockImplementation(async () => issue);
jest.spyOn(real, 'fetchIfStale').mockImplementationOnce(() => Promise.reject(error));
jest.spyOn(real, 'fetchIfStale').mockImplementation(impl);
      `,
      `
import { Controller } from '@data-client/react';

const ctrl = { fetchIfStale: jest.fn(() => Promise.resolve(issue)), fetch: jest.fn(() => other) };
const typed = { fetchIfStale: vi.fn().mockResolvedValueOnce(a).mockImplementation(() => Promise.resolve(b)) };
real.fetchIfStale = jest.fn(id => {
  if (id) return Promise.resolve(issue);
  return Promise.resolve(other);
});
const partial = { fetchIfStale: jest.fn(async () => {
  if (ready) return cached;
  return;
}) };
const fallthrough = { fetchIfStale: jest.fn(async () => {
  if (ready) return cached;
}) };
jest.spyOn(real, 'fetchIfStale').mockImplementation(async () => issue);
jest.spyOn(real, 'fetchIfStale').mockImplementationOnce(() => Promise.reject(error));
// TODO(data-client): fetchIfStale() always returns a Promise since 0.19; make this mock resolve its data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
jest.spyOn(real, 'fetchIfStale').mockImplementation(impl);
      `,
      'makes jest.fn() mocks of fetchIfStale resolve their value',
    );

    defineInlineTest(
      transform,
      { path: 'guards.ts' },
      `
import type { Controller } from '@data-client/react';

export async function guarded(ctrl: Controller, id: string) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  if (issue instanceof Promise) {
    await issue;
    return;
  }
  cache.set(id, issue);
}
export async function counted(ctrl: Controller, id: string) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  if (issue instanceof Promise) {
    await issue;
  } else {
    recordCacheHit(issue.id);
  }
}
export async function waited(ctrl: Controller, id: string) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  if (issue instanceof Promise) {
    await issue;
  }
}
export async function shadowed(ctrl: Controller, id: string, kind: string) {
  if (kind === 'issue') {
    const data = ctrl.fetchIfStale(IssueResource.get, { id });
    await data;
  } else {
    const data = legacyCache.read(id);
    if (data instanceof Promise) {
      await data;
    } else {
      render(data.title);
    }
  }
}
export async function looped(ctrl: Controller, ids: string[]) {
  for (const id of ids) {
    const issue = ctrl.fetchIfStale(IssueResource.get, { id });
    if (issue instanceof Promise) {
      await issue;
      continue;
    }
    recordCacheHit(issue.id);
  }
}
export async function title(ctrl: Controller, id: string) {
  const data = await ctrl.fetchIfStale(IssueResource.get, { id });
  return data?.title;
}
      `,
      `
import type { Controller } from '@data-client/react';

export async function guarded(ctrl: Controller, id: string) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (issue instanceof Promise) {
    await issue;
    return;
  }
  cache.set(id, issue);
}
export async function counted(ctrl: Controller, id: string) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (issue instanceof Promise) {
    await issue;
  } else {
    // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
    recordCacheHit(issue.id);
  }
}
export async function waited(ctrl: Controller, id: string) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  await issue;
}
export async function shadowed(ctrl: Controller, id: string, kind: string) {
  if (kind === 'issue') {
    const data = ctrl.fetchIfStale(IssueResource.get, { id });
    await data;
  } else {
    const data = legacyCache.read(id);
    if (data instanceof Promise) {
      await data;
    } else {
      render(data.title);
    }
  }
}
export async function looped(ctrl: Controller, ids: string[]) {
  for (const id of ids) {
    const issue = ctrl.fetchIfStale(IssueResource.get, { id });
    // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
    if (issue instanceof Promise) {
      await issue;
      continue;
    }
    // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
    recordCacheHit(issue.id);
  }
}
export async function title(ctrl: Controller, id: string) {
  const data = await ctrl.fetchIfStale(IssueResource.get, { id });
  // TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest fetch failed since 0.19; handle that case in .catch() or try/catch: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  return data?.title;
}
      `,
      'marks a Promise branch that only waits when the other branch used the data',
    );

    defineInlineTest(
      transform,
      { path: 'loader.ts' },
      `
import type { Controller } from '@data-client/react';

export async function settingsLoader(ctrl: Controller) {
  const settings = await ctrl.fetchIfStale(SettingsResource.get, { id: 'me' });
  if (!settings) log('no settings');
  const theme = (await ctrl.fetchIfStale(ThemeResource.get)) ?? DEFAULT_THEME;
  const user = await ctrl.fetchIfStale(UserResource.get, { id });
  if (user == null) return;
  const issue = await ctrl.fetchIfStale(IssueResource.get, { id });
  return { settings, theme: theme.name, title: issue.title };
}
      `,
      `
import type { Controller } from '@data-client/react';

export async function settingsLoader(ctrl: Controller) {
  const settings = await ctrl.fetchIfStale(SettingsResource.get, { id: 'me' });
  // TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest fetch failed since 0.19; handle that case in .catch() or try/catch: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (!settings)
    log('no settings');
  // TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest fetch failed since 0.19; handle that case in .catch() or try/catch: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  const theme = (await ctrl.fetchIfStale(ThemeResource.get)) ?? DEFAULT_THEME;
  const user = await ctrl.fetchIfStale(UserResource.get, { id });
  // TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest fetch failed since 0.19; handle that case in .catch() or try/catch: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (user == null)
    return;
  const issue = await ctrl.fetchIfStale(IssueResource.get, { id });
  return { settings, theme: theme.name, title: issue.title };
}
      `,
      'marks code that handled an awaited result being missing',
    );
    defineInlineTest(
      transform,
      { path: 'loader.tsx' },
      `
import { useController } from '@data-client/react';
const cached = loadMaybePromise();
export async function f(ctrl) {
  if (cached instanceof Promise) {
    set((await cached).x);
  } else {
    set(cached.x);
  }
  for (const id of ids) {
    const cached = ctrl.fetchIfStale(A.get, { id });
    await cached;
  }
}
      `,
      `
import { useController } from '@data-client/react';
const cached = loadMaybePromise();
export async function f(ctrl) {
  if (cached instanceof Promise) {
    set((await cached).x);
  } else {
    set(cached.x);
  }
  for (const id of ids) {
    const cached = ctrl.fetchIfStale(A.get, { id });
    await cached;
  }
}
      `,
      'leaves a check on an outer variable that a later block reuses the name of',
    );
    defineInlineTest(
      transform,
      { path: 'loader.tsx' },
      `
import { useController } from '@data-client/react';
if (cached instanceof Promise) {
  set((await cached).x);
} else {
  set(cached.x);
}
for (const id of ids) {
  const cached = ctrl.fetchIfStale(A.get, { id });
  await cached;
}
      `,
      `
import { useController } from '@data-client/react';
if (cached instanceof Promise) {
  set((await cached).x);
} else {
  set(cached.x);
}
for (const id of ids) {
  const cached = ctrl.fetchIfStale(A.get, { id });
  await cached;
}
      `,
      'leaves a module-level check on a global that a later block reuses the name of',
    );
    defineInlineTest(
      transform,
      { path: 'loader.js' },
      `
import { useController } from '@data-client/react';
export async function f(ctrl, id) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  if (issue instanceof Promise) {
    const name = (await issue).name;
    render(name);
  } else {
    render(issue.name);
  }
  return name;
}
      `,
      `
import { useController } from '@data-client/react';
export async function f(ctrl, id) {
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  {
    const name = (await issue).name;
    render(name);
  }
  return name;
}
      `,
      'keeps the branch in a block when code beside it reads a name the branch declares',
    );
    defineInlineTest(
      transform,
      { path: 'loader.js' },
      `
import { useController } from '@data-client/react';
export function f(ctrl, id) {
  var issue = ctrl.fetchIfStale(IssueResource.get, { id });
  if (!(issue instanceof Promise)) render(issue);
}
      `,
      `
import { useController } from '@data-client/react';
export function f(ctrl, id) {
  var issue = ctrl.fetchIfStale(IssueResource.get, { id });
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise
  if (!(issue instanceof Promise))
    render(issue);
}
      `,
      'marks sync reads of a var holding the result',
    );
  });

  describe('unawaited reads', () => {
    defineInlineTest(
      transform,
      { path: 'Refresh.tsx' },
      `
import { useController } from '@data-client/react';

export function Refresh({ id }: { id: number }) {
  const ctrl = useController();
  const { fetch } = ctrl;
  useEffect(() => {
    ctrl.fetchIfStale(IssueResource.get, { id }).catch(() => {});
    ctrl.fetch(TodoResource.getList).catch(() => {});
    fetch(TodoResource.getList.getPage, { cursor }).catch(() => null);
    void ctrl.fetch(TodoResource.get, { id }).catch(() => undefined);
    ctrl.fetch(TodoResource.update, { id }, body).catch(() => {});
    ctrl.fetch(TodoResource.getList).catch(log);
    ctrl.fetch(TodoResource.getList).then(render).catch(() => {});
    window.fetch('/api').catch(() => {});
    ctrl.fetch(TodoResource.getList).catch(e => { log(e); });
  }, [id]);
  const refresh = () => ctrl.fetch(TodoResource.getList).catch(() => {});
  return (
    <>
      <button onClick={() => ctrl.fetch(TodoResource.getList).catch(() => {})}>Refresh</button>
      <Item render={() => ctrl.fetch(TodoResource.get, { id }).catch(() => {})} />
    </>
  );
}

export async function loader(ctrl) {
  await ctrl.fetch(TodoResource.getList).catch(() => {});
}
      `,
      `
import { useController } from '@data-client/react';

export function Refresh({ id }: { id: number }) {
  const ctrl = useController();
  const { fetch } = ctrl;
  useEffect(() => {
    ctrl.fetchIfStale(IssueResource.get, { id });
    ctrl.fetch(TodoResource.getList);
    fetch(TodoResource.getList.getPage, { cursor });
    void ctrl.fetch(TodoResource.get, { id });
    ctrl.fetch(TodoResource.update, { id }, body).catch(() => {});
    ctrl.fetch(TodoResource.getList).catch(log);
    ctrl.fetch(TodoResource.getList).then(render).catch(() => {});
    window.fetch('/api').catch(() => {});
    ctrl.fetch(TodoResource.getList).catch(e => { log(e); });
  }, [id]);
  const refresh = () => ctrl.fetch(TodoResource.getList).catch(() => {});
  return (
    <>
      <button onClick={() => ctrl.fetch(TodoResource.getList)}>Refresh</button>
      <Item render={() => ctrl.fetch(TodoResource.get, { id }).catch(() => {})} />
    </>
  );
}

export async function loader(ctrl) {
  await ctrl.fetch(TodoResource.getList).catch(() => {});
}
      `,
      'drops no-op catches on reads whose result is unused',
    );

    defineInlineTest(
      transform,
      { path: 'reports.ts' },
      `
import { useController } from '@data-client/react';
import { resource } from '@data-client/rest';
import { UserResource } from 'my-api';

const TodoResource = resource({ path: '/todos/:id', schema: Todo });
const ReportResource = resource({ path: '/reports/:id', schema: Report }).extend('get', { method: 'POST' });

export function useRefresh(ctrl) {
  return () => {
    ctrl.fetch(TodoResource.getList).catch(() => void report());
    ctrl.fetch(TodoResource.getList).catch(() => void 0);
    ctrl.fetch(ReportResource.get, { id: 1 }).catch(() => {});
    ctrl.fetch(UserResource.get, { id: 1 }).catch(() => {});
  };
}
      `,
      `
import { useController } from '@data-client/react';
import { resource } from '@data-client/rest';
import { UserResource } from 'my-api';

const TodoResource = resource({ path: '/todos/:id', schema: Todo });
const ReportResource = resource({ path: '/reports/:id', schema: Report }).extend('get', { method: 'POST' });

export function useRefresh(ctrl) {
  return () => {
    ctrl.fetch(TodoResource.getList).catch(() => void report());
    ctrl.fetch(TodoResource.getList);
    ctrl.fetch(ReportResource.get, { id: 1 }).catch(() => {});
    ctrl.fetch(UserResource.get, { id: 1 }).catch(() => {});
  };
}
      `,
      'keeps catches that do something, or on reads it cannot confirm',
    );

    defineInlineTest(
      transform,
      { path: 'Buttons.tsx' },
      `
import { useController } from '@data-client/react';

export function Buttons({ ctrl, id }) {
  return (
    <>
      <button onClick={() => ctrl.fetch(TodoResource.get, { id }).catch(() => {})} />
      <button onClick={async () => ctrl.fetch(TodoResource.get, { id }).catch(() => {})} />
      <Confirm onConfirm={() => ctrl.fetch(TodoResource.get, { id }).catch(() => {})} />
    </>
  );
}
      `,
      `
import { useController } from '@data-client/react';

export function Buttons({ ctrl, id }) {
  return (
    <>
      <button onClick={() => ctrl.fetch(TodoResource.get, { id })} />
      <button onClick={async () => ctrl.fetch(TodoResource.get, { id }).catch(() => {})} />
      <Confirm onConfirm={() => ctrl.fetch(TodoResource.get, { id }).catch(() => {})} />
    </>
  );
}
      `,
      'keeps catches in async handlers and in handlers a component may await',
    );
  });

  describe('controller.resolve()', () => {
    defineInlineTest(
      transform,
      { path: 'LiveManager.ts' },
      `
import { actionTypes, type Manager, type Middleware } from '@data-client/react';

export default class LiveManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.FETCH) {
      const response = await this.load(action.args);
      controller.resolve(action.endpoint, { args: action.args, response, fetchedAt: Date.now() });
      const { endpoint, args } = action;
      controller.resolve(endpoint, { args, response, fetchedAt: Date.now() });
    }
    switch (action.type) {
      case actionTypes.SUBSCRIBE:
        controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
      case actionTypes.FETCH:
        controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
    }
    switch (action.type) {
      case actionTypes.SET: {
        break;
      }
      case actionTypes.FETCH:
        controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
    }
    if (action.type === actionTypes.FETCH) {
      const { endpoint } = action;
      batch.forEach(action => controller.resolve(endpoint, { args: [], response: action, fetchedAt: Date.now() }));
      batch.forEach(action => controller.resolve(action.endpoint, { args: [], response: {}, fetchedAt: Date.now() }));
    }
    switch (kind) {
      case actionTypes.FETCH:
        controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
    }
    if (action.type === actionTypes.FETCH || action.type === actionTypes.SUBSCRIBE) {
      controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
    }
    return next(action);
  };

  receive = ({ endpoint, args, meta }, response) =>
    this.controller.resolve(endpoint, { args, response, fetchedAt: Date.now() });

  push(response) {
    this.controller.resolve(getMessages, { args: [], response, fetchedAt: Date.now() });
  }

  relay(props, options) {
    this.controller.resolve(props.endpoint, { args: [], response: props.data, fetchedAt: Date.now() });
    const { endpoint } = options;
    this.controller.resolve(endpoint, { args: [], response: options.data, fetchedAt: Date.now() });
  }
}
      `,
      `
import { actionTypes, type Manager, type Middleware } from '@data-client/react';

export default class LiveManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.FETCH) {
      const response = await this.load(action.args);
      controller.resolve(action.endpoint, { args: action.args, response, fetchedAt: action.meta.fetchedAt });
      const { endpoint, args } = action;
      controller.resolve(endpoint, { args, response, fetchedAt: action.meta.fetchedAt });
    }
    switch (action.type) {
      case actionTypes.SUBSCRIBE:
        controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
      case actionTypes.FETCH:
        controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
    }
    switch (action.type) {
      case actionTypes.SET: {
        break;
      }
      case actionTypes.FETCH:
        controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: action.meta.fetchedAt });
    }
    if (action.type === actionTypes.FETCH) {
      const { endpoint } = action;
      batch.forEach(action => controller.resolve(endpoint, { args: [], response: action, fetchedAt: Date.now() }));
      batch.forEach(action => controller.resolve(action.endpoint, { args: [], response: {}, fetchedAt: Date.now() }));
    }
    switch (kind) {
      case actionTypes.FETCH:
        controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
    }
    if (action.type === actionTypes.FETCH || action.type === actionTypes.SUBSCRIBE) {
      controller.resolve(action.endpoint, { args: action.args, response: {}, fetchedAt: Date.now() });
    }
    return next(action);
  };

  receive = ({ endpoint, args, meta }, response) =>
    this.controller.resolve(endpoint, { args, response, fetchedAt: Date.now() });

  push(response) {
    this.controller.resolve(getMessages, { args: [], response, fetchedAt: Date.now() });
  }

  relay(props, options) {
    this.controller.resolve(props.endpoint, { args: [], response: props.data, fetchedAt: Date.now() });
    const { endpoint } = options;
    this.controller.resolve(endpoint, { args: [], response: options.data, fetchedAt: Date.now() });
  }
}
      `,
      "passes a fetch action's fetchedAt instead of Date.now()",
    );
  });

  describe('__DC_CONTROLLERS__', () => {
    defineInlineTest(
      transform,
      { path: 'scripts/dump-store.js' },
      `
/* global copy */
// Paste into the browser console to copy the store
copy(JSON.stringify(globalThis.__DC_CONTROLLERS__.get('Data Client: Chat').getState()));
const first = [...window.__DC_CONTROLLERS__.values()][0];
const names = [...window.__DC_CONTROLLERS__.keys()];
const ids = Array.from(__DC_CONTROLLERS__.keys());
const state = await page.evaluate(() => (window as any).__DC_CONTROLLERS__.get(name).getState());
const maybe = debug ? __DC_CONTROLLERS__.get(name) : null;
const ok = ready && __DC_CONTROLLERS__.get('b').getState();
diff(__DC_CONTROLLERS__.get('Admin').getState(), __DC_CONTROLLERS__.get('Shop').getState());
const store = pick(), picked = __DC_CONTROLLERS__.get(store);
const pair = [name = next(), __DC_CONTROLLERS__.get(name)];
f([name] = next(), __DC_CONTROLLERS__.get(name));
const framed = getWindow().__DC_CONTROLLERS__.get('app').getState();
const ctrl = __DC_CONTROLLERS__.get(name);
if (!ctrl) return null;
const maybeState = __DC_CONTROLLERS__.get('c')?.getState();
for (const controller of __DC_CONTROLLERS__.values()) log(controller);
      `,
      `
/* global copy */
// Paste into the browser console to copy the store
globalThis.__DC__.store = 'Data Client: Chat';

copy(JSON.stringify(globalThis.__DC__.controller.getState()));
// TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores (it throws when the store is missing): https://dataclient.io/blog/2026/11/17/v0.19-batch-set#dc-global
const first = [...window.__DC_CONTROLLERS__.values()][0];
const names = window.__DC__.stores;
const ids = __DC__.stores;
const state = await page.evaluate(() => ((window as any).__DC__.store = name, (window as any).__DC__.controller).getState());
const maybe = debug ? (__DC__.store = name, __DC__.controller) : null;
const ok = ready && (__DC__.store = 'b', __DC__.controller).getState();
diff((__DC__.store = 'Admin', __DC__.controller).getState(), (__DC__.store = 'Shop', __DC__.controller).getState());
const store = pick(), picked = (__DC__.store = store, __DC__.controller);
const pair = [name = next(), (__DC__.store = name, __DC__.controller)];
f([name] = next(), (__DC__.store = name, __DC__.controller));
// TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores (it throws when the store is missing): https://dataclient.io/blog/2026/11/17/v0.19-batch-set#dc-global
const framed = getWindow().__DC_CONTROLLERS__.get('app').getState();
// TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores (it throws when the store is missing): https://dataclient.io/blog/2026/11/17/v0.19-batch-set#dc-global
const ctrl = __DC_CONTROLLERS__.get(name);
if (!ctrl) return null;
// TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores (it throws when the store is missing): https://dataclient.io/blog/2026/11/17/v0.19-batch-set#dc-global
const maybeState = __DC_CONTROLLERS__.get('c')?.getState();
// TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores (it throws when the store is missing): https://dataclient.io/blog/2026/11/17/v0.19-batch-set#dc-global
for (const controller of __DC_CONTROLLERS__.values())
  log(controller);
      `,
      'reads __DC__ instead, in files without a data-client import',
    );
    defineInlineTest(
      transform,
      { path: 'registry.ts' },
      `
const __DC_CONTROLLERS__ = new Map();
const n = __DC_CONTROLLERS__.get('a');
      `,
      `
const __DC_CONTROLLERS__ = new Map();
const n = __DC_CONTROLLERS__.get('a');
      `,
      "leaves a local variable with the global's name",
    );
    defineInlineTest(
      transform,
      { path: 'debug.js' },
      `
const c = __DC_CONTROLLERS__.get(...storeArgs);
      `,
      `
// TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores (it throws when the store is missing): https://dataclient.io/blog/2026/11/17/v0.19-batch-set#dc-global
const c = __DC_CONTROLLERS__.get(...storeArgs);
      `,
      'marks a lookup with a spread argument',
    );
    defineInlineTest(
      transform,
      { path: 'debug.js' },
      `
const frame = window.frames[0], controller = frame.__DC_CONTROLLERS__.get('app');
      `,
      `
const frame = window.frames[0], controller = (frame.__DC__.store = 'app', frame.__DC__.controller);
      `,
      'keeps the selection inline when the statement declares its receiver',
    );
  });

  describe('deprecated APIs', () => {
    defineInlineTest(
      transform,
      { path: 'resources.ts' },
      `
import { resource } from '@data-client/rest';

const PostResource = resource({ path: '/posts/:id', schema: Post }).extend('vote', { path: '/posts/:id/vote', method: 'POST' });
const UserResource = resource({ path: '/users/:id', schema: User }).extend({ getList: { path: '/team/users' } });
const TeamResource = resource({ path: '/teams/:id', schema: Team }).extend({ [key]: { path: '/orgs/teams' } });
const TagListResource = resource({ path: '/tags/:id', schema: Tag }).extend('create', { path: '/tags/new' });
const NoteResource = resource({ path: '/notes/:id', schema: Note }) as NoteResourceType;

export const createPost = (ctrl, body) => ctrl.fetch(PostResource.create, body);
export const createUser = (ctrl, body) => ctrl.fetch(UserResource.create, body);
export const createTeam = (ctrl, body) => ctrl.fetch(TeamResource.create, body);
export const createTagList = (ctrl, body) => ctrl.fetch(TagListResource.create, body);
export const createNote = (ctrl, body) => ctrl.fetch(NoteResource.create, body);
export const createTag = (ctrl, body) => ctrl.fetch(TagResource.create, body);
export const clone = Object.create(null);
      `,
      `
import { resource } from '@data-client/rest';

const PostResource = resource({ path: '/posts/:id', schema: Post }).extend('vote', { path: '/posts/:id/vote', method: 'POST' });
const UserResource = resource({ path: '/users/:id', schema: User }).extend({ getList: { path: '/team/users' } });
const TeamResource = resource({ path: '/teams/:id', schema: Team }).extend({ [key]: { path: '/orgs/teams' } });
const TagListResource = resource({ path: '/tags/:id', schema: Tag }).extend('create', { path: '/tags/new' });
const NoteResource = resource({ path: '/notes/:id', schema: Note }) as NoteResourceType;

export const createPost = (ctrl, body) => ctrl.fetch(PostResource.getList.push, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
export const createUser = (ctrl, body) => ctrl.fetch(UserResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
export const createTeam = (ctrl, body) => ctrl.fetch(TeamResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
export const createTagList = (ctrl, body) => ctrl.fetch(TagListResource.create, body);
export const createNote = (ctrl, body) => ctrl.fetch(NoteResource.getList.push, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
export const createTag = (ctrl, body) => ctrl.fetch(TagResource.create, body);
export const clone = Object.create(null);
      `,
      'renames create on a resource() declared here, and marks other resources',
    );

    defineInlineTest(
      transform,
      { path: 'index.tsx' },
      `
import { DevToolsManager } from '@data-client/react';

const devtools = new DevToolsManager({ actionsBlacklist: ['rdc/gc'], actionsWhitelist: ['rdc/fetch'] });
const both = new DevToolsManager({ actionsBlacklist: ['a'], actionsDenylist: ['b'] });
const defaults = getDefaultManagers({ devToolsManager: { actionsBlacklist: ['c'] } });
const payload = JSON.stringify({ actionsBlacklist: ['d'] });
      `,
      `
import { DevToolsManager } from '@data-client/react';

const devtools = new DevToolsManager({ actionsDenylist: ['rdc/gc'], actionsAllowlist: ['rdc/fetch'] });
const both = new DevToolsManager({ actionsBlacklist: ['a'], actionsDenylist: ['b'] });
const defaults = getDefaultManagers({ devToolsManager: { actionsDenylist: ['c'] } });
const payload = JSON.stringify({ actionsBlacklist: ['d'] });
      `,
      'renames the DevTools action filter options',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { renderDataHook } from '@data-client/test';

afterEach(() => {
  renderDataHook.cleanup();
});

it('loads', async () => {
  const { result, waitForNextUpdate } = renderDataHook(() => useThing(), { resolverFixtures });
  await waitForNextUpdate();
  expect(result.current).toBeDefined();
  await renderDataHook.allSettled();
});
      `,
      `
import { renderDataHook } from '@data-client/test';

afterEach(() => {
  // TODO(data-client): renderDataHook.cleanup() and .allSettled() act only on the latest render and are deprecated; use the ones each renderDataHook() call returns: https://dataclient.io/docs/api/renderDataHook#allsettled
  renderDataHook.cleanup();
});

it('loads', async () => {
  const { result, waitForNextUpdate } = renderDataHook(() => useThing(), { resolverFixtures });
  // TODO(data-client): waitForNextUpdate() is deprecated; await waitFor(() => expect(...)) on what the test waits for: https://dataclient.io/docs/api/renderDataHook#waitfor
  await waitForNextUpdate();
  expect(result.current).toBeDefined();
  // TODO(data-client): renderDataHook.cleanup() and .allSettled() act only on the latest render and are deprecated; use the ones each renderDataHook() call returns: https://dataclient.io/docs/api/renderDataHook#allsettled
  await renderDataHook.allSettled();
});
      `,
      'marks deprecated test helpers',
    );

    defineInlineTest(
      transform,
      { deprecations: false },
      DEPRECATIONS_INPUT,
      `
import { renderDataHook } from '@data-client/test';
import { resource } from '@data-client/rest';

const PostResource = resource({ path: '/posts/:id', schema: Post });
await ctrl.fetchIfStale(PostResource.get, { id });
ctrl.fetch(PostResource.create, body);
renderDataHook.cleanup();
      `,
      'skips deprecated APIs with --deprecations=false',
    );

    defineInlineTest(
      transform,
      { deprecations: 'only' },
      DEPRECATIONS_INPUT,
      `
import { renderDataHook } from '@data-client/test';
import { resource } from '@data-client/rest';

const PostResource = resource({ path: '/posts/:id', schema: Post });
await Promise.resolve(ctrl.fetchIfStale(PostResource.get, { id }));
ctrl.fetch(PostResource.getList.push, body);
// TODO(data-client): renderDataHook.cleanup() and .allSettled() act only on the latest render and are deprecated; use the ones each renderDataHook() call returns: https://dataclient.io/docs/api/renderDataHook#allsettled
renderDataHook.cleanup();
      `,
      'migrates only deprecated APIs with --deprecations=only',
    );

    it('rejects other --deprecations values', () => {
      expect(() =>
        applyTransform(
          transform,
          { deprecations: 'onyl' },
          {
            source: DEPRECATIONS_INPUT,
          },
        ),
      ).toThrow('--deprecations must be false or only');
    });

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { renderDataCompose } from '@data-client/vue/test';

const allSettled = () => flushPromises();
it('loads', async () => {
  const { waitForNextUpdate } = await renderDataCompose(() => useThing());
  await waitForNextUpdate();
});
      `,
      `
import { renderDataCompose } from '@data-client/vue/test';

const allSettled = () => flushPromises();
it('loads', async () => {
  const { waitForNextUpdate } = await renderDataCompose(() => useThing());
  // TODO(data-client): waitForNextUpdate() is deprecated; \`await result\` for the first load, and await allSettled() after changing props or calling the controller: https://dataclient.io/vue/guides/unit-testing-composables#renderdatacompose-api
  await waitForNextUpdate();
});
      `,
      'marks Vue waitForNextUpdate() when allSettled would shadow another name',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { renderDataCompose } from '@data-client/vue/test';

it('loads', async () => {
  const { result, waitForNextUpdate } = await renderDataCompose(() => useThing());
  await result;
  const step = async allSettled => {
    await allSettled();
    await waitForNextUpdate();
  };
  await step(flushPromises);
});

it('keeps allSettled', async () => {
  const { result, allSettled: settle, waitForNextUpdate } = await renderDataCompose(() => useThing());
  await result;
  const step = async settle => {
    await settle();
    await waitForNextUpdate();
  };
  await step(flushPromises);
});

it('waits in a block', async () => {
  const { result, waitForNextUpdate } = await renderDataCompose(() => useThing());
  await result;
  {
    const allSettled = 1;
    await waitForNextUpdate();
  }
});
      `,
      `
import { renderDataCompose } from '@data-client/vue/test';

it('loads', async () => {
  const { result, waitForNextUpdate } = await renderDataCompose(() => useThing());
  await result;
  const step = async allSettled => {
    await allSettled();
    // TODO(data-client): waitForNextUpdate() is deprecated; \`await result\` for the first load, and await allSettled() after changing props or calling the controller: https://dataclient.io/vue/guides/unit-testing-composables#renderdatacompose-api
    await waitForNextUpdate();
  };
  await step(flushPromises);
});

it('keeps allSettled', async () => {
  const { result, allSettled: settle, waitForNextUpdate } = await renderDataCompose(() => useThing());
  await result;
  const step = async settle => {
    await settle();
    // TODO(data-client): waitForNextUpdate() is deprecated; \`await result\` for the first load, and await allSettled() after changing props or calling the controller: https://dataclient.io/vue/guides/unit-testing-composables#renderdatacompose-api
    await waitForNextUpdate();
  };
  await step(flushPromises);
});

it('waits in a block', async () => {
  const { result, waitForNextUpdate } = await renderDataCompose(() => useThing());
  await result;
  {
    const allSettled = 1;
    // TODO(data-client): waitForNextUpdate() is deprecated; \`await result\` for the first load, and await allSettled() after changing props or calling the controller: https://dataclient.io/vue/guides/unit-testing-composables#renderdatacompose-api
    await waitForNextUpdate();
  }
});
      `,
      'marks Vue waitForNextUpdate() when a nested scope declares the new name',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { act } from '@testing-library/react';
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '../test-utils';

const { waitForNextUpdate } = renderDataHook(() => useSuspense(ThingResource.get));
await waitForNextUpdate();
      `,
      `
import { act } from '@testing-library/react';
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '../test-utils';

const { waitForNextUpdate } = renderDataHook(() => useSuspense(ThingResource.get));
// TODO(data-client): waitForNextUpdate() is deprecated; await waitFor(() => expect(...)) on what the test waits for: https://dataclient.io/docs/api/renderDataHook#waitfor
await waitForNextUpdate();
      `,
      'marks waitForNextUpdate() from a re-exported renderDataHook',
    );

    defineInlineTest(
      transform,
      { path: 'main.ts' },
      `
import { createDataClient, type ProvidedDataClient } from '@data-client/vue';

const client: ProvidedDataClient = createDataClient({ managers: () => [] });
      `,
      `
import { createDataClient, type ProvidedDataClient } from '@data-client/vue';

// TODO(data-client): createDataClient() and ProvidedDataClient are deprecated and will stop being exported; install the plugin with app.use(DataClientPlugin, options) and read the controller with useController(): https://dataclient.io/vue/api/DataClientPlugin
const client: ProvidedDataClient = createDataClient({ managers: () => [] });
      `,
      'marks createDataClient()',
    );

    defineInlineTest(
      transform,
      { path: 'posts.ts' },
      `
import { resource } from '@data-client/rest';

const PostResource = resource({ path: '/posts/:id', schema: Post });
let DraftResource = resource({ path: '/drafts/:id', schema: Draft });
DraftResource = makeOther();
const NoteResource = resource({ path: '/notes/:id', schema: Note });
NoteResource.getList = NoteResource.getList.extend({ path: '/team/notes' });
const TaskResource = resource({ path: '/tasks/:id', schema: Task, Endpoint: TaskEndpoint });
const KeyedResource = resource({ path: '/keyed/:id', schema: Keyed, key: keyByName });
const KeyResource = resource({ path: '/keys/:id', schema: Key, [optionKey]: KeyEndpoint });
const TagResource = resource({ path: '/tags/:id', schema: Tag });
Object.assign(TagResource.getList, { path: '/custom' });
const ListResource = resource({ path: '/lists/:id', schema: List });
const lists = ListResource.getList;
const PathResource = resource({ path: '/paths/:id', schema: Path });
[PathResource.getList.path] = ['/other'];
export const ExpResource = resource({ path: '/exps/:id', schema: Exp });
class LocalResource { static create() {} }

ctrl.fetch(/* new post */ PostResource.create, body);
PostResource.create(body);
const isCreate = action.endpoint === PostResource.create;
ctrl.fetch(DraftResource.create, body);
ctrl.fetch(NoteResource.create, body);
ctrl.fetch(TaskResource.create, body);
ctrl.fetch(KeyedResource.create, body);
ctrl.fetch(KeyResource.create, body);
ctrl.fetch(TagResource.create, body);
ctrl.fetch(ListResource.create, body);
ctrl.fetch(PathResource.create, body);
ctrl.fetch(ExpResource.create, body);
LocalResource.create();
function local(resource) {
  const ShadowResource = resource({});
  return ShadowResource.create;
}
      `,
      `
import { resource } from '@data-client/rest';

const PostResource = resource({ path: '/posts/:id', schema: Post });
let DraftResource = resource({ path: '/drafts/:id', schema: Draft });
DraftResource = makeOther();
const NoteResource = resource({ path: '/notes/:id', schema: Note });
NoteResource.getList = NoteResource.getList.extend({ path: '/team/notes' });
const TaskResource = resource({ path: '/tasks/:id', schema: Task, Endpoint: TaskEndpoint });
const KeyedResource = resource({ path: '/keyed/:id', schema: Keyed, key: keyByName });
const KeyResource = resource({ path: '/keys/:id', schema: Key, [optionKey]: KeyEndpoint });
const TagResource = resource({ path: '/tags/:id', schema: Tag });
Object.assign(TagResource.getList, { path: '/custom' });
const ListResource = resource({ path: '/lists/:id', schema: List });
const lists = ListResource.getList;
const PathResource = resource({ path: '/paths/:id', schema: Path });
[PathResource.getList.path] = ['/other'];
export const ExpResource = resource({ path: '/exps/:id', schema: Exp });
class LocalResource { static create() {} }

ctrl.fetch(/* new post */ PostResource.getList.push, body);
PostResource.getList.push(body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
const isCreate = action.endpoint === PostResource.create;
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
ctrl.fetch(DraftResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
ctrl.fetch(NoteResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
ctrl.fetch(TaskResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
ctrl.fetch(KeyedResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
ctrl.fetch(KeyResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
ctrl.fetch(TagResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
ctrl.fetch(ListResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
ctrl.fetch(PathResource.create, body);
ctrl.fetch(ExpResource.getList.push, body);
LocalResource.create();
function local(resource) {
  const ShadowResource = resource({});
  // TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
  return ShadowResource.create;
}
      `,
      'renames create only where it runs on a resource() nothing changes',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { renderHook } from '@testing-library/react-hooks';
import { DevToolsManager } from '@data-client/react';

const { waitForNextUpdate } = renderHook(() => useThing());
await waitForNextUpdate();
const devtools = new DevToolsManager({ ...base, actionsBlacklist: ['a'] });
const other = configure({ devToolsManager: { actionsBlacklist: ['b'] } });
const keyed = new DevToolsManager({ [filterKey]: modern, actionsBlacklist: ['c'] });
      `,
      `
import { renderHook } from '@testing-library/react-hooks';
import { DevToolsManager } from '@data-client/react';

const { waitForNextUpdate } = renderHook(() => useThing());
await waitForNextUpdate();
const devtools = new DevToolsManager({ ...base, actionsBlacklist: ['a'] });
const other = configure({ devToolsManager: { actionsBlacklist: ['b'] } });
const keyed = new DevToolsManager({ [filterKey]: modern, actionsBlacklist: ['c'] });
      `,
      'leaves other libraries, and DevTools options with a spread or computed key, alone',
    );

    defineInlineTest(
      transform,
      { path: 'useThing.test.ts' },
      `
import { renderDataHook } from '@data-client/test';

let hook;
beforeEach(() => {
  hook = renderDataHook(() => useThing());
});
it('loads', async () => {
  await hook.waitForNextUpdate();
  await globalHook.waitForNextUpdate();
});
      `,
      `
import { renderDataHook } from '@data-client/test';

let hook;
beforeEach(() => {
  hook = renderDataHook(() => useThing());
});
it('loads', async () => {
  await hook.waitForNextUpdate();
  await globalHook.waitForNextUpdate();
});
      `,
      'skips waitForNextUpdate() whose render helper it cannot trace',
    );
    defineInlineTest(
      transform,
      { path: 'useArticle.test.ts', deprecations: 'only' },
      `
import { reactive } from 'vue';
import { renderDataCompose } from '@data-client/vue/test';

it('loads', async () => {
  const props = reactive({ id: 5 });
  const { result, waitForNextUpdate } = await renderDataCompose(
    (props: { id: number }) => useSuspense(ArticleResource.get, () => ({ id: props.id })),
    { props, resolverFixtures },
  );
  await waitForNextUpdate();
  const article = await result;

  props.id = 6;
  await waitForNextUpdate();
});

it('keeps allSettled', async () => {
  const { result, allSettled: settle, waitForNextUpdate } = await renderDataCompose(() => useThing());
  expect(result.value).toBeUndefined();
  await waitForNextUpdate();
  expect(result.value).toBeDefined();
  await settle();
});

it('marks a first wait for a result it does not await', async () => {
  const { result, waitForNextUpdate } = await renderDataCompose(() => useTimer());
  await waitForNextUpdate();
  expect(result.value).toBe(true);
});

it('renames an alias', async () => {
  const rendered = await renderDataCompose(() => useThing());
  await rendered.waitForNextUpdate();
  await rendered.result;
  const { waitForNextUpdate: next } = await renderDataCompose(() => useOther());
  await next();
});

it('drops a wait before expect(await result)', async () => {
  const { result, waitForNextUpdate } = await renderDataCompose(() => useThing());
  await waitForNextUpdate();
  expect(await result).toBeDefined();
});

it('awaits result where the next statement reads first', async () => {
  const { result, waitForNextUpdate } = await renderDataCompose(() => useThing());
  await waitForNextUpdate();
  const snapshot = ready, value = await result;
  const rendered = await renderDataCompose(() => useThing());
  await rendered.waitForNextUpdate();
  expect(ready).toBe(await rendered.result);
});
      `,
      `
import { reactive } from 'vue';
import { renderDataCompose } from '@data-client/vue/test';

it('loads', async () => {
  const props = reactive({ id: 5 });
  const { result, allSettled } = await renderDataCompose(
    (props: { id: number }) => useSuspense(ArticleResource.get, () => ({ id: props.id })),
    { props, resolverFixtures },
  );
  const article = await result;

  props.id = 6;
  await allSettled();
});

it('keeps allSettled', async () => {
  const {
    result,
    allSettled: settle
  } = await renderDataCompose(() => useThing());
  expect(result.value).toBeUndefined();
  await settle();
  expect(result.value).toBeDefined();
  await settle();
});

it('marks a first wait for a result it does not await', async () => {
  const { result, waitForNextUpdate } = await renderDataCompose(() => useTimer());
  // TODO(data-client): waitForNextUpdate() is deprecated; \`await result\` for the first load, and await allSettled() after changing props or calling the controller: https://dataclient.io/vue/guides/unit-testing-composables#renderdatacompose-api
  await waitForNextUpdate();
  expect(result.value).toBe(true);
});

it('renames an alias', async () => {
  const rendered = await renderDataCompose(() => useThing());
  await rendered.result;
  const { waitForNextUpdate: next } = await renderDataCompose(() => useOther());
  await next();
});

it('drops a wait before expect(await result)', async () => {
  const {
    result
  } = await renderDataCompose(() => useThing());
  expect(await result).toBeDefined();
});

it('awaits result where the next statement reads first', async () => {
  const {
    result
  } = await renderDataCompose(() => useThing());
  await result;
  const snapshot = ready, value = await result;
  const rendered = await renderDataCompose(() => useThing());
  await rendered.result;
  expect(ready).toBe(await rendered.result);
});
      `,
      'turns Vue waitForNextUpdate() into allSettled(), dropping a first wait before await result',
    );

    defineInlineTest(
      transform,
      { path: 'entities.ts', deprecations: 'only' },
      `
import { Entity } from '@data-client/rest';

class User extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: any[]) {
    return \`\${value.id}-\${args?.[0]?.org}\`;
  }
}
class Member extends User {
  static pk(value: any, parent: any, key: string, args: Array<any> | undefined = []): string {
    return super.pk(value, parent, key, [...args].slice(1));
  }
}
class Sorted extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: any[]) {
    return args?.sort().join(',');
  }
}
class Done extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: readonly any[]) {
    return value.id;
  }
}
class Grouped extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: [{ group: string }]) {
    return args?.[0]?.group;
  }
}
class Named extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: Args) {
    return value.id;
  }
}
class Plain {
  static pk(value: any, parent?: any, key?: string, args?: any[]) {
    return value.id;
  }
}
      `,
      `
import { Entity } from '@data-client/rest';

class User extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: readonly any[]) {
    return \`\${value.id}-\${args?.[0]?.org}\`;
  }
}
class Member extends User {
  static pk(value: any, parent: any, key: string, args: ReadonlyArray<any> | undefined = []): string {
    return super.pk(value, parent, key, [...args].slice(1));
  }
}
class Sorted extends Entity {
  // TODO(data-client): a future release types Entity.pk() args as readonly any[]; make this parameter readonly: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#future-pk-args
  static pk(value: any, parent?: any, key?: string, args?: any[]) {
    return args?.sort().join(',');
  }
}
class Done extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: readonly any[]) {
    return value.id;
  }
}
class Grouped extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: readonly [{ group: string }]) {
    return args?.[0]?.group;
  }
}
class Named extends Entity {
  // TODO(data-client): a future release types Entity.pk() args as readonly any[]; make this parameter readonly: https://dataclient.io/blog/2026/11/17/v0.19-batch-set#future-pk-args
  static pk(value: any, parent?: any, key?: string, args?: Args) {
    return value.id;
  }
}
class Plain {
  static pk(value: any, parent?: any, key?: string, args?: any[]) {
    return value.id;
  }
}
      `,
      'types static pk() args readonly',
    );
    defineInlineTest(
      transform,
      { path: 'seed.tsx', deprecations: 'only' },
      `
import { useController } from '@data-client/react';
import { resource } from '@data-client/rest';
import { UserResource } from '@acme/api';
import * as api from './api';
export async function seed(ctrl, users) {
  await ctrl.fetch(UserResource.create, users[0]);
  await ctrl.fetch(api.PostResource.create, {});
  if (users.length > 1) {
    const UserResource = resource({ path: '/other/:id', schema: User });
    await ctrl.fetch(UserResource.get, { id: 1 });
  }
}
      `,
      `
import { useController } from '@data-client/react';
import { resource } from '@data-client/rest';
import { UserResource } from '@acme/api';
import * as api from './api';
export async function seed(ctrl, users) {
  // TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
  await ctrl.fetch(UserResource.create, users[0]);
  // TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
  await ctrl.fetch(api.PostResource.create, {});
  if (users.length > 1) {
    const UserResource = resource({ path: '/other/:id', schema: User });
    await ctrl.fetch(UserResource.get, { id: 1 });
  }
}
      `,
      'marks create on a package resource, despite a local resource of that name in a later block, and on a namespace import',
    );
    describe('resource().create imported from another module', () => {
      const fs = require('node:fs');
      const os = require('node:os');
      const path = require('node:path');
      let dir;
      beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codemods-v0.19-'));
        const write = (file, source) => {
          fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
          fs.writeFileSync(path.join(dir, file), source);
        };
        write(
          'resources/post.ts',
          `
import { resource } from '@data-client/rest';

export const PostResource = resource({ path: '/posts/:id', schema: Post });
const Notes = resource({ path: '/notes/:id', schema: Note });
export { Notes as NoteResource };
export const UserResource = resource({ path: '/users/:id', schema: User }).extend({ getList: { path: '/team' } });
export let DraftResource = resource({ path: '/drafts/:id', schema: Draft });
export const CommentResource = resource({ path: '/comments/:id', schema: Comment });
`,
        );
        write(
          'tsconfig.json',
          `{ "compilerOptions": { "paths": { "@/*": ["./*"], "@/resources/*": ["./api/*"] } } }\n`,
        );
        write('resources/index.ts', `export * from './post';\n`);
        // `@/resources/post` resolves here, by the longer alias
        write(
          'api/post.ts',
          `
import { resource } from '@data-client/rest';

export const PostResource = resource({ path: '/posts/:id', schema: Post }).extend({ getList: { path: '/feed' } });
`,
        );
        write(
          'custom.ts',
          `
import { resource } from './base';

export const TagResource = resource({ path: '/tags/:id', schema: Tag });
`,
        );
        // create-vite: a solution-style tsconfig.json whose aliases are in a referenced config
        write(
          'vite/tsconfig.json',
          `{ "files": [], "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.app.json" }] }\n`,
        );
        write(
          'vite/tsconfig.node.json',
          // its own `@/*` alias, for files outside src
          `{ "extends": "./tsconfig.json", "compilerOptions": { "paths": { "@/*": ["./server/*"] } }, "include": ["vite.config.ts", "server"] }\n`,
        );
        write(
          'vite/server/api/Post.ts',
          `
import { resource } from '@data-client/rest';

export const PostResource = resource({ path: '/posts/:id', schema: Post }).extend({ getList: { path: '/feed' } });
`,
        );
        write(
          'vite/tsconfig.app.json',
          // extending the solution config that references it must not loop
          `{ "extends": "./tsconfig.json", "compilerOptions": { "paths": { "@/*": ["./src/*"] } }, "include": ["src"] }\n`,
        );
        write(
          'vite/src/api/Post.ts',
          `
import { resource } from '@data-client/rest';

export const PostResource = resource({ path: '/posts/:id', schema: Post });
`,
        );
      });
      afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

      it('stops at a referenced config that extends the solution config', () => {
        const read = jest.spyOn(fs, 'readFileSync');
        try {
          jest.isolateModules(() => {
            const resolveModule = require('../../resolveModule');
            expect(
              resolveModule(path.join(dir, 'vite/src/x.ts'), '@/api/Post'),
            ).toBe(path.join(dir, 'vite/src/api/Post.ts'));
          });
          const configReads = read.mock.calls.filter(([file]) =>
            /tsconfig/.test(String(file)),
          );
          expect(configReads.length).toBeLessThan(10);
        } finally {
          read.mockRestore();
        }
      });

      it('picks the referenced config whose include names the importing file', () => {
        jest.isolateModules(() => {
          const resolveModule = require('../../resolveModule');
          expect(
            resolveModule(path.join(dir, 'vite/vite.config.ts'), '@/api/Post'),
          ).toBe(path.join(dir, 'vite/server/api/Post.ts'));
          // a neighbour that no config includes resolves no alias
          expect(
            resolveModule(path.join(dir, 'vite/other.ts'), '@/api/Post'),
          ).toBeUndefined();
        });
      });

      it('follows tsconfig references to the config with path aliases that includes the file', () => {
        const source = `
import { useController } from '@data-client/react';
import { PostResource as P2 } from '@/api/Post';
export const createPost = (ctrl, body) => ctrl.fetch(P2.create, body);
`;
        expect(
          applyTransform(
            transform,
            { deprecations: 'only' },
            { source, path: path.join(dir, 'vite/src/hooks/usePost.ts') },
          ),
        ).toBe(
          `
import { useController } from '@data-client/react';
import { PostResource as P2 } from '@/api/Post';
export const createPost = (ctrl, body) => ctrl.fetch(P2.getList.push, body);
`.trim(),
        );
      });

      it('renames create on a plain resource() the module exports, through re-exports and path aliases', () => {
        const source = `
import { useController } from '@data-client/react';
import { PostResource, NoteResource, UserResource, DraftResource } from '../resources';
import { PostResource as Posts } from '../resources/post.js';
import { TagResource } from '../custom';
import { CommentResource } from '@/resources';
import { PostResource as FeedResource } from '@/resources/post';

export function useCreate() {
  const ctrl = useController();
  return body => [
    ctrl.fetch(PostResource.create, body),
    ctrl.fetch(NoteResource.create, body),
    ctrl.fetch(Posts.create, body),
  ];
}
export const createUser = (ctrl, body) => ctrl.fetch(UserResource.create, body);
export const createDraft = (ctrl, body) => ctrl.fetch(DraftResource.create, body);
export const createTag = (ctrl, body) => ctrl.fetch(TagResource.create, body);
export const createComment = (ctrl, body) => ctrl.fetch(CommentResource.create, body);
export const createFeed = (ctrl, body) => ctrl.fetch(FeedResource.create, body);
`;
        expect(
          applyTransform(
            transform,
            { deprecations: 'only' },
            { source, path: path.join(dir, 'hooks/useCreate.ts') },
          ),
        ).toBe(
          `
import { useController } from '@data-client/react';
import { PostResource, NoteResource, UserResource, DraftResource } from '../resources';
import { PostResource as Posts } from '../resources/post.js';
import { TagResource } from '../custom';
import { CommentResource } from '@/resources';
import { PostResource as FeedResource } from '@/resources/post';

export function useCreate() {
  const ctrl = useController();
  return body => [
    ctrl.fetch(PostResource.getList.push, body),
    ctrl.fetch(NoteResource.getList.push, body),
    ctrl.fetch(Posts.getList.push, body),
  ];
}
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
export const createUser = (ctrl, body) => ctrl.fetch(UserResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
export const createDraft = (ctrl, body) => ctrl.fetch(DraftResource.create, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
export const createTag = (ctrl, body) => ctrl.fetch(TagResource.create, body);
export const createComment = (ctrl, body) => ctrl.fetch(CommentResource.getList.push, body);
// TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push
export const createFeed = (ctrl, body) => ctrl.fetch(FeedResource.create, body);
`.trim(),
        );
      });
    });
  });

  describe('optional improvements', () => {
    const ENTITIES = `
import { Entity, Invalidate, resource } from '@data-client/rest';
import type { Controller } from '@data-client/react';

class Ticker extends Entity {
  product_id = '';
  price = 0;
  pk() {
    return this.product_id;
  }
}
class Todo extends Entity {
  id = 0;
  title = '';
  static schema = { author: User, createdAt: Date };
}
class User extends Entity {
  id = 0;
  static schema = { todos: [Todo] };
}
const TodoResource = resource({ path: '/users/:userId/todos/:id', schema: Todo });
`;

    defineInlineTest(
      transform,
      { improvements: 'only' },
      `${ENTITIES}
export function onMessage(ctrl: Controller, event: MessageEvent) {
  const rows = JSON.parse(event.data);
  for (const row of rows) {
    ctrl.set(Ticker, { product_id: row.product_id }, row);
  }
  rows.forEach(row => ctrl.set(User, row.author));
}
export function addTodos(ctrl: Controller, userId: string, todos: Todo[]) {
  for (const todo of todos) {
    ctrl.set(TodoResource.getList.schema.push, { userId } as any, todo);
  }
}
export async function saveTodos(ctrl: Controller, todos: readonly Todo[]) {
  await Promise.all(todos.map(todo => ctrl.set(Todo, { id: todo.id }, { ...todo, title: todo.title.trim() })));
  todos.forEach(todo => ctrl.set(User, todo.author));
}
export function deleteTodos(ctrl: Controller, ids: string[]) {
  for (const id of ids) ctrl.set([new Invalidate(Todo)], [{ id }]);
}
export function seed(ctrl: Controller, more: { product_id: string; price: number }[]) {
  const rows = [{ product_id: 'BTC', price: 1 }];
  rows.forEach(row => ctrl.set(Ticker, row));
  more.forEach(row => ctrl.set(Ticker, row));
  Object.values(JSON.parse(text)).forEach(row => ctrl.set(Ticker, row));
}
      `,
      `${ENTITIES}
export function onMessage(ctrl: Controller, event: MessageEvent) {
  const rows = JSON.parse(event.data);

  if (rows.length) {
    ctrl.set([Ticker], rows);
  }

  rows.forEach(row => ctrl.set(User, row.author));
}
export function addTodos(ctrl: Controller, userId: string, todos: Todo[]) {
  for (const todo of todos) {
    ctrl.set(TodoResource.getList.schema.push, { userId } as any, todo);
  }
}
export async function saveTodos(ctrl: Controller, todos: readonly Todo[]) {
  if (todos.length) {
    await ctrl.set([Todo], todos.map(todo => ({ ...todo, title: todo.title.trim() })));
  }

  todos.forEach(todo => ctrl.set(User, todo.author));
}
export function deleteTodos(ctrl: Controller, ids: string[]) {
  if (ids.length) {
    ctrl.set([new Invalidate(Todo)], Array.from(ids, id => ({ id })));
  }
}
export function seed(ctrl: Controller, more: { product_id: string; price: number }[]) {
  const rows = [{ product_id: 'BTC', price: 1 }];
  rows.forEach(row => ctrl.set(Ticker, row));

  if (more.length) {
    ctrl.set([Ticker], more);
  }

  const rows2 = Object.values(JSON.parse(text));

  if (rows2.length) {
    ctrl.set([Ticker], rows2);
  }
}
      `,
      'batches loops of set() into one set()',
    );

    defineInlineTest(
      transform,
      { improvements: 'only' },
      `
import { Entity, schema, resource } from '@data-client/rest';

class Base extends Entity {
  static process(value, parent) {
    return { ...value, parentId: parent.id };
  }
}
class Row extends Base { id = 0; }
class Slugged extends Entity {
  slug = '';
  static pk(value, parent, key, args) {
    return args[0].slug;
  }
}
class Checked extends Entity {
  id = 0;
  static validate(value) {
    return value.id ? undefined : 'missing id';
  }
}
class Plain extends schema.Entity { id = 0; }
class Versioned extends Entity {
  id = 0;
  static shouldUpdate(existingMeta, incomingMeta, existing, incoming) {
    return incoming.version > existing.version;
  }
}
class Assigned extends Entity { id = 0; }
Assigned.schema = { child: Slugged };
const PostResource = resource({ path: '/posts/:id', schema: Plain, Collection: SortedCollection });

export async function update(ctrl, rows: Plain[], picked: Set<Plain>, data) {
  for (var a of rows) ctrl.set(Plain, a);
  const done = await Promise.all(rows.map(b => ctrl.set(Plain, b)));
  rows.forEach((c, i) => ctrl.set(Plain, c));
  rows.forEach(d => ctrl.set(Plain, { id: makeId() }, d));
  rows.forEach(e => ctrl.set(Plain, { ...e, old: ctrl.get(Plain, e) }));
  rows.forEach(f => ctrl.set(Plain, { id: f.id }, prev => ({ ...prev, ...f })));
  rows.forEach(g => ctrl.set(Row, { id: g.id }));
  rows.forEach(h => ctrl.set(Slugged, { slug: h.slug }, h));
  rows.forEach(k => ctrl.set(Checked, { id: k.id }));
  rows.forEach(m => ctrl.set(PostResource.getList.schema.push, m));
  rows.forEach(n => ctrl.set(OtherResource.getList.schema.push, n));
  rows.forEach(o => ctrl.set(Plain.getList.schema.unshift, o));
  for (const p of picked) ctrl.set(Plain, p);
  for (const q of data.rows) ctrl.set(Plain, q);
  for (const r of rows) {
    if (r.id) ctrl.set(Plain, r);
  }
  const byType = new Map();
  rows.forEach(s => byType.set(Plain, s));
  await Promise.all(rows.map(t => { ctrl.set(Plain, t); }));
  rows.forEach(u => ctrl.set(Plain, { id: u.id }, u.apply));
  const updaters: Array<(prev: Plain) => Plain> = [];
  updaters.forEach(v => ctrl.set(Plain, { id: 1 }, v));
  const typedUpdaters: Updater[] = [];
  typedUpdaters.forEach(y => ctrl.set(Plain, { id: 1 }, y));
  rows.forEach(({ id, apply }) => ctrl.set(Plain, { id }, apply));
  const literal = [{ id: 1, apply: prev => prev }];
  literal.forEach(z => ctrl.set(Plain, { id: z.id }, z.apply));
  rows.forEach(w => ctrl.set(Versioned, { id: w.id }));
  const parsed = JSON.parse(data);
  parsed.forEach(({ id, apply = prev => prev }) => ctrl.set(Plain, { id }, apply));
  parsed.forEach(m2 => ctrl.set(Plain, { id: m2.id }, m2.toString));
  const optional: { id?: number }[] = [];
  optional.forEach(u2 => ctrl.set(Plain, u2));
  const named: { name: string }[] = [];
  named.forEach(v2 => ctrl.set(Plain, v2));
  parsed.forEach(w2 => ctrl.set(Plain, w2.data));
  const empty: {}[] = [];
  empty.forEach(q2 => ctrl.set(Plain, q2));
  rows.forEach(x => ctrl.set(Assigned, { id: x.id }));
}
      `,
      `
import { Entity, schema, resource } from '@data-client/rest';

class Base extends Entity {
  static process(value, parent) {
    return { ...value, parentId: parent.id };
  }
}
class Row extends Base { id = 0; }
class Slugged extends Entity {
  slug = '';
  static pk(value, parent, key, args) {
    return args[0].slug;
  }
}
class Checked extends Entity {
  id = 0;
  static validate(value) {
    return value.id ? undefined : 'missing id';
  }
}
class Plain extends schema.Entity { id = 0; }
class Versioned extends Entity {
  id = 0;
  static shouldUpdate(existingMeta, incomingMeta, existing, incoming) {
    return incoming.version > existing.version;
  }
}
class Assigned extends Entity { id = 0; }
Assigned.schema = { child: Slugged };
const PostResource = resource({ path: '/posts/:id', schema: Plain, Collection: SortedCollection });

export async function update(ctrl, rows: Plain[], picked: Set<Plain>, data) {
  for (var a of rows) ctrl.set(Plain, a);
  const done = await Promise.all(rows.map(b => ctrl.set(Plain, b)));
  rows.forEach((c, i) => ctrl.set(Plain, c));
  rows.forEach(d => ctrl.set(Plain, { id: makeId() }, d));
  rows.forEach(e => ctrl.set(Plain, { ...e, old: ctrl.get(Plain, e) }));
  rows.forEach(f => ctrl.set(Plain, { id: f.id }, prev => ({ ...prev, ...f })));
  rows.forEach(g => ctrl.set(Row, { id: g.id }));
  rows.forEach(h => ctrl.set(Slugged, { slug: h.slug }, h));
  rows.forEach(k => ctrl.set(Checked, { id: k.id }));
  rows.forEach(m => ctrl.set(PostResource.getList.schema.push, m));
  rows.forEach(n => ctrl.set(OtherResource.getList.schema.push, n));
  rows.forEach(o => ctrl.set(Plain.getList.schema.unshift, o));
  for (const p of picked) ctrl.set(Plain, p);
  for (const q of data.rows) ctrl.set(Plain, q);
  for (const r of rows) {
    if (r.id) ctrl.set(Plain, r);
  }
  const byType = new Map();
  rows.forEach(s => byType.set(Plain, s));
  await Promise.all(rows.map(t => { ctrl.set(Plain, t); }));
  rows.forEach(u => ctrl.set(Plain, { id: u.id }, u.apply));
  const updaters: Array<(prev: Plain) => Plain> = [];
  updaters.forEach(v => ctrl.set(Plain, { id: 1 }, v));
  const typedUpdaters: Updater[] = [];
  typedUpdaters.forEach(y => ctrl.set(Plain, { id: 1 }, y));
  rows.forEach(({ id, apply }) => ctrl.set(Plain, { id }, apply));
  const literal = [{ id: 1, apply: prev => prev }];
  literal.forEach(z => ctrl.set(Plain, { id: z.id }, z.apply));
  rows.forEach(w => ctrl.set(Versioned, { id: w.id }));
  const parsed = JSON.parse(data);
  parsed.forEach(({ id, apply = prev => prev }) => ctrl.set(Plain, { id }, apply));
  parsed.forEach(m2 => ctrl.set(Plain, { id: m2.id }, m2.toString));
  const optional: { id?: number }[] = [];
  optional.forEach(u2 => ctrl.set(Plain, u2));
  const named: { name: string }[] = [];
  named.forEach(v2 => ctrl.set(Plain, v2));
  parsed.forEach(w2 => ctrl.set(Plain, w2.data));
  const empty: {}[] = [];
  empty.forEach(q2 => ctrl.set(Plain, q2));
  rows.forEach(x => ctrl.set(Assigned, { id: x.id }));
}
      `,
      'keeps set() loops that a batch could write differently',
    );

    describe('set() loops whose rows call functions', () => {
      const run = (setup, value) => {
        const source = `import { Entity } from '@data-client/rest';
import { toId } from './ids';
class Todo extends Entity { id = ''; }
${setup}
export async function save(ctrl, rows: any[]) {
  for (const row of rows) await ctrl.set(Todo, ${value});
}`;
        return applyTransform(
          transform,
          { improvements: 'only' },
          { source, path: 'save.tsx' },
        );
      };

      it.each([
        ['a global', '{ id: String(row.id), at: new Date(row.at) }'],
        ['a method of the row', '{ id: row.id.trim() }'],
        ['an imported function', '{ id: toId(row) }'],
        [
          'a method of a callback parameter',
          '{ id: row.id, tags: row.tags.map(tag => tag.trim()) }',
        ],
        ['a method of a literal', "{ id: 'todo-'.concat(row.id) }"],
        ['a method of a built value', '{ id: new Date(row.at).toISOString() }'],
        ['a method of an expression', "{ id: (row.name || '').trim() }"],
        [
          'a method of an array literal',
          "{ id: [row.first, row.last].join(' ') }",
        ],
        [
          'a method with a row field named like a local function',
          '{ id: row.id.concat(row.currentCount) }',
        ],
        [
          'a global with a literal constant',
          '{ id: row.id, n: Math.min(row.n, LIMIT) }',
        ],
        [
          'a global with a negative constant',
          '{ id: row.id, n: Math.max(row.n, MIN) }',
        ],
        ['a global tag with row values', '{ id: String.raw`${row.id}` }'],
      ])('batches rows that call %s', (_, value) => {
        expect(
          run(
            'function currentCount() {\n  return 0;\n}\nconst LIMIT = 3;\nconst MIN = -1;',
            value,
          ),
        ).toContain('await ctrl.set([Todo], Array.from(');
      });

      it.each([
        [
          'a function the module declares',
          `export const latest = { ctrl: undefined as any };
function currentCount(id: string) {
  const { ctrl } = latest;
  return ctrl.get(Todo, { id }, ctrl.getState())?.count ?? 0;
}`,
          '{ id: row.id, count: currentCount(row.id) + 1 }',
        ],
        [
          'a function the module declares through a sequence',
          `function currentCount(id: string) {
  return id.length;
}`,
          '{ id: row.id, count: (0, currentCount)(row.id) }',
        ],
        [
          'a function the module declares passed to map()',
          `function currentCount(id: string) {
  return id.length;
}`,
          '{ id: row.id, count: [row.id].map(currentCount)[0] }',
        ],
        [
          'a class the module declares',
          `class Counter {
  constructor(public id: string) {}
}`,
          '{ id: new Counter(row.id).id }',
        ],
        [
          'a value the module builds, passed to map()',
          `const format = makeFormatter();`,
          '{ id: row.id, tags: row.tags.map(format) }',
        ],
        [
          'an alias of a function the module declares',
          `function countOf(id: string) {
  return id.length;
}
const alias = countOf;`,
          '{ id: row.id, tags: row.tags.map(alias) }',
        ],
        ['a method of this', '', '{ id: this.format(row.id) }'],
        [
          'a method of a local object passed to map()',
          `const helpers = { format: (tag: string) => tag };`,
          '{ id: row.id, tags: row.tags.map(helpers.format) }',
        ],
        [
          'a method of this passed to map()',
          '',
          '{ id: row.id, tags: row.tags.map(this.format) }',
        ],
        [
          'a function the module declares inside an argument',
          `function currentCount(id: string) {
  return id.length;
}`,
          '{ id: row.id, n: Object.values({ count: currentCount })[0](row.id) }',
        ],
        [
          'a tagged template the module declares',
          `const tag = (strings: TemplateStringsArray, id: string) => id;`,
          '{ id: tag`${row.id}` }',
        ],
        [
          'a method of a local object',
          `const counter = { next: (id: string) => id };`,
          '{ id: counter.next(row.id) }',
        ],
        [
          'a global tag with a function the module declares',
          `function currentCount(id: string) {
  return id.length;
}`,
          '{ id: row.id, n: String.raw`${currentCount}` }',
        ],
        [
          'a global with a let',
          `let LIMIT = 3;`,
          '{ id: row.id, n: Math.min(row.n, LIMIT) }',
        ],
        [
          'a global with a computed constant',
          `const LIMIT = makeLimit();`,
          '{ id: row.id, n: Math.min(row.n, LIMIT) }',
        ],
      ])('keeps rows that call %s', (_, setup, value) => {
        expect(run(setup, value)).toContain('for (const row of rows)');
      });

      it('keeps rows that pass a parameter of the enclosing function', () => {
        const source = `import { Entity } from '@data-client/rest';
class Todo extends Entity { id = ''; }
export function save(ctrl, rows: any[], format: (tag: string) => string) {
  rows.forEach(row => ctrl.set(Todo, { id: row.id, tags: row.tags.map(format) }));
}`;
        expect(
          applyTransform(
            transform,
            { improvements: 'only' },
            { source, path: 'save.tsx' },
          ),
        ).toContain('rows.forEach(');
      });

      it('keeps rows that call a method of super', () => {
        const source = `import { Entity } from '@data-client/rest';
import { Base } from './base';
class Todo extends Entity { id = ''; }
export class Saver extends Base {
  save(ctrl, rows: any[]) {
    rows.forEach(row => ctrl.set(Todo, { id: row.id, n: super.count(row.id) }));
  }
}`;
        expect(
          applyTransform(
            transform,
            { improvements: 'only' },
            { source, path: 'save.tsx' },
          ),
        ).toContain('rows.forEach(');
      });
    });

    describe('set() loops whose loop variable runs code', () => {
      const run = (setup, loop) =>
        applyTransform(
          transform,
          { improvements: 'only' },
          {
            source: `import { Entity } from '@data-client/rest';
class Todo extends Entity { id = ''; count = 0; }
${setup}
export async function save(ctrl, text: string) {
  ${loop}
}`,
            path: 'save.tsx',
          },
        );

      it('keeps a default that calls a function', () => {
        expect(
          run(
            `function currentCount(id: string) {
  return id.length;
}`,
            `for (const { id, count = currentCount(id) } of JSON.parse(text))
    await ctrl.set(Todo, { id, count: count + 1 });`,
          ),
        ).toContain('for (const { id, count = currentCount(id) }');
      });

      it('batches a literal default', () => {
        expect(
          run(
            '',
            `for (const { id, count = 0 } of JSON.parse(text))
    await ctrl.set(Todo, { id, count: count + 1 });`,
          ),
        ).toContain('await ctrl.set([Todo], Array.from(');
      });

      it.each([
        ['an optional call', 'count = currentCount?.(id)'],
        ['an optional method call', 'count = counter?.next(id)'],
        ['an update', 'count = n++'],
        ['a computed key that calls a function', '[key()]: count = 0'],
        ['a nested call', 'meta: { count = currentCount(id) }'],
        ['a call in an array pattern', 'counts: [count = currentCount(id)]'],
      ])('keeps a default or key with %s', (_, binding) => {
        const loop = `for (const { id, ${binding} } of JSON.parse(text))
    await ctrl.set(Todo, { id, count: count + 1 });`;
        expect(
          run(
            `function currentCount(id: string) {
  return id.length;
}
const counter = { next: (id: string) => id.length };
let n = 0;
const key = () => 'count';`,
            loop,
          ),
        ).toContain('for (const {');
      });

      it('batches defaults that are references and literals', () => {
        expect(
          run(
            'const NONE = 0;',
            `for (const { id, count = NONE, tags = [], ['a']: a = '', rank = -1, label = \`Untitled\`, ...rest } of JSON.parse(text))
    await ctrl.set(Todo, { id, count, tags, a, rank, label, rest });`,
          ),
        ).toContain('await ctrl.set([Todo], Array.from(');
      });

      it.each([
        [
          'through Object.values()',
          `Object.values(JSON.parse(text, (key, value) => value)).forEach(row =>
    ctrl.set(Todo, { id: 'a' }, row),
  );`,
          '.forEach(row =>',
        ],
        [
          'through a spread',
          `const args = [text, (key, value) => value] as const;
  for (const row of JSON.parse(...args)) await ctrl.set(Todo, row);`,
          'for (const row of JSON.parse(...args))',
        ],
      ])(
        'keeps rows that JSON.parse() builds with a reviver %s',
        (_, loop, kept) => {
          expect(run('', loop)).toContain(kept);
        },
      );

      it('keeps rows that JSON.parse() builds with a reviver', () => {
        expect(
          run(
            '',
            `const rows = JSON.parse(text, (key, value) => value);
  rows.forEach(row => ctrl.set(Todo, { id: 'a' }, row));`,
          ),
        ).toContain('rows.forEach(');
      });
    });

    describe('set() loops over a list that can be empty', () => {
      const run = loop =>
        applyTransform(
          transform,
          { improvements: 'only' },
          {
            source: `import { Entity } from '@data-client/rest';
class Todo extends Entity { id = ''; }
export function save(ctrl, text: string) {
  ${loop}
}`,
            path: 'save.tsx',
          },
        );

      it('keeps the set() statement comments on the batch set()', () => {
        expect(
          run(`for (const row of JSON.parse(text)) {
    // keep the server title
    ctrl.set(Todo, row); // per-row
  }
  /* after */`),
        ).toContain(`if (rows.length) {
    // keep the server title
    // per-row
    ctrl.set([Todo], rows);
  }
  /* after */`);
      });

      it('keeps a loop over an Entity with a class decorator', () => {
        for (const decorator of [
          `function argsPk(cls) {
  cls.pk = (value, parent, key, args) => args[0].id;
  return cls;
}`,
          "import { argsPk } from 'entity-registry';",
        ]) {
          expect(
            applyTransform(
              transform,
              { improvements: 'only' },
              {
                source: `import { Entity } from '@data-client/rest';
${decorator}
@argsPk
class Todo extends Entity { id = ''; }
export function save(ctrl, rows: Todo[]) {
  for (const row of rows) ctrl.set(Todo, { id: row.id }, row);
}`,
                path: 'save.tsx',
              },
            ),
          ).toContain('for (const row of rows)');
        }
      });

      it('keeps a loop over an empty array literal', () => {
        expect(run('for (const id of []) ctrl.set(Todo, { id });')).toContain(
          'for (const id of []) ctrl.set(Todo, { id });',
        );
      });

      it('batches a non-empty array literal without a guard', () => {
        expect(
          run("for (const id of ['a', 'b']) ctrl.set(Todo, { id });"),
        ).toContain(
          "\n  ctrl.set([Todo], Array.from(['a', 'b'], id => ({ id })));\n",
        );
      });

      it('guards an array literal with a spread, which can be empty', () => {
        expect(run('for (const id of [...text]) ctrl.set(Todo, { id });'))
          .toContain(`const rows = [...text];

  if (rows.length) {
    ctrl.set([Todo], Array.from(rows, id => ({ id })));
  }`);
      });

      it('stores a property read in a const, since a getter could return a different list on the second read', () => {
        expect(
          applyTransform(
            transform,
            { improvements: 'only' },
            {
              source: `import { Entity } from '@data-client/rest';
class Todo extends Entity { id = ''; }
export function save(ctrl, queue) {
  for (const row of queue.items as Todo[]) ctrl.set(Todo, row);
}`,
              path: 'save.tsx',
            },
          ),
        ).toContain(`const rows = queue.items as Todo[];

  if (rows.length) {
    ctrl.set([Todo], rows);
  }`);
      });

      it('keeps an else after the loop on its own if', () => {
        expect(
          run(`if (text) for (const id of ['a', ...text]) ctrl.set(Todo, { id });
  else console.log('none');`),
        ).toContain(`if (text) {
    const rows = ['a', ...text];

    if (rows.length) {
      ctrl.set([Todo], Array.from(rows, id => ({ id })));
    }
  } else
    console.log('none');`);
      });

      it('wraps the stored list and guard in a block when the loop is a lone statement', () => {
        expect(
          run(
            'if (text) for (const row of JSON.parse(text)) ctrl.set(Todo, row);',
          ),
        ).toContain(`if (text) {
    const rows = JSON.parse(text);

    if (rows.length) {
      ctrl.set([Todo], rows);
    }
  }`);
      });

      it('wraps the stored list in a block when the loop is in a switch case', () => {
        expect(
          run(`switch (text) {
  case 'a':
    for (const row of JSON.parse(text)) ctrl.set(Todo, row);
    break;
  }`),
        ).toContain(`case 'a':
    {
      const rows = JSON.parse(text);`);
      });
    });

    describe('set() loops of an Entity with declaration-only members', () => {
      const run = members =>
        applyTransform(
          transform,
          { improvements: 'only' },
          {
            source: `import { Entity } from '@data-client/rest';
class Todo extends Entity {
  id = '';
${members}
}
export function save(ctrl, rows: any[]) {
  rows.forEach(row => ctrl.set(Todo, { id: row.id }));
}`,
            path: 'save.tsx',
          },
        );

      it('batches when they only declare types', () => {
        expect(
          run(
            '  declare static pk: typeof Entity.pk;\n  declare static process: typeof Entity.process;\n  declare pk: () => string;',
          ),
        ).toContain('ctrl.set([Todo], rows.map(');
      });

      it('keeps the loop when a field without a value hides pk()', () => {
        expect(run('  pk: any;')).toContain('rows.forEach(');
      });

      it('keeps the loop when an accessor field overrides a hook', () => {
        expect(
          run(
            '  static accessor process = (input, parent) => ({ ...input, scope: parent.scope });',
          ),
        ).toContain('rows.forEach(');
        expect(run('  static accessor shouldUpdate = () => false;')).toContain(
          'rows.forEach(',
        );
        expect(run('  static accessor schema = { author: User };')).toContain(
          'rows.forEach(',
        );
        expect(
          run('  accessor pk = (parent, key, args) => args[0].id;'),
        ).toContain('rows.forEach(');
      });

      it('keeps the loop when a decorator could replace a member', () => {
        expect(
          run('  @wrap static pk(value) {\n    return value.id;\n  }'),
        ).toContain('rows.forEach(');
        expect(run('  @observable title = "";')).toContain('rows.forEach(');
      });

      it('keeps the loop when the Entity has indexes', () => {
        // normalize() starts each index empty, so one set() per row keeps only the last row in the index
        expect(run("  static indexes = ['title'] as const;")).toContain(
          'rows.forEach(',
        );
        expect(
          run(`  static schema = { author: class User extends Entity {
    id = '';
    static indexes = ['username'];
  } };`),
        ).toContain('rows.forEach(');
      });

      it('batches with private and accessor members that are not hooks', () => {
        expect(
          run(
            '  static #count = 0;\n  static #bump() {}\n  static accessor label = "";',
          ),
        ).toContain('ctrl.set([Todo], rows.map(');
      });
    });

    describe('keeps set() loops of an Entity that code patches', () => {
      const save = `
export function save(ctrl, rows: any[]) {
  rows.forEach(row => ctrl.set(Todo, { id: row.id }));
}`;
      const run = source =>
        applyTransform(
          transform,
          { improvements: 'only' },
          { source, path: 'save.tsx' },
        );

      it.each([
        ['no other code', ''],
        [
          'a plain object property named like a hook',
          `export function bind(form: any, schema: any) {
  form.schema = schema;
}
const opts = { retries: 2 };
Object.assign(opts, { process: (x: any) => x });`,
        ],
        [
          'an instance property of another class',
          `export class Form {
  constructor(public opts: any) {
    this.opts.validate = (v: any) => !!v;
  }
}`,
        ],
        [
          'a constructor assigning options to an instance',
          `export class StreamManager {
  constructor(options: object) {
    Object.assign(this, options);
  }
}`,
        ],
        [
          'a schema assigned after the class',
          `class Box extends Entity { id = 0; }
Box.schema = { todos: [Todo] };`,
        ],
        [
          'an instance assigning its own hook-named members',
          `export class Form {
  constructor(schema: any) {
    this.schema = schema;
    this.validate = (v: any) => !!v;
    this.schema[schema.key] = schema;
  }
}`,
        ],
        [
          'a static private counter',
          `export class Counter {
  static #next = 1;
  static nextId() {
    return this.#next++;
  }
}`,
        ],
        [
          'a static method that reads, constructs and checks this',
          `export class Model {
  static label = 'model';
  static make(props: object) {
    const item = new this();
    this.validate(item);
    return item instanceof this ? this.label : '';
  }
}`,
        ],
        [
          'an object method inside a static method',
          `export class Mixer {
  static make(mixin: object) {
    return {
      apply() {
        Object.assign(this, mixin);
      },
    };
  }
}`,
        ],
      ])('batches the loop when %s writes', (_, setup) => {
        expect(
          run(
            `import { Entity } from '@data-client/rest';\nclass Todo extends Entity { id = 0; }\n${setup}${save}`,
          ),
        ).toContain('ctrl.set([Todo], rows.map(');
      });

      it.each([
        [
          'an alias of it',
          `class Todo extends Entity { id = 0; }
const Alias = Todo;
Alias.shouldUpdate = () => false;`,
        ],
        [
          'Reflect.set()',
          `class Todo extends Entity { id = 0; }
Reflect.set(Todo, 'shouldUpdate', () => false);`,
        ],
        [
          'a Set holding it',
          `class Todo extends Entity { id = 0; }
const entities = new Set([Todo]);
for (const E of entities) E.pk = (v, p, k, args) => args[0].id;`,
        ],
        [
          'a Map holding it',
          `class Todo extends Entity { id = 0; }
const byName = new Map([['todo', Todo]]);
byName.get('todo').shouldUpdate = () => false;`,
        ],
        [
          'Array.of()',
          `class Todo extends Entity { id = 0; }
Array.of(Todo)[0].shouldUpdate = () => false;`,
        ],
        [
          'a cast',
          `class Todo extends Entity { id = 0; }
(Todo as any).process = (input, parent) => ({ ...input, parent });`,
        ],
        [
          'a static block',
          `class Todo extends Entity {
  id = 0;
  static {
    this.process = (input, parent) => ({ ...input, parent });
  }
}`,
        ],
        [
          'a static method writing this',
          `class Todo extends Entity {
  id = 0;
  static useArgs() {
    this.process = (input, parent) => ({ ...input, parent });
  }
}`,
        ],
        [
          'a static method setting indexes on this',
          `class Todo extends Entity {
  id = 0;
  static configure() {
    this.indexes = ['title'];
  }
}
Todo.configure();`,
        ],
        [
          'a static method writing super',
          `class Todo extends Entity {
  id = 0;
  static useArgs() {
    super.process = (input, parent) => ({ ...input, parent });
  }
}`,
        ],
        [
          'a function given static this',
          `function patch(cls: any) {
  cls.process = (input, parent, key, args) => ({ ...input, tenant: args[0].tenant });
}
class Todo extends Entity {
  id = 0;
  static init() {
    patch(this);
  }
}`,
        ],
        [
          'a function given a class reached from static this',
          `class Todo extends Entity { id = 0; }
function patch(cls: any) {
  cls.process = (input, parent, key, args) => ({ ...input, tenant: args[0].tenant });
}
class Box extends Entity {
  id = 0;
  static schema = { todo: Todo };
  static init() {
    patch(this.schema.todo);
  }
}`,
        ],
        [
          'a registry holding static this',
          `const registry: any = {};
class Todo extends Entity {
  id = 0;
  static register() {
    registry.Todo = this;
  }
}
registry.Todo.shouldUpdate = () => false;`,
        ],
        [
          'an alias of this',
          `class Todo extends Entity {
  id = 0;
  static useArgs() {
    const self = this;
    self.shouldUpdate = () => false;
  }
}`,
        ],
        [
          'this.constructor',
          `class Todo extends Entity {
  id = 0;
  touch() {
    (this.constructor as any).shouldUpdate = () => false;
  }
}`,
        ],
        [
          'Object.assign() in a static method',
          `class Todo extends Entity {
  id = 0;
  static configure(mixin: object) {
    Object.assign(this, mixin);
  }
}`,
        ],
        [
          'Object.assign() with a later source',
          `class Todo extends Entity {
  id = 0;
  static configure(mixin: object) {
    Object.assign(this, { retries: 2 }, mixin);
  }
}`,
        ],
        [
          'Object.assign() on an alias of this.constructor',
          `class Todo extends Entity {
  id = 0;
  touch(mixin: object) {
    const Cls = this.constructor as any;
    Object.assign(Cls, mixin);
  }
}`,
        ],
        [
          'a static private field',
          `class Todo extends Entity {
  id = 0;
  static #configured = Object.assign(this, mixin);
}`,
        ],
        [
          'Object.assign() with a computed key',
          `class Todo extends Entity {
  id = 0;
  static configure(name: string, fn: any) {
    Object.assign(this, { [name]: fn });
  }
}`,
        ],
        [
          'a computed key in a static method',
          `class Todo extends Entity {
  id = 0;
  static define(name: string, fn: any) {
    this[name] = fn;
  }
}`,
        ],
        [
          'a let alias of it',
          `class Todo extends Entity { id = 0; }
let alias = Todo;
alias.process = (input, parent) => ({ ...input, parent });`,
        ],
        [
          'Reflect.set() with a computed key',
          `class Todo extends Entity {
  id = 0;
  static patch(name: string, fn: any) {
    Reflect.set(this, name, fn);
  }
}`,
        ],
        [
          'an array holding it',
          `class Todo extends Entity { id = 0; }
const listed = [Todo];
listed[0].shouldUpdate = () => false;`,
        ],
        [
          'an object holding it',
          `class Todo extends Entity { id = 0; }
const holder = { todo: Todo };
holder.todo.shouldUpdate = () => false;`,
        ],
        [
          'a schema holding it',
          `class Todo extends Entity { id = 0; }
class Outer extends Entity {
  id = 0;
  static schema = { todo: Todo };
}
Outer.schema.todo.shouldUpdate = () => false;`,
        ],
        [
          'an alias of a schema slot',
          `class Todo extends Entity { id = 0; }
class Outer extends Entity {
  id = 0;
  static schema = { todo: Todo };
}
const slot = Outer.schema.todo;
slot.shouldUpdate = () => false;`,
        ],
        [
          'a member assigned it',
          `class Todo extends Entity { id = 0; }
const store: any = {};
store.T = Todo;
store.T.shouldUpdate = () => false;`,
        ],
        [
          'a class field holding it',
          `class Todo extends Entity { id = 0; }
class Holder {
  static T = Todo;
}
Holder.T.shouldUpdate = () => false;`,
        ],
        [
          'a function returning it',
          `class Todo extends Entity { id = 0; }
const returned = () => {
  return Todo;
};
returned().shouldUpdate = () => false;`,
        ],
        [
          'a local function',
          `class Todo extends Entity { id = 0; }
function patch(Cls) {
  Cls.shouldUpdate = () => false;
}
patch(Todo);`,
        ],
        [
          'a method of a local object',
          `class Todo extends Entity { id = 0; }
const helpers = {
  patch(Cls) {
    Cls.shouldUpdate = () => false;
  },
};
helpers.patch(Todo);`,
        ],
        [
          'a method of a locally built object',
          `class Todo extends Entity { id = 0; }
const makeHelpers = () => ({
  patch(Cls) {
    Cls.shouldUpdate = () => false;
  },
});
makeHelpers().patch(Todo);`,
        ],
        [
          'a method of a reassigned let',
          `class Todo extends Entity { id = 0; }
let helpers = makeHelpers();
helpers = {
  patch(Cls) {
    Cls.shouldUpdate = () => false;
  },
};
helpers.patch(Todo);`,
        ],
      ])('through %s', (_, setup) => {
        const source = `import { Entity } from '@data-client/rest';\n${setup}${save}`;
        expect(run(source)).toBe(source);
      });
    });

    defineInlineTest(
      transform,
      { improvements: 'only' },
      `
import { Entity, schema } from '@data-client/rest';

class Todo extends Entity { id = 0; }
const todoList = [Todo];
const TodoCollection = new schema.Collection(todoList);
export const blank = () => new Todo();
class Box extends Entity {
  id = 0;
  static schema = { todo: Todo };
}
Box.schema = { todos: [Todo] };

export function save(ctrl, rows: Todo[]) {
  rows.forEach(row => ctrl.set(Todo, row));
}
      `,
      `
import { Entity, schema } from '@data-client/rest';

class Todo extends Entity { id = 0; }
const todoList = [Todo];
const TodoCollection = new schema.Collection(todoList);
export const blank = () => new Todo();
class Box extends Entity {
  id = 0;
  static schema = { todo: Todo };
}
Box.schema = { todos: [Todo] };

export function save(ctrl, rows: Todo[]) {
  if (rows.length) {
    ctrl.set([Todo], rows);
  }
}
      `,
      'batches rows of an Entity that is constructed or held in a schema',
    );

    defineInlineTest(
      transform,
      { improvements: 'only' },
      `
import { Entity, Invalidate } from '@data-client/rest';

class Todo extends Entity { id = ''; }
const cache = new Map();
ctrl.set([new Invalidate(Todo)], [{ id: '5' }]);
ctrl.set([new Invalidate(Todo)], [{ id: '5' }, { id: '6' }]);
ctrl.set([new Invalidate(Todo)], [row]);
cache.set([new Invalidate(Todo)], [{ id: '5' }]);
      `,
      `
import { Entity, Invalidate } from '@data-client/rest';

class Todo extends Entity { id = ''; }
const cache = new Map();
ctrl.set(new Invalidate(Todo), { id: '5' });
ctrl.set([new Invalidate(Todo)], [{ id: '5' }, { id: '6' }]);
ctrl.set([new Invalidate(Todo)], [row]);
cache.set([new Invalidate(Todo)], [{ id: '5' }]);
      `,
      'deletes one entity without a one-row batch',
    );

    defineInlineTest(
      transform,
      { improvements: 'only' },
      `
import { computed } from 'vue';
import { DataClientPlugin, GCPolicy, useSuspense, useCache } from '@data-client/vue';

app.use(DataClientPlugin, { gcPolicy: new GCPolicy() });
const plugins = [[DataClientPlugin, { gcPolicy: new GCPolicy() }]];
app.use(DataClientPlugin, { gcPolicy: new GCPolicy({ intervalMS: 60000 }) });
app.use(DataClientPlugin, { ...shared, gcPolicy: new GCPolicy() });

const props = defineProps<{ id: number }>();
const article = await useSuspense(ArticleResource.get, computed(() => ({ id: props.id })));
const previous = useCache(ArticleResource.get, computed(prev => ({ id: props.id })));
const chosen = useCache(computed(() => props.endpoint), computed(() => ({ id: props.id })));
      `,
      `
import { computed } from 'vue';
import { DataClientPlugin, GCPolicy, useSuspense, useCache } from '@data-client/vue';

app.use(DataClientPlugin);
const plugins = [[DataClientPlugin]];
app.use(DataClientPlugin, { gcPolicy: new GCPolicy({ intervalMS: 60000 }) });
app.use(DataClientPlugin, { ...shared, gcPolicy: new GCPolicy() });

const props = defineProps<{ id: number }>();
const article = await useSuspense(ArticleResource.get, () => ({ id: props.id }));
const previous = useCache(ArticleResource.get, computed(prev => ({ id: props.id })));
const chosen = useCache(computed(() => props.endpoint), () => ({ id: props.id }));
      `,
      'drops Vue options and wrappers that 0.19 makes the default',
    );

    defineInlineTest(
      transform,
      { improvements: 'only' },
      `
import { computed } from 'vue';
import { DataClientPlugin, useSuspense } from '@data-client/vue';
import { GCPolicy, Controller } from '@data-client/core';
import { GCPolicy as DefaultGC } from '@data-client/core';

app.use(DataClientPlugin, { gcPolicy: new DefaultGC() });
app.use(DataClientPlugin, { gcPolicy: new GCPolicy({ intervalMS: 60000 }) });
const article = await useSuspense(ArticleResource.get, computed(() => ({ id: props.id })));
      `,
      `
import { DataClientPlugin, useSuspense, GCPolicy } from '@data-client/vue';
import { Controller } from '@data-client/core';

app.use(DataClientPlugin);
app.use(DataClientPlugin, { gcPolicy: new GCPolicy({ intervalMS: 60000 }) });
const article = await useSuspense(ArticleResource.get, () => ({ id: props.id }));
      `,
      'imports GCPolicy from @data-client/vue and drops unused imports',
    );

    defineInlineTest(
      transform,
      { improvements: 'only' },
      `
import { useCache, useDLE } from '@data-client/react';

function TodoDetail({ id }: { id: number }) {
  const todo = useCache(TodoResource.get, { id });
  const { data: user } = useDLE(UserResource.get, { id });
  const other = useOther();
  if (!todo || typeof todo === 'symbol') return <TodoPlaceholder />;
  if (user && typeof user !== 'symbol') return <UserCard user={user} />;
  if (typeof other === 'symbol' || !other) return null;
  const shown = todo || typeof todo === 'symbol';
  const label = todo && typeof todo !== 'symbol' ? todo.title : '';
  const missing = !(todo || typeof todo === 'symbol');
  if (id > 0 && (!user || typeof user === 'symbol')) return null;
  const fallback = (todo || typeof todo === 'symbol') ?? true;
  return <h3>{todo.title.trim()}</h3>;
}
      `,
      `
import { useCache, useDLE } from '@data-client/react';

function TodoDetail({ id }: { id: number }) {
  const todo = useCache(TodoResource.get, { id });
  const { data: user } = useDLE(UserResource.get, { id });
  const other = useOther();
  if (!todo) return <TodoPlaceholder />;
  if (user) return <UserCard user={user} />;
  if (typeof other === 'symbol' || !other) return null;
  const shown = todo || typeof todo === 'symbol';
  const label = todo ? todo.title : '';
  const missing = !todo;
  if (id > 0 && !user) return null;
  const fallback = (todo || typeof todo === 'symbol') ?? true;
  return <h3>{todo.title.trim()}</h3>;
}
      `,
      'drops Symbol checks on useCache() and useDLE() data in conditions',
    );

    defineInlineTest(
      transform,
      { improvements: 'only' },
      `
import { Entity } from '@data-client/rest';

class Ticker extends Entity { id = ''; }
export async function write(ctrl, rows: Ticker[]) {
  rows.map(row => ctrl.set(Ticker, row));
  await rows.forEach(row => ctrl.set(Ticker, row));
  const results = rows.map(row => ctrl.set(Ticker, row));
}
      `,
      `
import { Entity } from '@data-client/rest';

class Ticker extends Entity { id = ''; }
export async function write(ctrl, rows: Ticker[]) {
  if (rows.length) {
    ctrl.set([Ticker], rows);
  }

  await rows.forEach(row => ctrl.set(Ticker, row));
  const results = rows.map(row => ctrl.set(Ticker, row));
}
      `,
      'batches an unused rows.map(), but not an awaited forEach() or a used map()',
    );

    defineInlineTest(
      transform,
      { improvements: true },
      `
import { Entity } from '@data-client/rest';
import { DataProvider } from '@data-client/react';

class Ticker extends Entity { id = ''; }
const managers = [new StreamManager()];
export const App = () => <DataProvider managers={managers} />;
export function write(ctrl, rows: Ticker[]) {
  rows.forEach(row => ctrl.set(Ticker, row));
}
      `,
      `
import { Entity } from '@data-client/rest';
import { DataProvider } from '@data-client/react';

class Ticker extends Entity { id = ''; }
const managers = () => [new StreamManager()];
export const App = () => <DataProvider managers={managers} />;
export function write(ctrl, rows: Ticker[]) {
  if (rows.length) {
    ctrl.set([Ticker], rows);
  }
}
      `,
      'adds improvements to the required upgrade with --improvements',
    );

    defineInlineTest(
      transform,
      {},
      `
import { Entity } from '@data-client/rest';

class Ticker extends Entity { id = ''; }
export function write(ctrl, rows: Ticker[]) {
  rows.forEach(row => ctrl.set(Ticker, row));
}
      `,
      `
import { Entity } from '@data-client/rest';

class Ticker extends Entity { id = ''; }
export function write(ctrl, rows: Ticker[]) {
  rows.forEach(row => ctrl.set(Ticker, row));
}
      `,
      'makes no improvements without --improvements',
    );

    defineInlineTest(
      transform,
      { improvements: 'only' },
      DEPRECATIONS_INPUT,
      DEPRECATIONS_INPUT,
      'migrates nothing else with --improvements=only',
    );

    it('rejects other --improvements values', () => {
      expect(() =>
        applyTransform(
          transform,
          { improvements: 'yes' },
          { source: DEPRECATIONS_INPUT },
        ),
      ).toThrow('--improvements must be true or only');
    });

    describe('entities imported from another module', () => {
      const fs = require('node:fs');
      const os = require('node:os');
      const path = require('node:path');
      let dir;
      beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codemods-v0.19-'));
        const write = (file, source) => {
          fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
          fs.writeFileSync(path.join(dir, file), source);
        };
        write(
          'resources/Ticker.ts',
          `
import { Entity } from '@data-client/rest';
import { Product } from './Product';

export class Ticker extends Entity {
  product_id = '';
  static schema = { product: Product };
  pk() {
    return this.product_id;
  }
}
`,
        );
        write(
          'resources/Product.ts',
          `
import { Entity } from '@data-client/rest';

export class Product extends Entity {
  id = '';
  static process(value, parent) {
    return { ...value, tickerId: parent.product_id };
  }
}
export class Scoped extends Entity {
  id = '';
  static process(value, parent, key, args) {
    return { ...value, scope: args[0].scope };
  }
}
`,
        );
        write(
          'resources/Quote.ts',
          `
import { Entity } from '@data-client/rest';
import { Scoped } from './Product';

export class Quote extends Entity {
  id = '';
  static schema = { scoped: Scoped };
}
`,
        );
        write(
          'resources/Base.ts',
          `
import { Entity } from '@data-client/rest';

export class Base extends Entity {}
export class Leaf extends Entity {
  id = '';
}
`,
        );
        write(
          'resources/Order.ts',
          `
import { Entity } from '@data-client/rest';
import { Base, Leaf } from './Base';

Leaf.process = (value, parent, key, args) => ({ ...value, scope: args[0].scope });
Base.shouldUpdate = () => false;
export class Order extends Entity {
  id = '';
  static schema = { leaf: Leaf };
}
export class Sub extends Base {
  id = '';
}
`,
        );
        write(
          'resources/index.ts',
          `export * from './Ticker';\nexport { Quote as LatestQuote } from './Quote';\n`,
        );
        write(
          'patched/index.ts',
          `export { Ticker } from '../resources/Ticker';
export * from '../resources/Quote';
import { Ticker } from '../resources/Ticker';
import { Quote } from '../resources/Quote';
Object.assign(Ticker, { pk(value, parent, key, args) { return args[0].id; } });
Quote.shouldUpdate = () => false;
`,
        );
      });
      afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

      it('keeps rows of an Entity that a barrel it is imported through patches', () => {
        const source = `
import type { Controller } from '@data-client/react';
import { Ticker, Quote } from '../patched';

export function flush(ctrl: Controller, rows: any[]) {
  for (const row of rows) ctrl.set(Ticker, { product_id: row.id });
  for (const row of rows) ctrl.set(Quote, { id: row.id });
}
`;
        expect(
          applyTransform(
            transform,
            { improvements: 'only' },
            { source, path: path.join(dir, 'managers/PatchedManager.ts') },
          ),
        ).toBe(source.trim());
      });

      it('keeps rows of an Entity whose module patches its nested Entity or base', () => {
        const source = `
import type { Controller } from '@data-client/react';
import { Order, Sub } from '../resources/Order';

export function flush(ctrl: Controller, rows: any[]) {
  for (const row of rows) ctrl.set(Order, { id: row.id });
  for (const row of rows) ctrl.set(Sub, { id: row.id });
}
`;
        expect(
          applyTransform(
            transform,
            { improvements: 'only' },
            { source, path: path.join(dir, 'managers/OrderManager.ts') },
          ),
        ).toBe(source.trim());
      });

      it('batches rows of an Entity whose nested Entities read no args', () => {
        const source = `
import type { Controller } from '@data-client/react';
import { Ticker, LatestQuote } from '../resources';

export function flush(ctrl: Controller, rows: Ticker[]) {
  for (const row of rows) ctrl.set(Ticker, { product_id: row.product_id }, row);
  for (const row of rows) ctrl.set(LatestQuote, row);
}
`;
        expect(
          applyTransform(
            transform,
            { improvements: 'only' },
            { source, path: path.join(dir, 'managers/StreamManager.ts') },
          ),
        ).toBe(
          `
import type { Controller } from '@data-client/react';
import { Ticker, LatestQuote } from '../resources';

export function flush(ctrl: Controller, rows: Ticker[]) {
  if (rows.length) {
    ctrl.set([Ticker], rows);
  }

  for (const row of rows) ctrl.set(LatestQuote, row);
}
`.trim(),
        );
      });
    });
  });
});
