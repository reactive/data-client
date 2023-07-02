---
title: useDebounce()
---

<head>
  <title>useDebounce() - Declarative value delays for React</title>
</head>

```typescript
function useDebounce<T>(value: T, delay: number, updatable?: boolean): T;
```

Delays updating the parameters by [debouncing](https://css-tricks.com/debouncing-throttling-explained-examples/).
Useful to avoid spamming network requests when parameters might change quickly (like a typeahead field).

```typescript
import { useDebounce } from '@data-client/hooks';
import { useSuspense } from '@data-client/react';

const debouncedFilter = useDebounce(filter, 200);
const data = useSuspense(MyEndpoint, { filter: debouncedFilter });
```

Part of [@data-client/hooks](https://www.npmjs.com/package/@data-client/hooks)
