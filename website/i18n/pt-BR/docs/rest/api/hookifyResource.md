---
title: hookifyResource() - Coleção de Endpoints CRUD como hooks
vue_title: hookifyResource() - Coleção de Endpoints CRUD como composables
sidebar_label: hookifyResource
---

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# hookifyResource

`hookifyResource()` transforma qualquer [Resource](./resource.md) (coleção de [RestEndpoints](./RestEndpoint.md)) em uma coleção
de :react[hooks]:vue[composables] que retornam [RestEndpoints](./RestEndpoint.md).

:::info

TypeScript >=4.3 é necessário para que os tipos generativos funcionem corretamente.

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

Cada composable `use*()` chama sua função uma vez, quando o componente é configurado, então chame-os
no nível superior de `<script setup>` (nunca em um handler). Composables como `inject()` funcionam ali.

:::

## Membros {#members}

Assumindo que você use o resultado inalterado de [resource()](./resource.md), estes serão os seus métodos

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

Normalmente usado com [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### useGetList() {#usegetlist}

- method: 'GET'
- path: `shortenPath(path)`
  - Remove o último token `:param` ou `*wildcard`:
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

Normalmente usado com [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### useGetList().push {#push}

[push](./RestEndpoint.md#push) cria uma nova entity e a adiciona ao final de useGetList().

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

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### useGetList().unshift {#unshift}

[unshift](./RestEndpoint.md#unshift) cria uma nova entity e a adiciona ao início de useGetList().

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

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### useGetList().getPage {#getpage}

[getPage](./RestEndpoint.md#getpage) busca outra [página](../guides/pagination.md#infinite-scrolling), anexando-a a useGetList() e garantindo que não haja duplicatas.

- method: 'GET'
- args: `shortenPath(path) & { [paginationField]: string | number } & searchParams`
- schema: veja [new Collection(\[schema\]).addWith(paginatedMerge, paginatedFilter(removeCursor))](./Collection.md)

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

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

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

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

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

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### useDelete() {#usedelete}

- method: 'DELETE'
- path: `path`
- schema: veja [new Invalidate(schema)](./Invalidate.md)
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

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)
