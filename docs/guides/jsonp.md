---
title: Cross-orgin requests with JSONP
---
```tsx
import jsonp from 'superagent-jsonp';
import { Resource } from 'rest-hooks';

export default class ArticleResource extends Resource {
  readonly id: number | null = null;
  readonly content: string = '';

  pk() {
    return this.id;
  }
  static urlRoot = 'http://test.com/article/';

  // OPERATIVE LINE HERE
  static fetchPlugin = jsonp;
}
```

Using the [jsonp plugin](https://www.npmjs.com/package/superagent-jsonp) for superagent makes this quite easy.
