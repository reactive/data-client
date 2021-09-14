---
title: Validation
---

```ts
class ArticlePreview extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() { return this.id; }
  static key() { return 'Article'; }
}
const articleList = new Endpoint(fetchList, { schema: [ArticlePreview] });

class ArticleFull extends ArticlePreview {
  readonly content: string = '';
  readonly createdAt: Date = new Date(0);

  static schema = {
    createdAt: Date,
  }

  static validate(processedEntity) {
    if (!Object.hasOwn(processedEntity, 'content')) return 'Missing content';
  }
}
const articleDetail = new Endpoint(fetchDetail, { schema: ArticleFull });
```
