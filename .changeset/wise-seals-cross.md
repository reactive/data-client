---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

`schema.Entity` -> [EntityMixin](https://dataclient.io/rest/api/EntityMixin)

```ts
import { EntityMixin } from '@data-client/rest';

export class Article {
  id = '';
  title = '';
  content = '';
  tags: string[] = [];
}

export class ArticleEntity extends EntityMixin(Article) {}
```

We keep `schema.Entity` for legacy, and add schema.EntityMixin and [EntityMixin](https://dataclient.io/rest/api/EntityMixin) as direct export