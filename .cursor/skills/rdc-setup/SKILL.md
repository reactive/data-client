---
name: rdc-setup
description: Install and set up @data-client/react or @data-client/vue in a project. Detects project type (NextJS, Expo, React Native, Vue, plain React) and configures DataProvider or DataClientPlugin. Use when setting up data-client, installing reactive data client, or adding DataProvider.
---

# Setup Reactive Data Client

## Detection Steps

Before installing, detect the project type by checking these files:

### 1. Detect Package Manager

Check which lock file exists:
- `yarn.lock` → use `yarn add`
- `pnpm-lock.yaml` → use `pnpm add`
- `package-lock.json` or `bun.lockb` → use `npm install` or `bun add`

### 2. Detect Project Type

Check `package.json` dependencies:

| Check | Project Type |
|-------|--------------|
| `"next"` in dependencies | **NextJS** |
| `"expo"` in dependencies | **Expo** |
| `"vue"` in dependencies | **Vue** |
| `"react-native"` in dependencies (no expo) | **React Native** |
| `"react"` in dependencies | **Plain React** |

## Installation

### Packages to Install

| Framework | Packages |
|-----------|----------|
| React (all) | `@data-client/react` + dev: `@data-client/test` |
| Vue | `@data-client/vue` (testing included) |

### Install Command Examples

**React (NextJS, Expo, React Native, plain React):**
```bash
npm install @data-client/react && npm install -D @data-client/test
yarn add @data-client/react && yarn add -D @data-client/test
pnpm add @data-client/react && pnpm add -D @data-client/test
```

**Vue:**
```bash
npm install @data-client/vue
yarn add @data-client/vue
pnpm add @data-client/vue
```

## Provider Setup

After installing, add the provider at the top-level component.

### NextJS (App Router)

Edit `app/layout.tsx`:

```tsx
import { DataProvider } from '@data-client/react/nextjs';

export default function RootLayout({ children }) {
  return (
    <html>
      <DataProvider>
        <body>
          {children}
        </body>
      </DataProvider>
    </html>
  );
}
```

**Important**: NextJS uses `@data-client/react/nextjs` import path.

### Expo

Edit `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { DataProvider } from '@data-client/react';

export default function RootLayout() {
  return (
    <DataProvider>
      <Stack>
        <Stack.Screen name="index" />
      </Stack>
    </DataProvider>
  );
}
```

### React Native

Edit entry file (e.g., `index.tsx`):

```tsx
import { DataProvider } from '@data-client/react';
import { AppRegistry } from 'react-native';

const Root = () => (
  <DataProvider>
    <App />
  </DataProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);
```

### Plain React (Vite, CRA, etc.)

Edit entry file (e.g., `index.tsx`, `main.tsx`, or `src/index.tsx`):

```tsx
import { DataProvider } from '@data-client/react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <DataProvider>
    <App />
  </DataProvider>,
);
```

### Vue

Edit `main.ts`:

```ts
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import App from './App.vue';

const app = createApp(App);

app.use(DataClientPlugin, {
  // optional overrides
  // managers: getDefaultManagers(),
  // initialState,
  // Controller,
  // gcPolicy,
});

app.mount('#app');
```

## Verification Checklist

After setup, verify:

- [ ] Packages installed in `package.json`
- [ ] Provider/Plugin wraps the app at root level
- [ ] Correct import path used (especially `@data-client/react/nextjs` for NextJS)
- [ ] No duplicate providers in component tree

## Common Issues

### NextJS: Wrong Import Path

❌ Wrong:
```tsx
import { DataProvider } from '@data-client/react';
```

✅ Correct for NextJS:
```tsx
import { DataProvider } from '@data-client/react/nextjs';
```

### Provider Not at Root

The `DataProvider` must wrap all components that use data-client hooks. Place it at the topmost level possible.

## Next Steps

After setup, the user can:
1. Define data schemas using `Entity` and `resource()`
2. Use hooks like `useSuspense`, `useQuery`, `useController`
3. See skill "rdc-rest" for defining REST APIs
4. See skill "rdc-schema" for schema definitions
5. See skill "rdc-react" for react usage

## References

For detailed API documentation, see the [references](references/) directory:

- [DataProvider](references/DataProvider.md) - Root provider component
- [installation](references/installation.md) - Installation guide
- [getDefaultManagers](references/getDefaultManagers.md) - Default managers
