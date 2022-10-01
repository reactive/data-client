---
title: hookifyResource
---

import LanguageTabs from '@site/src/components/LanguageTabs';

`hookifyResource()` Turns any [Resource](./createResource.md) (collection of [RestEndpoints](./RestEndpoint.md)) into a collection
of hooks that return [RestEndpoints](./RestEndpoint.md).

:::info

TypeScript >=4.3 is required for generative types to work correctly.

:::

```ts title="api/ArticleResource.tsx"
const ArticleResourceBase = createResource({
  path: 'http\\://test.com/article/:id',
  schema: Article,
});
export const ArticleResource = hookifyResource(
  ArticleResourceBase,
  function useInit() {
    const accessToken = useContext(AuthContext);
    return {
      headers: {
        'Access-Token': accessToken,
      },
    };
  },
);
```

```tsx title="ArticleDetail.tsx"
function ArticleDetail({ id }) {
  const article = useSuspense(ArticleResource.useGet(), { id });
  const updateArticle = ArticleResource.useUpdate()
  const onSubmit = () => controller.fetch(updateArticle, { id }, body);

  return <Form onSubmit={onSubmit} initialValues={article} />
}
```
