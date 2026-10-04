import CodeBlock from '@theme/CodeBlock';
import type { ReactNode } from 'react';

import { parseCodeDocuments } from './Playground/editor/codeModel';

interface Setup {
  title: string;
  imports: string[];
  body: string;
}

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
} satisfies Record<string, (names: string[], managers: boolean) => Setup>;

/**
 * App setup file that renders DataProvider (React) or DataClientPlugin (Vue),
 * passing `managers` when given.
 * Used by docs/core/shared/_provider_managers.mdx and _installation.mdx
 *
 * @param imports names imported from `@data-client/react` or `@data-client/vue`
 * @param children optional code block defining `managers`
 */
export default function ProviderSetupCode({
  platform,
  imports = [],
  children,
}: {
  platform: keyof typeof PLATFORMS;
  imports?: string[];
  children?: ReactNode;
}) {
  const managers =
    children ? parseCodeDocuments(children)[0]?.value : undefined;
  if (children && !managers)
    throw new Error('<ProviderSetupCode> children must be a code block');
  const {
    title,
    imports: importLines,
    body,
  } = PLATFORMS[platform](imports, !!managers);
  const header = importLines.join('\n');
  // the managers block's own imports continue the import list
  const sep = managers?.startsWith('import ') ? '\n' : '\n\n';
  return (
    <CodeBlock language={platform === 'vue' ? 'ts' : 'tsx'} title={title}>
      {managers ?
        `${header}${sep}${managers}\n\n${body}`
      : `${header}\n\n${body}`}
    </CodeBlock>
  );
}

function managersProp(managers: boolean) {
  return managers ? ' managers={managers}' : '';
}

/** Matches prettier's import wrapping at printWidth 80 */
function importLine(names: string[], pkg: string): string[] {
  if (!names.length) return [];
  const line = `import { ${names.join(', ')} } from '${pkg}';`;
  if (line.length <= 80) return [line];
  return ['import {', ...names.map(name => `  ${name},`), `} from '${pkg}';`];
}
