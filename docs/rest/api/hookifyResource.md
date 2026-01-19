---
title: hookifyResource() - Collection of CRUD hook Endpoints
sidebar_label: hookifyResource
---

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# hookfiyResource

`hookifyResource()` Turns any [Resource](./resource.md) (collection of [RestEndpoints](./RestEndpoint.md)) into a collection
of hooks that return [RestEndpoints](./RestEndpoint.md).

:::info

TypeScript >=4.3 is required for generative types to work correctly.

:::

<TypeScriptEditor row={false}>

```ts title="resources/Article"
import React from 'react';
import { Collection, Entity, Invalidate, hookifyResource, resource } from '@data-client/rest';

class Article extends Entity {
  id = '';
  title = '';
  content = '';
}
const AuthContext = React.createContext('');

const ArticleResourceBase = resource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});
export const ArticleResource = hookifyResource(
  ArticleResourceBase,
  function useInit() {
    const accessToken = React.useContext(AuthContext);
    return {
      headers: {
        'Access-Token': accessToken,
      },
    };
  },
);
```

```tsx title="ArticleDetail"
import { ArticleResource } from './resources/Article';

function ArticleDetail({ id }) {
  const article = useSuspense(ArticleResource.useGet(), { id });
  const updateArticle = ArticleResource.useUpdate();
  const ctrl = useController();
  const onSubmit = (body: any) => ctrl.fetch(updateArticle, { id }, body);

  return <ArticleForm onSubmit={onSubmit} initialValues={article} />;
}
render(<ArticleDetail id="1" />);
```

</TypeScriptEditor>

## Members

Assuming you use the unchanged result of [resource()](./resource.md), these will be your methods

### useGet()

- method: 'GET'
- path: `path`
- schema: [schema](./Entity.md)

```typescript
// GET //test.com/api/abc/xyz
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGet()({
  group: 'abc',
  id: 'xyz',
});
```

Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### useGetList()

- method: 'GET'
- path: `shortenPath(path)`
  - Removes the last argument:
    ```ts
    hookifyResource(resource({ path: '/:first/:second' })).useGetList()
      .path === '/:first';
    hookifyResource(resource({ path: '/:first' })).useGetList().path ===
      '/';
    ```
- schema: [\[schema\]](./Array.md)

```typescript
// GET //test.com/api/abc?isExtra=xyz
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGetList()({
  group: 'abc',
  isExtra: 'xyz',
});
```

Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### useGetList().push {#push}

[push](./RestEndpoint.md#push) creates a new entity and pushes it to the end of useGetList().

- method: 'POST'
- path: `shortenPath(path)`
- schema: `useGetList().schema.push`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
resource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).useGetList().push({ group: 'abc' }, { title: 'winning' });
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### useGetList().unshift {#unshift}

[unshift](./RestEndpoint.md#unshift) creates a new entity and pushes it to the beginning of useGetList().

- method: 'POST'
- path: `shortenPath(path)`
- schema: `useGetList().schema.unshift`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
resource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).useGetList().push({ group: 'abc' }, { title: 'winning' });
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### useGetList().getPage {#getpage}

[getPage](./RestEndpoint.md#getpage) retrieves another [page](../guides/pagination.md#infinite-scrolling) appending to useGetList() ensuring there are no duplicates.

- method: 'GET'
- args: `shortenPath(path) & { [paginationField]: string | number } & searchParams`
- schema: [new Collection(\[schema\]).addWith(paginatedMerge, paginatedFilter(removeCursor))](./Collection.md)

```typescript
// GET //test.com/api/abc?isExtra=xyz&page=2
resource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
  paginationField: 'page',
}).useGetList().getPage({
  group: 'abc',
  isExtra: 'xyz',
  page: '2',
});
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### useUpdate()

- method: 'PUT'
- path: `path`
- schema: `schema`

```typescript
// PUT //test.com/api/abc/xyz
// BODY { "title": "winning" }
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useUpdate()({ group: 'abc', id: 'xyz' }, { title: 'winning' });
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### usePartialUpdate()

- method: 'PATCH'
- path: `path`
- schema: `schema`

```typescript
// PATCH //test.com/api/abc/xyz
// BODY { "title": "winning" }
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).usePartialUpdate()({ group: 'abc', id: 'xyz' }, { title: 'winning' });
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### useDelete()

- method: 'DELETE'
- path: `path`
- schema: [new Invalidate(schema)](./Invalidate.md)
- process:
  ```ts
  (value, params) {
    return value && Object.keys(value).length ? value : params;
  },
  ```

```typescript
// DELETE //test.com/api/abc/xyz
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useDelete()({
  group: 'abc',
  id: 'xyz',
});
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)
