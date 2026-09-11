---
'@data-client/react': patch
---

Add `managers` factory support to the Next.js `DataProvider`

The server renders every request with its own store, so manager instances cannot be shared
between requests. `managers` now also accepts a function, called once per request on the server
and once in the browser:

```tsx title="app/Provider.tsx"
'use client';
import { getDefaultManagers } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';

const managers = () => [...getDefaultManagers(), new MyManager()];

export default function Provider({ children }) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}
```

A plain array keeps applying to the browser only; in development the server now warns that it
was ignored instead of silently using the defaults.
