---
title: useDebounce()
---

<head>
  <title>useDebounce() - Declarative value delays</title>
</head>

```typescript
function useDebounce<T>(value: T, delay: number, updatable?: boolean): T;
```

Delays updating the parameters by [debouncing](https://css-tricks.com/debouncing-throttling-explained-examples/).
Useful to avoid spamming network requests when parameters might change quickly (like a typeahead field).

```typescript
import { useDebounce } from '@rest-hooks/hooks';
import { useSuspense } from 'rest-hooks';

const debouncedFilter = useDebounce(filter, 200);
const data = useSuspense(MyEndpoint, { filter: debouncedFilter });
```

Part of [@rest-hooks/hooks](https://www.npmjs.com/package/@rest-hooks/hooks)
