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
const [CustomProvider] = createPersistedStore(useCustom ? () => custom : undefined);
      `,
      'leaves undefined managers arguments alone, including conditional ones',
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

export const App = () => <DataProvider managers={() => managers} />;
      `,
      'wraps exported arrays where they are passed, as their importers are',
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
