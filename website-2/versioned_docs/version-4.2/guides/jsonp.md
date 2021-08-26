---
title: Cross-orgin requests with JSONP
id: jsonp
original_id: jsonp
---

JSONP is a method for sending JSON data without worrying about cross-domain issues. This
is sometimes needed when calling third-party APIs that don't come with appropriate
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) settings.

```tsx
import jsonp from 'superagent-jsonp';
import { Resource } from 'rest-hooks';

export default class ArticleResource extends Resource {
  readonly id: number | undefined = undefined;
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
