---
title: useDebounce()
id: version-5.0.0-useDebounce
original_id: useDebounce
---

```typescript
function useDebounce<T>(value: T, delay: number, updatable?: boolean): T;
```

Keeps value updated after delay time


```typescript
import { useDebounce } from '@rest-hooks/hooks';
import { useResource } from 'rest-hooks';

const debouncedFilter = useDebounce(filter, 200);
const data = useResource(MyEndpoint, { filter: debouncedFilter });
```
