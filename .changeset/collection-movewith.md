---
'@data-client/endpoint': minor
'@data-client/rest': minor
---

Add `Collection.moveWith()` for custom move schemas

Analogous to [`addWith()`](https://dataclient.io/rest/api/Collection#addWith), `moveWith()` constructs a custom move schema that controls how entities are added to their destination collection. The remove behavior is automatically derived from the collection type (Array or Values).

New exports: `unshift` merge function for convenience.

```ts
import { Collection, unshift } from '@data-client/rest';

class MyCollection extends Collection {
  constructor(schema, options) {
    super(schema, options);
    this.move = this.moveWith(unshift);
  }
}
```
