import CodeBlock from '@theme/CodeBlock';
import type { ReactNode } from 'react';

import { parseCodeDocuments } from './Playground/editor/codeModel';

const PLATFORMS = {
  web: {
    title: 'index.tsx',
    imports: (names: string[]) => [
      ...importLine(['DataProvider', ...names], '@data-client/react'),
      "import { createRoot } from 'react-dom/client';",
    ],
    body: `createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);`,
  },
  native: {
    title: 'index.tsx',
    imports: (names: string[]) => [
      ...importLine(['DataProvider', ...names], '@data-client/react'),
      "import { AppRegistry } from 'react-native';",
    ],
    body: `const Root = () => (
  <DataProvider managers={managers}>
    <App />
  </DataProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);`,
  },
  nextjs: {
    title: 'app/Provider.tsx',
    imports: (names: string[]) => [
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
  },
  expo: {
    title: 'app/_layout.tsx',
    imports: (names: string[]) => [
      "import { Stack } from 'expo-router';",
      ...importLine(['DataProvider', ...names], '@data-client/react'),
    ],
    body: `export default function RootLayout() {
  return (
    <DataProvider managers={managers}>
      <Stack>
        <Stack.Screen name="index" />
      </Stack>
    </DataProvider>
  );
}`,
  },
  vue: {
    title: 'main.ts',
    imports: (names: string[]) => [
      "import { createApp } from 'vue';",
      ...importLine(['DataClientPlugin', ...names], '@data-client/vue'),
      "import App from './App.vue';",
    ],
    body: `const app = createApp(App);
app.use(DataClientPlugin, { managers });
app.mount('#app');`,
  },
};

/**
 * App setup file that passes `managers` to DataProvider (React) or
 * DataClientPlugin (Vue). Used by docs/core/shared/_provider_managers.mdx
 *
 * @param imports names imported from `@data-client/react` or `@data-client/vue`
 * @param children code block defining `managers`
 */
export default function ProviderSetupCode({
  platform,
  imports,
  children,
}: {
  platform: keyof typeof PLATFORMS;
  imports: string[];
  children: ReactNode;
}) {
  const managers = parseCodeDocuments(children)[0]?.value;
  // nothing to show without a managers block (e.g. the partial rendered alone)
  if (!managers) return null;
  const { title, imports: importLines, body } = PLATFORMS[platform];
  // the managers block's own imports continue the import list
  const gap = managers.startsWith('import ') ? '\n' : '\n\n';
  return (
    <CodeBlock language={platform === 'vue' ? 'ts' : 'tsx'} title={title}>
      {`${importLines(imports).join('\n')}${gap}${managers}\n\n${body}`}
    </CodeBlock>
  );
}

/** Matches prettier's import wrapping at printWidth 80 */
function importLine(names: string[], pkg: string): string[] {
  if (!names.length) return [];
  const line = `import { ${names.join(', ')} } from '${pkg}';`;
  if (line.length <= 80) return [line];
  return ['import {', ...names.map(name => `  ${name},`), `} from '${pkg}';`];
}
