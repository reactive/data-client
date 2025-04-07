---
'@data-client/react': minor
---

BREAKING CHANGE: useDebounce() returns [val, isPending]

This was previously exported in `@data-client/react/next` to make migrations easy. This will
still be available there.

#### Before

```ts
import { useDebounce } from '@data-client/react';
const debouncedQuery = useDebounce(query, 100);
```

#### After

```ts
import { useDebounce } from '@data-client/react';
const [debouncedQuery] = useDebounce(query, 100);
```

#### Before

```ts
import { useDebounce } from '@data-client/react/next';
const [debouncedQuery, isPending] = useDebounce(query, 100);
```

#### After

```ts
import { useDebounce } from '@data-client/react';
const [debouncedQuery, isPending] = useDebounce(query, 100);
```