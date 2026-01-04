---
'@data-client/normalizr': minor
---

Add `normalize()` to `@data-client/normalizr/imm` for ImmutableJS state

New exports:
- `normalize` - Normalizes data directly into ImmutableJS Map structures
- `ImmNormalizeDelegate` - Delegate class for custom ImmutableJS normalization
- `ImmutableStoreData`, `ImmutableNormalizedSchema`, `ImmutableJSMutableTable` - Types

```js
import { normalize } from '@data-client/normalizr/imm';
import { fromJS } from 'immutable';

const result = normalize(Article, responseData, args, {
  entities: fromJS({}),
  indexes: fromJS({}),
  entitiesMeta: fromJS({}),
});
```
