---
'@data-client/react': minor
---

BREAKING CHANGE: `managers` of the Next.js `DataProvider` is now a function

The server renders every request with its own store, so manager instances cannot be shared
between requests. Passing an array only ever applied to the browser; the server silently kept
its defaults, so a custom `Manager` ran on one side but not the other. `@data-client/react/nextjs`
now takes a function that is called once per request on the server and once in the browser, and
throws with a migration hint when given an array.

The browser `DataProvider` from `@data-client/react` is unchanged and still takes `Manager[]`.

#### Before

```tsx title="app/Provider.tsx"
'use client';
import { getDefaultManagers } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';

const managers = [...getDefaultManagers(), new MyManager()];

export default function Provider({ children }) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}
```

#### After

```tsx title="app/Provider.tsx"
'use client';
import { getDefaultManagers } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';

const managers = () => [...getDefaultManagers(), new MyManager()];

export default function Provider({ children }) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}
```
