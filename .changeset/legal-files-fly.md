---
'@data-client/normalizr': minor
---

BREAKING: denormalize no longer detects ImmutableJS state

Use `/imm` exports to handle ImmutableJS state

#### Before

```ts
import { MemoCache, denormalize } from '@data-client/normalizr';

const memo = new MemoCache();
```

#### After

```ts
import { MemoCache } from '@data-client/normalizr';
import { MemoPolicy, denormalize } from '@data-client/normalizr/imm';

const memo = new MemoCache(MemoPolicy);
```
