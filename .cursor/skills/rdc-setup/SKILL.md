---
name: rdc-setup
description: Install and set up @data-client/react or @data-client/vue in a project. Detects project type (NextJS, Expo, React Native, Vue, plain React) and protocol (REST, GraphQL, custom), then hands off to protocol-specific setup skills.
disable-model-invocation: true
---

# Setup Reactive Data Client

## Detection Steps

Before installing, detect the project type and protocol by checking these files:

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

### 3. Detect Protocol Type

Scan the codebase to determine which data-fetching protocols are used:

#### REST Detection

Look for these patterns:
- `fetch()` calls with REST-style URLs (`/api/`, `/users/`, etc.)
- HTTP client libraries: `axios`, `ky`, `got`, `superagent` in `package.json`
- Files with REST patterns: `api.ts`, `client.ts`, `services/*.ts`
- URL patterns with path parameters: `/users/:id`, `/posts/:postId/comments`
- HTTP methods in code: `method: 'GET'`, `method: 'POST'`, `.get(`, `.post(`

#### GraphQL Detection

Look for these patterns:
- `@apollo/client`, `graphql-request`, `urql`, `graphql-tag` in `package.json`
- `.graphql` or `.gql` files in the project
- `gql\`` template literal tags
- GraphQL query patterns: `query {`, `mutation {`, `subscription {`
- GraphQL endpoint URLs: `/graphql`

#### Custom Protocol Detection

For async operations that don't match REST or GraphQL:
- Custom async functions returning Promises
- Third-party SDK clients (Firebase, Supabase, AWS SDK, etc.)
- IndexedDB or other local async storage

## Installation

### Core Packages

| Framework | Core Package |
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

## Protocol-Specific Setup

After provider setup, apply the appropriate skill based on detected protocol:

### REST APIs

Apply skill **"rdc-rest-setup"** which will:
1. Install `@data-client/rest`
2. Offer to create a custom `BaseEndpoint` class extending `RestEndpoint`
3. Configure common behaviors: urlPrefix, authentication, error handling

### GraphQL APIs

Apply skill **"rdc-graphql-setup"** which will:
1. Install `@data-client/graphql`
2. Create and configure `GQLEndpoint` instance
3. Set up authentication headers

### Custom Async Operations

Apply skill **"rdc-endpoint-setup"** which will:
1. Install `@data-client/endpoint`
2. Offer to wrap existing async functions with `new Endpoint()`
3. Configure schemas and caching options

### Multiple Protocols

If multiple protocols are detected, apply multiple setup skills. Each protocol package can be installed alongside others.

## Verification Checklist

After setup, verify:

- [ ] Core packages installed in `package.json`
- [ ] Provider/Plugin wraps the app at root level
- [ ] Correct import path used (especially `@data-client/react/nextjs` for NextJS)
- [ ] No duplicate providers in component tree
- [ ] Protocol-specific setup completed via appropriate skill

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

After core setup and protocol-specific setup:
1. Define data schemas using `Entity` - see skill "rdc-schema"
2. Use hooks like `useSuspense`, `useQuery`, `useController` - see skill "rdc-react"
3. Define REST resources - see skill "rdc-rest"

## References

For detailed API documentation, see the [references](references/) directory:

- [DataProvider](references/DataProvider.md) - Root provider component
- [installation](references/installation.md) - Installation guide
- [getDefaultManagers](references/getDefaultManagers.md) - Default managers
