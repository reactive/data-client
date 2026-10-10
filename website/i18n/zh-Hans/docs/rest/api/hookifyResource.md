---
title: hookifyResource() - CRUD hook Endpoint 的集合
vue_title: hookifyResource() - CRUD composable Endpoint 的集合
sidebar_label: hookifyResource
---

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# hookifyResource

`hookifyResource()` 可以把任意 [Resource](./resource.md)（[RestEndpoints](./RestEndpoint.md) 的集合）转换为一组
返回 [RestEndpoints](./RestEndpoint.md) 的 :react[hook]:vue[composable]。

:::info

生成式类型要正常工作，需要 TypeScript >=4.3。

:::

<TypeScriptEditor row={false}>

:::react

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
import { useSuspense, useController } from '@data-client/react';
import { ArticleResource } from './resources/Article';
import ArticleForm from './ArticleForm';

function ArticleDetail({ id }) {
  const article = useSuspense(ArticleResource.useGet(), { id });
  const updateArticle = ArticleResource.useUpdate();
  const ctrl = useController();
  const onSubmit = (body: any) => ctrl.fetch(updateArticle, { id }, body);

  return <ArticleForm onSubmit={onSubmit} initialValues={article} />;
}
render(<ArticleDetail id="1" />);
```

:::

:::vue

```ts title="resources/Article"
import { inject } from 'vue';
import { Collection, Entity, Invalidate, hookifyResource, resource } from '@data-client/rest';

class Article extends Entity {
  id = '';
  title = '';
  content = '';
}
export const AuthKey = Symbol('accessToken');

const ArticleResourceBase = resource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});
export const ArticleResource = hookifyResource(
  ArticleResourceBase,
  function useInit() {
    const accessToken = inject(AuthKey, '');
    return {
      headers: {
        'Access-Token': accessToken,
      },
    };
  },
);
```

```html title="ArticleDetail.vue"
<script setup lang="ts">
  import { useSuspense, useController } from '@data-client/vue';
  import { ArticleResource } from './resources/Article';
  import ArticleForm from './ArticleForm.vue';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const updateArticle = ArticleResource.useUpdate();
  const article = await useSuspense(ArticleResource.useGet(), () => ({
    id: props.id,
  }));
  const onSubmit = (body: any) =>
    ctrl.fetch(updateArticle, { id: props.id }, body);
</script>

<template>
  <ArticleForm @submit="onSubmit" :initialValues="article" />
</template>
```

:::

</TypeScriptEditor>

:::vue

每个 `use*()` composable 会在组件 setup 时调用一次你的函数，因此要在
`<script setup>` 的顶层调用它们（绝不要在事件处理函数中调用）。`inject()` 之类的 composable 在那里可以正常工作。

:::

## 成员 {#members}

假设你使用的是 [resource()](./resource.md) 未经修改的结果，那么你会得到以下方法

### useGet() {#useget}

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

常与 [useSuspense()](/docs/api/useSuspense)、[Controller.invalidate](/docs/api/Controller#invalidate) 一起使用

### useGetList() {#usegetlist}

- method: 'GET'
- path: `shortenPath(path)`
  - 移除最后一个 `:param` 或 `*wildcard` 标记：
    ```ts
    hookifyResource(resource({ path: '/:first/:second' })).useGetList()
      .path === '/:first';
    hookifyResource(resource({ path: '/:first' })).useGetList().path ===
      '/';
    hookifyResource(resource({ path: '/:owner/*path' })).useGetList()
      .path === '/:owner';
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

常与 [useSuspense()](/docs/api/useSuspense)、[Controller.invalidate](/docs/api/Controller#invalidate) 一起使用

### useGetList().push {#push}

[push](./RestEndpoint.md#push) 会创建一个新的 Entity，并把它推入 useGetList() 的末尾。

- method: 'POST'
- path: `shortenPath(path)`
- schema: `useGetList().schema.push`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGetList().push({ group: 'abc' }, { title: 'winning' });
```

常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### useGetList().unshift {#unshift}

[unshift](./RestEndpoint.md#unshift) 会创建一个新的 Entity，并把它推入 useGetList() 的开头。

- method: 'POST'
- path: `shortenPath(path)`
- schema: `useGetList().schema.unshift`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGetList().unshift({ group: 'abc' }, { title: 'winning' });
```

常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### useGetList().getPage {#getpage}

[getPage](./RestEndpoint.md#getpage) 会获取另一[页](../guides/pagination.md#infinite-scrolling)，并追加到 useGetList() 中，同时确保没有重复项。

- method: 'GET'
- args: `shortenPath(path) & { [paginationField]: string | number } & searchParams`
- schema: [new Collection(\[schema\]).addWith(paginatedMerge, paginatedFilter(removeCursor))](./Collection.md)

```typescript
// GET //test.com/api/abc?isExtra=xyz&page=2
hookifyResource(
  resource({
    urlPrefix: '//test.com',
    path: '/api/:group/:id',
    paginationField: 'page',
  }),
).useGetList().getPage({
  group: 'abc',
  isExtra: 'xyz',
  page: '2',
});
```

常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### useUpdate() {#useupdate}

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

常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### usePartialUpdate() {#usepartialupdate}

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

常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### useDelete() {#usedelete}

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

常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用
