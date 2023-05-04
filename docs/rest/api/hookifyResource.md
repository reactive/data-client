---
title: hookifyResource
---

<head>
  <title>hookifyResource() - Collection of CRUD hook Endpoints</title>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

`hookifyResource()` Turns any [Resource](./createResource.md) (collection of [RestEndpoints](./RestEndpoint.md)) into a collection
of hooks that return [RestEndpoints](./RestEndpoint.md).

:::info

TypeScript >=4.3 is required for generative types to work correctly.

:::

<TypeScriptEditor row={false}>

```ts title="api/ArticleResource.ts"
import React from 'react';
import { createResource, hookifyResource, Entity } from '@rest-hooks/rest';

class Article extends Entity {
  id = '';
  title = '';
  content = '';

  pk() {
    return this.id;
  }
}
const AuthContext = React.createContext('');

const ArticleResourceBase = createResource({
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

```tsx title="ArticleDetail.tsx"
import { ArticleResource } from './api/ArticleResource';

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

Assuming you use the unchanged result of [createResource()](./createResource.md), these will be your methods

### useGet()

- method: 'GET'
- path: `path`
- schema: [schema](./Entity.md)

```typescript
// GET //test.com/api/abc/xyz
hookifyResource(
  createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
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
    hookifyResource(createResource({ path: '/:first/:second' })).useGetList()
      .path === '/:first';
    hookifyResource(createResource({ path: '/:first' })).useGetList().path ===
      '/';
    ```
- schema: [\[schema\]](./Array.md)

```typescript
// GET //test.com/api/abc?isExtra=xyz
hookifyResource(
  createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGetList()({
  group: 'abc',
  isExtra: 'xyz',
});
```

Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### useCreate()

- method: 'POST'
- path: `shortenPath(path)`
  - Removes the last argument:
    ```ts
    hookifyResource(createResource({ path: '/:first/:second' })).useCreate()
      .path === '/:first';
    hookifyResource(createResource({ path: '/:first' })).useCreate().path ===
      '/';
    ```
- schema: `schema`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
hookifyResource(
  createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useCreate()({ group: 'abc' }, { title: 'winning' });
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
  createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
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
  createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).usePartialUpdate()({ group: 'abc', id: 'xyz' }, { title: 'winning' });
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### useDelete()

- method: 'DELETE'
- path: `path`
- schema: [new schema.Invalidate(schema)](./Invalidate.md)
- process:
  ```ts
  (value, params) {
    return value && Object.keys(value).length ? value : params;
  },
  ```

```typescript
// DELETE //test.com/api/abc/xyz
hookifyResource(
  createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useDelete()({
  group: 'abc',
  id: 'xyz',
});
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)
