'use strict';

const { defineInlineTest } = require('jscodeshift/dist/testUtils');

const transform = require('../v0.19');

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

renderDataHook(() => useThing(), { managers: () => [new NetworkManager(), logger] });
renderDataClient(() => useThing(), { managers: () => [new NetworkManager()] });
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

import { NetworkManager } from '@data-client/react';

renderDataHook(() => useThing(), { managers: () => [new LoggingManager(), new NetworkManager()] });
renderDataHook(() => useThing(), { managers: () => [new AuditNetworkManager()] });
renderDataHook(() => useThing(), { managers: () => [logger] });
      `,
      'adds a NetworkManager to renderDataHook() lists of new Managers without one',
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
import { useController, NetworkManager } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

renderDataHook(() => useController(), { managers: () => [new LoggingManager(), new NetworkManager()] });
      `,
      'imports NetworkManager next to an existing @data-client/react import',
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
      `,
      `
import * as DC from '@data-client/react';
import { renderDataHook } from '@data-client/test';

import { NetworkManager } from '@data-client/react';

renderDataHook(() => useThing(), { managers: () => [new LoggingManager(), new NetworkManager()] });
renderDataHook(() => useThing(), { managers: () => [new LoggingManager(), new NetworkManager()] });
renderDataHook(() => useThing(), { managers: () => [new DC.NetworkManager()] });
renderDataHook(() => useThing(), { 'managers': () => [new LoggingManager(), new NetworkManager()] });
      `,
      'imports NetworkManager once, and sees a namespaced one',
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
import { NetworkManager as NM, NetworkManager } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

class AuditManager extends NM {}
const Loop = class extends Loop {};
const Scoped = class extends DC.NetworkManager {};
renderDataHook(() => useThing(), { managers: () => [new NM()] });
renderDataHook(() => useThing(), { managers: () => [new AuditManager()] });
renderDataHook(() => useThing(), { managers: () => [new Scoped()] });
renderDataHook(() => useThing(), { managers: () => [new Loop(), new NetworkManager()] });
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
import { NetworkManager, type Manager } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

it('a', () => {
  const managers = () => [new NetworkManager()];
  renderDataHook(() => useThing(), { managers });
});
it('b', () => {
  const managers = () => [new LoggingManager(), new NetworkManager()];
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
  ctrl.fetchIfStale(CommentResource.getList, { id }).catch(() => {});
  return Promise.resolve(other());
}
      `,
      'unwraps Promise.resolve() around it',
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
  });
});
