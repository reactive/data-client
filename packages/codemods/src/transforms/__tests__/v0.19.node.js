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
  // TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function
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

// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function
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
// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function
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

// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function
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
// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function
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
// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function
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
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return;
  }
  cleanup() {}
}
class B implements Manager {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
  getMiddleware: Middleware;
  cleanup() {}
}
class C implements Manager {
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
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
    // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
    this.getMiddleware = this.getMiddleware.bind(this);
  }
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
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
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return controller => next => next;
  }
}
class Both implements Manager {
  middleware: Middleware = controller => next => action => next(action);
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return controller => next => next;
  }
}
// TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
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
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
  getMiddleware() {
    return controller => next => next;
  },
};
// TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
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

// TODO(data-client): if this is a data-client Manager, it throws on mount without a middleware property since 0.19; add \`middleware: Middleware = () => next => next\`: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
class Boss implements Manager {}
      `,
      'marks classes implementing a Manager from another module',
    );

    defineInlineTest(
      transform,
      { path: 'f.ts' },
      `
import { NetworkManager } from '@data-client/react';

function f(nm) { foo(); // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-cleanup
return nm.cleanupDate; }
function g(nm) {
  // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-cleanup
  if (nm)
    return nm.cleanupDate;
}
      `,
      `
import { NetworkManager } from '@data-client/react';

function f(nm) { foo(); // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-cleanup
return nm.cleanupDate; }
function g(nm) {
  // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-cleanup
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
  // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-cleanup
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
// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function
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
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
  async getMiddleware() {
    return controller => next => next;
  }
}
class B extends Base implements Manager {}
class C implements Manager {
  ['middleware'] = () => next => next;
  ['getMiddleware2']() {}
}
// TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
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
  // TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware
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
    // TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-cleanup
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

// TODO(data-client): managers runs once per store since 0.19; create the Managers inside this function so stores don't share them, or pass the function itself if it already is one: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function
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
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
  if (!(issue instanceof Promise)) {
    render(issue);
  }
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
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
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
  const { title } = ctrl.fetchIfStale(IssueResource.get, { id });
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
  if (ctrl.fetchIfStale(UserResource.get, { id })) {
    log(title);
  }
  const user = ctrl.fetchIfStale(UserResource.get, { id }) as User;
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
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
  // TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
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
jest.spyOn(real, 'fetchIfStale').mockImplementation(async () => issue);
jest.spyOn(real, 'fetchIfStale').mockImplementationOnce(() => Promise.reject(error));
// TODO(data-client): fetchIfStale() always returns a Promise since 0.19; make this mock resolve its data: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
jest.spyOn(real, 'fetchIfStale').mockImplementation(impl);
      `,
      'makes jest.fn() mocks of fetchIfStale resolve their value',
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
  // TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest fetch failed since 0.19; handle that case in .catch() or try/catch: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
  if (!settings)
    log('no settings');
  // TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest fetch failed since 0.19; handle that case in .catch() or try/catch: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
  const theme = (await ctrl.fetchIfStale(ThemeResource.get)) ?? DEFAULT_THEME;
  const user = await ctrl.fetchIfStale(UserResource.get, { id });
  // TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest fetch failed since 0.19; handle that case in .catch() or try/catch: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
  if (user == null)
    return;
  const issue = await ctrl.fetchIfStale(IssueResource.get, { id });
  return { settings, theme: theme.name, title: issue.title };
}
      `,
      'marks code that handled an awaited result being missing',
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
    return next(action);
  };

  receive = ({ endpoint, args, meta }, response) =>
    this.controller.resolve(endpoint, { args, response, fetchedAt: meta.fetchedAt });

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
      "passes the fetch action's fetchedAt instead of Date.now()",
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
const second = Array.from(__DC_CONTROLLERS__.values())[0];
const third = window.__DC_CONTROLLERS__.values().next().value;
const names = [...window.__DC_CONTROLLERS__.keys()];
const state = await page.evaluate(() => (window as any).__DC_CONTROLLERS__.get(name).getState());
const maybe = debug ? __DC_CONTROLLERS__.get(name) : null;
const ok = ready && __DC_CONTROLLERS__.get('b').getState();
for (const controller of __DC_CONTROLLERS__.values()) log(controller);
      `,
      `
/* global copy */
// Paste into the browser console to copy the store
globalThis.__DC__.store = 'Data Client: Chat';

copy(JSON.stringify(globalThis.__DC__.controller.getState()));
const first = window.__DC__.controller;
const second = __DC__.controller;
const third = window.__DC__.controller;
const names = window.__DC__.stores;
const state = await page.evaluate(() => ((window as any).__DC__.store = name, (window as any).__DC__.controller).getState());
const maybe = debug ? (__DC__.store = name, __DC__.controller) : null;
const ok = ready && (__DC__.store = 'b', __DC__.controller).getState();
// TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#dc-global
for (const controller of __DC_CONTROLLERS__.values())
  log(controller);
      `,
      'reads __DC__ instead, in files without a data-client import',
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
  await waitForNextUpdate();
  expect(result.value).toBeDefined();
  await settle();
});

it('renames an alias', async () => {
  const rendered = await renderDataCompose(() => useThing());
  await rendered.waitForNextUpdate();
  await rendered.result;
  const { waitForNextUpdate: next } = await renderDataCompose(() => useOther());
  await next();
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
  await settle();
  expect(result.value).toBeDefined();
  await settle();
});

it('renames an alias', async () => {
  const rendered = await renderDataCompose(() => useThing());
  await rendered.result;
  const { waitForNextUpdate: next } = await renderDataCompose(() => useOther());
  await next();
});
      `,
      'turns Vue waitForNextUpdate() into allSettled(), dropping it before await result',
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
  // TODO(data-client): a future release types Entity.pk() args as readonly any[]; make this parameter readonly: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#future-pk-args
  static pk(value: any, parent?: any, key?: string, args?: any[]) {
    return args?.sort().join(',');
  }
}
class Done extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: readonly any[]) {
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
          `{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }\n`,
        );
        write('resources/index.ts', `export * from './post';\n`);
        write(
          'custom.ts',
          `
import { resource } from './base';

export const TagResource = resource({ path: '/tags/:id', schema: Tag });
`,
        );
      });
      afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

      it('renames create on a plain resource() the module exports, through re-exports and path aliases', () => {
        const source = `
import { useController } from '@data-client/react';
import { PostResource, NoteResource, UserResource, DraftResource } from '../resources';
import { PostResource as Posts } from '../resources/post.js';
import { TagResource } from '../custom';
import { CommentResource } from '@/resources';

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
`.trim(),
        );
      });
    });
  });
});
