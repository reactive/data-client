---
title: Entity Validation
sidebar_label: Validation
---

import HooksPlayground from '@site/src/components/HooksPlayground';

[Entity.validate()](/rest/api/Entity#validate) is called during normalization and denormalization.
`undefined` indicates no error, and a string error message if there is an error.

## Field check

Validation happens after [Entity.process()](/rest/api/Entity#process) but before [Entity.fromJS()](/rest/api/Entity#fromJS),
thus operates on POJOs rather than an instance of the class.

Here we can make sure the title field is included, and of the expected type.

<HooksPlayground>

```tsx
class Article extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() {
    return this.id;
  }

  static validate(processedEntity) {
    if (!Object.hasOwn(processedEntity, 'title')) return 'missing title field';
    if (typeof processedEntity.title !== 'string') return 'title is wrong type';
  }
}

const mockArticleDetail = mockFetch(
  ({ id }) =>
    ({
      '1': { id: '1', title: 'first' },
      '2': { id: '2' },
      '3': { id: '3', title: { complex: 'second', object: 5 } },
    }[id]),
  'mockArticleDetail',
);
const articleDetail = new Endpoint(mockArticleDetail, {
  schema: Article,
});

function ArticlePage({ id }: { id: string }) {
  const article = useSuspense(articleDetail, { id });
  return <div>{article.title}</div>;
}

render(<ArticlePage id="2" />);
```

</HooksPlayground>

### All fields check

Here's a recipe for checking that every defined field is present.

<HooksPlayground>

```tsx
class Article extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() {
    return this.id;
  }

  static validate(processedEntity) {
    if (
      !Object.keys(this.defaults).every(key =>
        Object.hasOwn(processedEntity, key),
      )
    )
      return 'a field is missing';
  }
}

const mockArticleDetail = mockFetch(
  ({ id }) =>
    ({
      '1': { id: '1', title: 'first' },
      '2': { id: '2' },
    }[id]),
  'mockArticleDetail',
);
const articleDetail = new Endpoint(mockArticleDetail, {
  schema: Article,
});

function ArticlePage({ id }: { id: string }) {
  const article = useSuspense(articleDetail, { id });
  return <div>{article.title}</div>;
}

render(<ArticlePage id="2" />);
```

</HooksPlayground>

## Partial results

Another great use of validation is mixing endpoints that return incomplete objects. This is often
useful when some fields consume lots of bandwidth or are computationally expensive for the backend.

Consider using [validateRequired](/rest/api/validateRequired) to reduce code.

<HooksPlayground>

```tsx
const mockArticleList = mockFetch(
  () => [
    { id: '1', title: 'first' },
    { id: '2', title: 'second' },
  ],
  'mockArticleList',
);
const mockArticleDetail = mockFetch(
  ({ id }) =>
    ({
      '1': {
        id: '1',
        title: 'first',
        content: 'long',
        createdAt: '2011-10-05T14:48:00.000Z',
      },
      '2': {
        id: '2',
        title: 'second',
        content: 'short',
        createdAt: '2011-10-05T14:48:00.000Z',
      },
    }[id]),
  'mockArticleDetail',
);

class ArticlePreview extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() {
    return this.id;
  }
  static get key() {
    return 'Article';
  }
}
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
const articleDetail = new Endpoint(mockArticleDetail, {
  schema: ArticleFull,
});

function ArticleDetail({ id, onHome }: { id: string; onHome: () => void }) {
  const article = useSuspense(articleDetail, { id });
  return (
    <div>
      <h4>
        <a onClick={onHome} style={{cursor: 'pointer'}}>&lt;</a> {article.title}
      </h4>
      <div>
        <p>{article.content}</p>
        <div>
          Created:{' '}
          <time>
            {Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
              article.createdAt,
            )}
          </time>
        </div>
      </div>
    </div>
  );
}
function ArticleList() {
  const [route, setRoute] = React.useState<string>();
  const articles = useSuspense(articleList, {});
  if (!route) {
    return (
      <div>
        {articles.map(article => (
          <div key={article.pk()} onClick={() => setRoute(article.id)} style={{cursor: 'pointer'}}>
            {article.title}
          </div>
        ))}
      </div>
    );
  }
  return <ArticleDetail id={route} onHome={() => setRoute()} />;
}

render(<ArticleList />);
```

</HooksPlayground>
