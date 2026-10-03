import { Children, isValidElement, type ReactNode } from 'react';

/**
 * App setup files that pass `managers` to DataProvider (React) or
 * DataClientPlugin (Vue). Used by docs/core/shared/_provider_managers.mdx
 *
 * @param imports names imported from `@data-client/react` or `@data-client/vue`
 * @param children code block defining `managers`. Its leading single-line
 * `import`s join the file's imports.
 */
export default function providerSetup({
  children,
  imports = [],
}: {
  children?: ReactNode;
  imports?: string[];
}) {
  const lines = codeOf(children).trimEnd().split('\n');
  const firstCode = lines.findIndex(line => !line.startsWith('import '));
  const split = firstCode === -1 ? lines.length : firstCode;
  const own = lines.slice(0, split).filter(Boolean);
  const managers = lines.slice(split).join('\n').trim();
  const file = (importLines: string[], rest: string) =>
    `${[...importLines, ...own].join('\n')}\n\n${managers}\n\n${rest}`;

  return {
    web: file(
      [
        ...importLine(['DataProvider', ...imports], '@data-client/react'),
        "import { createRoot } from 'react-dom/client';",
      ],
      `createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);`,
    ),
    native: file(
      [
        ...importLine(['DataProvider', ...imports], '@data-client/react'),
        "import { AppRegistry } from 'react-native';",
      ],
      `const Root = () => (
  <DataProvider managers={managers}>
    <App />
  </DataProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);`,
    ),
    nextjs: file(
      [
        "'use client';",
        ...importLine(imports, '@data-client/react'),
        "import { DataProvider } from '@data-client/react/nextjs';",
      ],
      `export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}`,
    ),
    expo: file(
      [
        "import { Stack } from 'expo-router';",
        ...importLine(['DataProvider', ...imports], '@data-client/react'),
      ],
      `export default function RootLayout() {
  return (
    <DataProvider managers={managers}>
      <Stack>
        <Stack.Screen name="index" />
      </Stack>
    </DataProvider>
  );
}`,
    ),
    vue: file(
      [
        "import { createApp } from 'vue';",
        ...importLine(['DataClientPlugin', ...imports], '@data-client/vue'),
        "import App from './App.vue';",
      ],
      `const app = createApp(App);
app.use(DataClientPlugin, { managers });
app.mount('#app');`,
    ),
  };
}

/** Raw text of the first code block in MDX children */
function codeOf(children: ReactNode): string {
  for (const child of Children.toArray(children)) {
    if (typeof child === 'string') return child;
    if (isValidElement<{ children?: ReactNode }>(child)) {
      const code = codeOf(child.props.children);
      if (code) return code;
    }
  }
  return '';
}

/** Matches prettier's import wrapping at printWidth 80 */
function importLine(names: string[], pkg: string): string[] {
  if (!names.length) return [];
  const line = `import { ${names.join(', ')} } from '${pkg}';`;
  if (line.length <= 80) return [line];
  return ['import {', ...names.map(name => `  ${name},`), `} from '${pkg}';`];
}
