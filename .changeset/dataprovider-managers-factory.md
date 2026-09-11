---
'@data-client/react': minor
---

Add `managers` factory support to `DataProvider`

`managers` now also accepts a function that creates the managers. It is called once when the
provider mounts, so the same definition can be shared with the Next.js provider (which only
accepts a function), and each `DataProvider` on a page gets its own instances instead of sharing
one hoisted array.

```tsx
import { DataProvider, getDefaultManagers } from '@data-client/react';

const managers = () => [...getDefaultManagers(), new MyManager()];

<DataProvider managers={managers}>
  <App />
</DataProvider>;
```

Passing an array keeps working exactly as before.
