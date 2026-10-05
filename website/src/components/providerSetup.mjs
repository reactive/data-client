/**
 * App setup files that render DataProvider (React) or DataClientPlugin (Vue).
 * Shared by ProviderSetupCode (site) and framework-docs/docsToMarkdown.mjs
 * (skill references, llms.txt), so both print the same code.
 */

/** @typedef {'web' | 'native' | 'nextjs' | 'expo' | 'vue'} Platform */

/**
 * @param {{ platform: Platform, imports?: string[], managers?: string }} options
 *   `managers`: code defining `managers`; its leading imports continue the import list
 * @returns {{ title: string, language: string, code: string }}
 */
export default function providerSetup({ platform, imports = [], managers }) {
  const {
    title,
    imports: importLines,
    body,
  } = PLATFORMS[platform](imports, !!managers);
  const header = importLines.join('\n');
  // the managers block's own imports continue the import list
  const sep = managers?.startsWith('import ') ? '\n' : '\n\n';
  return {
    title,
    language: platform === 'vue' ? 'ts' : 'tsx',
    code:
      managers ?
        `${header}${sep}${managers}\n\n${body}`
      : `${header}\n\n${body}`,
  };
}

/**
 * @type {Record<Platform, (names: string[], managers: boolean) => { title: string, imports: string[], body: string }>}
 */
const PLATFORMS = {
  web: (names, managers) => ({
    title: 'index.tsx',
    imports: [
      ...importLine(['DataProvider', ...names], '@data-client/react'),
      "import { createRoot } from 'react-dom/client';",
    ],
    body: `createRoot(document.body).render(
  <DataProvider${managersProp(managers)}>
    <App />
  </DataProvider>,
);`,
  }),
  native: (names, managers) => ({
    title: 'index.tsx',
    imports: [
      ...importLine(['DataProvider', ...names], '@data-client/react'),
      "import { AppRegistry } from 'react-native';",
    ],
    body: `const Root = () => (
  <DataProvider${managersProp(managers)}>
    <App />
  </DataProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);`,
  }),
  // managers are client-only, so they need their own 'use client' Provider
  nextjs: (names, managers) =>
    managers ?
      {
        title: 'app/Provider.tsx',
        imports: [
          "'use client';",
          ...importLine(names, '@data-client/react'),
          "import { DataProvider } from '@data-client/react/nextjs';",
        ],
        body: `export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}`,
      }
    : {
        title: 'app/layout.tsx',
        imports: ["import { DataProvider } from '@data-client/react/nextjs';"],
        body: `export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DataProvider>{children}</DataProvider>
      </body>
    </html>
  );
}`,
      },
  expo: (names, managers) => ({
    title: 'app/_layout.tsx',
    imports: [
      "import { Stack } from 'expo-router';",
      ...importLine(['DataProvider', ...names], '@data-client/react'),
    ],
    body: `export default function RootLayout() {
  return (
    <DataProvider${managersProp(managers)}>
      <Stack>
        <Stack.Screen name="index" />
      </Stack>
    </DataProvider>
  );
}`,
  }),
  vue: (names, managers) => ({
    title: 'main.ts',
    imports: [
      "import { createApp } from 'vue';",
      ...importLine(['DataClientPlugin', ...names], '@data-client/vue'),
      "import App from './App.vue';",
    ],
    body: `const app = createApp(App);
app.use(DataClientPlugin${managers ? ', { managers }' : ''});
app.mount('#app');`,
  }),
};

/** @param {boolean} managers */
function managersProp(managers) {
  return managers ? ' managers={managers}' : '';
}

/**
 * Matches prettier's import wrapping at printWidth 80
 * @param {string[]} names
 * @param {string} pkg
 */
function importLine(names, pkg) {
  if (!names.length) return [];
  const line = `import { ${names.join(', ')} } from '${pkg}';`;
  if (line.length <= 80) return [line];
  return ['import {', ...names.map(name => `  ${name},`), `} from '${pkg}';`];
}
