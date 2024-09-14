---
'@data-client/react': patch
---

New [useDebounce()](https://dataclient.io/docs/api/useDebounce) in /next that integrates useTransition()

```ts
import { useDebounce } from '@data-client/react/next';
const [debouncedQuery, isPending] = useDebounce(query, 100);
```

- Returns tuple - to include isPending
- Any Suspense triggered due to value change will continue showing
  the previous contents until it is finished loading.