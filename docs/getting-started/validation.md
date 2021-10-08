---
title: Validation
---

import HooksPlayground from '@site/src/components/HooksPlayground';

<HooksPlayground>

```tsx
class ArticlePreview extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() {
    return this.id;
  }
  static key() {
    return 'Article';
  }
}
const mockArticleList = mockFetch(() => [
  { id: '1', title: 'first' },
  { id: '2', title: 'second' },
]);
const articleList = new Endpoint(mockArticleList, { schema: [ArticlePreview] });

class ArticleFull extends ArticlePreview {
  readonly content: string = '';
  readonly createdAt: Date = new Date(0);

  static schema = {
    createdAt: Date,
  };

  static validate(processedEntity) {
    if (!Object.hasOwn(processedEntity, 'content')) return 'Missing content';
  }
}
const mockArticleDetail = mockFetch(
  ({ id }) =>
    ({
      '1': { id: '1', title: 'first', content: 'long' },
      '2': { id: '2', title: 'second', content: 'short' },
    }[id]),
);
const articleDetail = new Endpoint(mockArticleDetail, {
  schema: ArticleFull,
  key({ id }) {
    return `article ${id}`;
  },
});

function ArticlePage() {
  const article = useResource(articleDetail, { id: '1' });
  return <div>{article.title}</div>;
}

render(<ArticlePage />);
```

</HooksPlayground>
