---
title: hookifyResource() - Colección de Endpoints CRUD de hooks
vue_title: hookifyResource() - Colección de Endpoints CRUD de composables
sidebar_label: hookifyResource
---

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# hookifyResource

`hookifyResource()` convierte cualquier [Resource](./resource.md) (colección de [RestEndpoints](./RestEndpoint.md)) en una colección
de :react[hooks]:vue[composables] que devuelven [RestEndpoints](./RestEndpoint.md).

:::info

Se requiere TypeScript >=4.3 para que los tipos generativos funcionen correctamente.

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

Cada composable `use*()` llama a tu función una vez, cuando se configura el componente, así que llámalos
en el nivel superior de `<script setup>` (nunca en un manejador). Los composables como `inject()` funcionan allí.

:::

## Miembros {#members}

Suponiendo que uses el resultado sin modificar de [resource()](./resource.md), estos serán tus métodos

### useGet() {#useget}

- method: 'GET'
- path: `path`
- Schema: [schema](./Entity.md)

```typescript
// GET //test.com/api/abc/xyz
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGet()({
  group: 'abc',
  id: 'xyz',
});
```

Se usa comúnmente con [useSuspense()](/docs/api/useSuspense) y [Controller.invalidate](/docs/api/Controller#invalidate)

### useGetList() {#usegetlist}

- method: 'GET'
- path: `shortenPath(path)`
  - Elimina el último token `:param` o `*wildcard`:
    ```ts
    hookifyResource(resource({ path: '/:first/:second' })).useGetList()
      .path === '/:first';
    hookifyResource(resource({ path: '/:first' })).useGetList().path ===
      '/';
    hookifyResource(resource({ path: '/:owner/*path' })).useGetList()
      .path === '/:owner';
    ```
- Schema: [\[schema\]](./Array.md)

```typescript
// GET //test.com/api/abc?isExtra=xyz
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGetList()({
  group: 'abc',
  isExtra: 'xyz',
});
```

Se usa comúnmente con [useSuspense()](/docs/api/useSuspense) y [Controller.invalidate](/docs/api/Controller#invalidate)

### useGetList().push {#push}

[push](./RestEndpoint.md#push) crea una nueva entidad y la agrega al final de useGetList().

- method: 'POST'
- path: `shortenPath(path)`
- Schema: `useGetList().schema.push`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGetList().push({ group: 'abc' }, { title: 'winning' });
```

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### useGetList().unshift {#unshift}

[unshift](./RestEndpoint.md#unshift) crea una nueva entidad y la agrega al principio de useGetList().

- method: 'POST'
- path: `shortenPath(path)`
- Schema: `useGetList().schema.unshift`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useGetList().unshift({ group: 'abc' }, { title: 'winning' });
```

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### useGetList().getPage {#getpage}

[getPage](./RestEndpoint.md#getpage) obtiene otra [página](../guides/pagination.md#infinite-scrolling) y la añade a useGetList() asegurando que no haya duplicados.

- method: 'GET'
- args: `shortenPath(path) & { [paginationField]: string | number } & searchParams`
- Schema: [new Collection(\[schema\]).addWith(paginatedMerge, paginatedFilter(removeCursor))](./Collection.md)

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

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### useUpdate() {#useupdate}

- method: 'PUT'
- path: `path`
- Schema: `schema`

```typescript
// PUT //test.com/api/abc/xyz
// BODY { "title": "winning" }
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).useUpdate()({ group: 'abc', id: 'xyz' }, { title: 'winning' });
```

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### usePartialUpdate() {#usepartialupdate}

- method: 'PATCH'
- path: `path`
- Schema: `schema`

```typescript
// PATCH //test.com/api/abc/xyz
// BODY { "title": "winning" }
hookifyResource(
  resource({ urlPrefix: '//test.com', path: '/api/:group/:id' }),
).usePartialUpdate()({ group: 'abc', id: 'xyz' }, { title: 'winning' });
```

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### useDelete() {#usedelete}

- method: 'DELETE'
- path: `path`
- Schema: [new Invalidate(schema)](./Invalidate.md)
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

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)
