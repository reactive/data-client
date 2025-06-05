---
'@data-client/normalizr': patch
---

Add /imm exports path for handling ImmutableJS state

#### MemoCache

```ts
import { MemoCache } from '@data-client/normalizr';
import { MemoPolicy } from '@data-client/normalizr/imm';

const memo = new MemoCache(MemoPolicy);

// entities is an ImmutableJS Map
const value = MemoCache.denormalize(Todo, '1', entities);
```

#### denormalize

non-memoized denormalize

```ts
import { denormalize } from '@data-client/normalizr/imm';

// entities is an ImmutableJS Map
const value = denormalize(Todo, '1', entities);
```