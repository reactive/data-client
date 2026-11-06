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
  });

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
