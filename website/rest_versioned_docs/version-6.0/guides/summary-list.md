---
title: Summary List Endpoints
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@rest-hooks/rest';

Sometimes you have a [list endpoint](../api/createResource.md#getlist) that includes
only a subset of fields.

In this case we can use [Entity.validate()](../api/Entity.md#validate) to ensure
we have the full response when needed (detail views), while keeping our state [DRY](https://deviq.com/principles/dont-repeat-yourself) and normalized to ensure data integrity.

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/article'}),
args: [],
response: [
{ id: '1', title: 'first' },
{ id: '2', title: 'second' },
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 1 }],
response: {
id: '1',
title: 'first',
content: 'long',
createdAt: '2011-10-05T14:48:00.000Z',
},
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 2 }],
response: {
id: '2',
title: 'second',
content: 'short',
createdAt: '2011-10-05T14:48:00.000Z',
},
delay: 150,
},
]}>

```typescript title="api/Article.ts"
class ArticleSummary extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() {
    return this.id;
  }
  // this ensures `Article` maps to the same entity
  static get key() {
    return 'Article';
  }
}

class Article extends ArticleSummary {
  readonly content: string = '';
  readonly createdAt: Date = new Date(0);

  static schema = {
    createdAt: Date,
  };

  static validate(processedEntity) {
    return (
      validateRequired(processedEntity, this.defaults) ||
      super.validate(processedEntity)
    );
  }
}

const BaseArticleResource = createResource({
  path: '/article/:id',
  schema: Article,
});
const ArticleResource = {
  ...BaseArticleResource,
  getList: BaseArticleResource.getList.extend({ schema: [ArticleSummary] }),
};
```

```tsx title="ArticleDetail.tsx" collapsed
function ArticleDetail({ id, onHome }: { id: string; onHome: () => void }) {
  const article = useSuspense(ArticleResource.get, { id });
  return (
    <div>
      <h4>
        <a onClick={onHome} style={{ cursor: 'pointer' }}>
          &lt;
        </a>{' '}
        {article.title}
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
  const [route, setRoute] = React.useState('');
  const articles = useSuspense(ArticleResource.getList);
  if (!route) {
    return (
      <div>
        {articles.map(article => (
          <div
            key={article.pk()}
            onClick={() => setRoute(article.id)}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Click me: {article.title}
          </div>
        ))}
      </div>
    );
  }
  return <ArticleDetail id={route} onHome={() => setRoute('')} />;
}

render(<ArticleList />);
```

</HooksPlayground>

## Detail data in nested entity

It's often better to move expensive data into another entity to simplify conditional
logic.

```typescript title="api/Article.ts"
class ArticleSummary extends Entity {
  readonly id: string = '';
  readonly title: string = '';
  readonly content: string = '';
  readonly createdAt: Date = new Date(0);

  static schema = {
    createdAt: Date,
  };

  pk() {
    return this.id;
  }
  // this ensures `Article` maps to the same entity
  static get key() {
    return 'Article';
  }
}

class Article extends ArticleSummary {
  // highlight-start
  readonly meta: ArticleMeta = ArticleMeta.fromJS({});

  static schema = {
    ...super.schema,
    meta: ArticleMeta,
  }
  // highlight-end

  static validate(processedEntity) {
    return (
      validateRequired(processedEntity, this.defaults) ||
      super.validate(processedEntity)
    );
  }
}

class ArticleMeta extends Entity {
  readonly viewCount: number = 0;
  readonly likeCount: number = 0;
  readonly relatedArticles: ArticleSummary[] = [];

  static schema = {
    relatedArticles: [ArticleSummary],
  }
}

const BaseArticleResource = new createResource({
  path: '/article/:id',
  schema: Article,
});
const ArticleResource = {
  ...BaseArticleResource,
  getList: BaseArticleResource.getList.extend({ schema: [ArticleSummary] }),
};
```
