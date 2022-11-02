---
title: hookifyResource
---

<head>
  <title>hookifyResource() - Collection of CRUD hook Endpoints</title>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';

`hookifyResource()` Turns any [Resource](./createResource.md) (collection of [RestEndpoints](./RestEndpoint.md)) into a collection
of hooks that return [RestEndpoints](./RestEndpoint.md).

:::info

TypeScript >=4.3 is required for generative types to work correctly.

:::

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
  path: 'http\\://test.com/article/:id',
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
  const controller = useController();
  const onSubmit = () => controller.fetch(updateArticle, { id }, body);

  return <Form onSubmit={onSubmit} initialValues={article} />;
}
render(<ArticleDetail id="1" />);
```
