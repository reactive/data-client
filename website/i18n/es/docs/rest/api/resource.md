---
id: resource
title: Define Resources de API REST en TypeScript a escala
sidebar_label: resource
description: Los Resources son una colección de RestEndpoints que operan sobre datos comunes al compartir un schema
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import StackBlitz from '@site/src/components/StackBlitz';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import DeleteProcess from './\_DeleteProcess.mdx';

# Resource

Los `Resources` son una colección de [RestEndpoints](./RestEndpoint.md) que operan sobre datos
comunes al compartir un [schema](./schema.md)

## Uso {#usage}

```ts title="resources/Todo.ts"
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;

  static key = 'Todo';
}

const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

:::react

```ts title="Resources start with 6 Endpoints"
const todo = useSuspense(TodoResource.get, { id: '5' });
const todos = useSuspense(TodoResource.getList);
controller.fetch(TodoResource.getList.push, {
  title: 'finish installing reactive data client',
});
controller.fetch(
  TodoResource.update,
  { id: '5' },
  { ...todo, completed: true },
);
controller.fetch(
  TodoResource.partialUpdate,
  { id: '5' },
  { completed: true },
);
controller.fetch(TodoResource.delete, { id: '5' });
```

:::

:::vue

```ts title="Resources start with 6 Endpoints"
const todo = await useSuspense(TodoResource.get, { id: '5' });
const todos = await useSuspense(TodoResource.getList);
controller.fetch(TodoResource.getList.push, {
  title: 'finish installing reactive data client',
});
controller.fetch(
  TodoResource.update,
  { id: '5' },
  { ...todo.value, completed: true },
);
controller.fetch(
  TodoResource.partialUpdate,
  { id: '5' },
  { completed: true },
);
controller.fetch(TodoResource.delete, { id: '5' });
```

:::

## Argumentos {#arguments}

```ts
{
  path: string;
  schema: Schema;
  urlPrefix?: string;
  body?: any;
  searchParams?: any;
  paginationField?: string;
  optimistic?: boolean;
  Endpoint?: typeof RestEndpoint;
  Collection?: typeof Collection;
} & EndpointExtraOptions
```

### path {#path}

Se pasa a [RestEndpoint.path](./RestEndpoint.md#path) para los [endpoints](#members) de un solo elemento.
Usa la sintaxis de [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp); consulta
[RestEndpoint.path](./RestEndpoint.md#path) para ver todos los detalles sobre
[parámetros opcionales](./RestEndpoint.md#path), [comodines](./RestEndpoint.md#path),
[nombres entre comillas](./RestEndpoint.md#path) y [escape](./RestEndpoint.md#path).

Las creaciones ([getList.push](#push)/[getList.unshift](#unshift)) y [getList](#getlist) eliminan el último token `:param` o `*wildcard`.

```ts
const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
});

// GET /react/posts/abc
PostResource.get({ group: 'react', id: 'abc' });
// PATCH /react/posts/abc
PostResource.partialUpdate({ group: 'react', id: 'abc' }, { title: 'This new title' });
// GET /react/posts
PostResource.getList({ group: 'react' });
```

Los parámetros opcionales usan la sintaxis `{}`:

```ts
const PostResource = resource({
  schema: Post,
  path: '/:group/posts{/:id}',
});

PostResource.get({ group: 'react', id: 'abc' });
PostResource.getList({ group: 'react' });
```

Los parámetros comodín también se admiten como último token:

```ts
const FileResource = resource({
  schema: File,
  path: '/repos/:owner/*path',
});

// GET /repos/john/src/index.ts
FileResource.get({ owner: 'john', path: ['src', 'index.ts'] });
// GET /repos/john
FileResource.getList({ owner: 'john' });
```

### schema {#schema}

Se pasa a [RestEndpoint.schema](./RestEndpoint.md#schema) y representa un solo elemento. Normalmente es
una [Entity](./Entity.md) o una [Union](./Union.md).

- [getList](#getlist) usa una [Collection](./Collection.md) de [Array](./Array.md) del schema.
- [delete](#delete) usa un [Invalidate](./Invalidate.md) del schema.

### urlPrefix {#urlprefix}

Se pasa a [RestEndpoint.urlPrefix](./RestEndpoint.md#urlPrefix)

### searchParams {#searchparams}

Se pasa a [RestEndpoint.searchParams](./RestEndpoint.md#searchParams) para [getList](#getlist) y [getList.push](#push)

### body {#body}

Se pasa a [RestEndpoint.body](./RestEndpoint.md#body) para [getList.push](#push), [update](#update) y [partialUpdate](#partialupdate)

### paginationField {#paginationfield}

Si se especifica, agregará el método [Resource.getList.getPage](#getpage) al `Resource`.

### nonFilterArgumentKeys {#nonfilterargumentkeys}

Opción que se pasa directamente a [Collection.nonFilterArgumentKeys](./Collection.md#nonFilterArgumentKeys)
para el schema de [getList](#getlist).

```ts
const PostResource = resource({
  path: '/:group/posts/:id',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: Post,
  nonFilterArgumentKeys: ['orderBy'],
});
```

También se admiten las formas `RegExp` y función:

```ts
resource({
  path: '/:group/posts/:id',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: Post,
  nonFilterArgumentKeys: /orderBy/,
});
```

### optimistic {#optimistic}

`true` hace que todos los endpoints de mutación sean [optimistas](../guides/optimistic-updates.md), de modo que las actualizaciones de la <abbr title="User Interface">UI</abbr>
sean inmediatas, incluso antes de que el fetch termine.

### Endpoint {#endpoint}

Clase usada para construir los miembros.

```ts
import { RestEndpoint } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getRequestInit(body: any): Promise<RequestInit> {
    return {
      ...(await super.getRequestInit(body)),
      credentials: 'same-origin',
    };
  }
}
const TodoResource = resource({
  path: '/todos/:id',
  schema: Todo,
  // highlight-next-line
  Endpoint: AuthdEndpoint,
});
```

### Collection {#collection}

[Clase Collection](./Collection.md) usada para construir el schema de [getList](#getlist).
Úsala cuando necesites personalizar el comportamiento de la colección más allá de
[`nonFilterArgumentKeys`](#nonfilterargumentkeys), como cambiar la lógica de combinación de move.

```ts
import { resource, Collection, unshift } from '@data-client/rest';

class MyCollection<
  S extends any[] | PolymorphicInterface = any,
  Parent extends any[] = [urlParams: any, body?: any],
> extends Collection<S, Parent> {
  constructor(schema: S) {
    super(schema);
    // prepend moved items instead of appending
    this.move = this.moveWith(unshift);
  }
}
const TodoResource = resource({
  path: '/todos/:id',
  searchParams: {} as { userId?: string; orderBy?: string } | undefined,
  schema: Todo,
  // highlight-next-line
  Collection: MyCollection,
});
```

### [EndpointExtraOptions](./RestEndpoint.md#dataexpirylength) {#endpointextraoptions}

Opciones: dataExpiryLength, errorExpiryLength, errorPolicy, invalidIfStale, pollFrequency

## Miembros {#members}

Estos proporcionan los [endpoints](./Endpoint.md) [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
estándar, comunes en las APIs [REST](https://www.restapitutorial.com/). Siéntete libre de [personalizar o añadir
nuevos endpoints](#extend-new) para que se ajusten a tu API.

```ts
const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
  paginationField: 'page',
});
```

| Nombre                      | Método                                                                     | Args                                                | Schema                                                |
| --------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| [get](#get)                 | [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)       | `[{group: string; id: string}]`                     | [Post](./Entity.md)                                   |
| [getList](#getlist)         | [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)       | `[{group: string; author?: string}]`                | [Collection([Post])](./Collection.md)                 |
| [getList.push](#push)       | [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST)     | `[{group: string; author?: string}, Partial<Post>]` | [Collection([Post]).push](./Collection.md#push)       |
| [getList.unshift](#unshift) | [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST)     | `[{group: string; author?: string}, Partial<Post>]` | [Collection([Post]).unshift](./Collection.md#unshift) |
| [getList.getPage](#getpage) | [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)       | `[{group: string; author?: string; page: string}]`  | [Collection([Post]).addWith](./Collection.md#addWith) |
| [getList.move](#move)       | [PATCH](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH)   | `[{group: string; id: string }, Partial<Post>]`     | [Collection([Post]).move](./Collection.md#move)       |
| [update](#update)           | [PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT)       | `[{group: string; id: string }, Partial<Post>]`     | [Post](./Entity.md)                                   |
| [partialUpdate](#update)    | [PATCH](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH)   | `[{group: string; id: string }, Partial<Post>]`     | [Post](./Entity.md)                                   |
| [delete](#delete)           | [DELETE](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE) | `[{group: string; id: string }]`                    | [Invalidate(Post)](./Invalidate.md)                   |

### get {#get}

Obtiene una sola entidad.

<EndpointPlayground input="/react/posts/1" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}} status={200} response={{  "id": "1","group": "react","title": "this post",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.get({
  group: 'react',
  id: '1',
});
```

</EndpointPlayground>

| Campo | Valor             |
| :----: | ----------------- |
| method | 'GET'             |
|  path  | [path](#path)     |
| schema | [schema](#schema) |

Se usa comúnmente con [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate) y [Controller.expireAll](/docs/api/Controller#expireAll)

### getList {#getlist}

Obtiene una lista de entidades.

<EndpointPlayground input="/react/posts?author=clara" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}} status={200} response={[{ "id": "1","group": "react","title": "this post",author: 'clara',}]}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList({
  group: 'react',
  author: 'clara',
});
```

</EndpointPlayground>

| Campo | Valor                                                |
| :-------------: | ---------------------------------------------------- |
|     method      | 'GET'                                                |
|      path       | removeLastArg([path](#path))                         |
|  searchParams   | [searchParams](#searchparams)                        |
| paginationField | [paginationField](#paginationfield)                  |
|     schema      | [new Collection(\[schema\])](./Collection.md) |

<!-- prettier-ignore-start -->
```ts
resource({ path: '/:first/:second' }).getList.path === '/:first';
resource({ path: '/:first' }).getList.path === '/';
resource({ path: '/:owner/*path' }).getList.path === '/:owner';
```
<!-- prettier-ignore-end -->

Se usa comúnmente con [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate) y [Controller.expireAll](/docs/api/Controller#expireAll)

### getList.push {#push}

[RestEndpoint.push](./RestEndpoint.md#push) crea una nueva entidad y la agrega al final de getList. Usa [getList.unshift](#unshift)
para colocarla al principio. Pasa un array como cuerpo para crear varias a la vez.

<EndpointPlayground input="/react/posts?author=clara" init={{method: 'POST', headers: {'Content-Type': 'application/json'},body: JSON.stringify({ "title": "winning" })}} status={201} response={{  "id": "2","group": "react","title": "winning",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList.push(
  { group: 'react', author: 'clara' },
  { title: 'winning' },
);
```

</EndpointPlayground>

| Campo | Valor                                       |
| :----------: | ------------------------------------------- |
|    method    | 'POST'                                      |
|     path     | removeLastArg([path](#path))                |
| searchParams | [searchParams](#searchparams)               |
|     body     | [body](#body)                               |
|    schema    | getList.[schema.push](./Collection.md#push) |

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### getList.unshift {#unshift}

[RestEndpoint.unshift](./RestEndpoint.md#unshift) crea una nueva entidad y la agrega al principio de getList.

<EndpointPlayground input="/react/posts?author=clara" init={{method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ "title": "winning" })}} status={201} response={{  "id": "2","group": "react","title": "winning",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList.unshift(
  { group: 'react', author: 'clara' },
  { title: 'winning' },
);
```

</EndpointPlayground>

| Campo | Valor                                             |
| :----------: | ------------------------------------------------- |
|    method    | 'POST'                                            |
|     path     | removeLastArg([path](#path))                      |
| searchParams | [searchParams](#searchparams)                     |
|     body     | [body](#body)                                     |
|    schema    | getList.[schema.unshift](./Collection.md#unshift) |

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### getList.getPage {#getpage}

[RestEndpoint.getPage](./RestEndpoint.md#getpage) obtiene otra [página](../guides/pagination.md#infinite-scrolling) y la añade a getList asegurando que no haya duplicados.

Este miembro solo está disponible cuando se especifica [paginationField](#paginationfield).

<EndpointPlayground input="/react/posts?author=clara&page=2" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}} status={200} response={[{ "id": "5","group": "react","title": "second page",author: 'clara',}]}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
  paginationField: 'page',
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList.getPage({
  group: 'react',
  author: 'clara',
  page: 2,
});
```

</EndpointPlayground>

| Campo | Valor                                               |
| :-------------: | --------------------------------------------------- |
|     method      | 'GET'                                               |
|      path       | removeLastArg([path](#path))                        |
|  searchParams   | [searchParams](#searchparams)                       |
| paginationField | [paginationField](#paginationfield)                 |
|     schema      | [getList.schema.addWith](./Collection.md#addWith) |

args: `PathToArgs(shortenPath(path)) & searchParams & \{ [paginationField]: string | number \}`

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### getList.move {#move}

[RestEndpoint.move](./RestEndpoint.md#move) mueve una entidad entre [Collections](./Collection.md): la elimina de
las colecciones que coinciden con su estado anterior y la agrega a las colecciones que coinciden con los nuevos valores del cuerpo.

<EndpointPlayground input="/react/posts/1" init={{method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ "group": "vue" })}} status={200} response={{  "id": "1","group": "vue","title": "this post",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList.move(
  { group: 'react', id: '1' },
  { group: 'vue' },
);
```

</EndpointPlayground>

| Campo | Valor                                       |
| :----------: | ------------------------------------------- |
|    method    | 'PATCH'                                     |
|     path     | [path](#path)                               |
|     body     | [body](#body)                               |
|    schema    | getList.[schema.move](./Collection.md#move) |

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### update {#update}

Actualiza una entidad.

<EndpointPlayground input="/react/posts/1" init={{method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ "title": "updated title", author: 'clara' })}} status={200} response={{  "id": "1","group": "react","title": "updated title",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.update(
  { group: 'react', id: '1' },
  { title: 'updated title', author: 'clara' },
);
```

</EndpointPlayground>

| Campo | Valor             |
| :----: | ----------------- |
| method | 'PUT'             |
|  path  | [path](#path)     |
|  body  | [body](#body)     |
| schema | [schema](#schema) |

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### partialUpdate {#partialupdate}

Actualiza un subconjunto de los campos de una entidad.

<EndpointPlayground input="/react/posts/1" init={{method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ "title": "updated title" })}} status={200} response={{  "id": "1","group": "react","title": "updated title",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.partialUpdate(
  { group: 'react', id: '1' },
  { title: 'updated title' },
);
```

</EndpointPlayground>

| Campo | Valor             |
| :----: | ----------------- |
| method | 'PATCH'           |
|  path  | [path](#path)     |
|  body  | [body](#body)     |
| schema | [schema](#schema) |

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

### delete {#delete}

Elimina una entidad.

<EndpointPlayground input="/react/posts/1" init={{method: 'DELETE', headers: {'Content-Type': 'application/json', }}} status={200} response={{ "id": "1" }}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.delete({ group: 'react', id: '1' });
```

</EndpointPlayground>

| Campo | Valor                                            |
| :-----: | ------------------------------------------------ |
| method  | 'DELETE'                                         |
|  path   | [path](#path)                                    |
| schema  | [new Invalidate(schema)](./Invalidate.md) |
| process | <DeleteProcess />                                |

Se usa comúnmente con [Controller.fetch](/docs/api/Controller#fetch)

#### Respuesta {#response}

```json
{ "id": "xyz" }
```

La respuesta debe ser la [pk](./Entity.md#pk) como string (como `'xyz'`), o un objeto con los miembros necesarios para calcular
[Entity.pk](./Entity.md#pk) (como `{id: 'xyz'}`).

Si no se proporciona una respuesta, la implementación de `process` intentará usar los parámetros de la URL enviados como un objeto para calcular
la [Entity.pk](./Entity.md#pk). Esto permite que la implementación por defecto siga funcionando sin respuesta, siempre que se usen
los argumentos estándar.

Esto permite que [Invalidate](./Invalidate.md) elimine la entidad de la [tabla de entidades](/docs/concepts/normalization)

### extend() {#extend}

`resource` es un excelente punto de partida, pero a menudo los endpoints necesitan [personalizarse más](./RestEndpoint.md#typing).

`extend()` es polimórfico y tiene tres formas:

#### Forma de función (para obtener BaseResource/super) {#extend-function}

Es la más flexible, pero también la más verbosa.

```ts
export const IssueResource= resource({
  path: '/repos/:owner/:repo/issues/:number',
  schema: Issue,
  pollFrequency: 60000,
  searchParams: {} as IssueFilters | undefined,
}).extend(BaseResource => ({
  search: BaseResource.getList.extend({
    path: '/search/issues?{q=:q}%20repo\\::owner/:repo{&page=:page}',
    schema: {
      results: {
        incompleteResults: false,
        items: BaseIssueResource.getList.schema.results,
        totalCount: 0,
      },
      link: '',
    },
  })
)});
```

#### Extensión por lotes de miembros conocidos {#extend-override}

Esto solo funciona con miembros existentes.

```ts
export const CommentResource = resource({
  path: '/repos/:owner/:repo/issues/comments/:id',
  schema: Comment,
}).extend({
  getList: { path: '/repos/:owner/:repo/issues/:number/comments' },
  update: { body: { body: '' } },
});
```

#### Añadir nuevos miembros {#extend-new}

Esto solo puede añadir un endpoint a la vez.

```ts
export const UserResource = createGithubResource({
  path: '/users/:login',
  schema: User,
}).extend('current', {
  path: '/user',
  schema: User,
});
```


#### Github CommentResource {#github-commentresource}

<StackBlitz app="github-app" file="src/pages/IssueDetail/CommentsList.tsx,src/resources/Comment.ts" initialpath="/reactjs/rfcs/issue/68" view="editor" height={600} />

## Patrones de herencia de funciones {#function-inheritance-patterns}

Para reutilizar código relacionado con las definiciones de `Resource`, puedes crear tu propia función que llame a resource().
Esto tiene efectos similares a la herencia basada en clases, con el beneficio añadido de permitir sobrescribir
los tipos por completo.

```typescript
import {
  resource,
  RestEndpoint,
  Collection,
  type EndpointExtraOptions,
  type RestGenerics,
  type ResourceGenerics,
  type ResourceOptions,
} from '@data-client/rest';

export class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = process.env.API_SERVER ?? 'http://localhost:8000';

  async getRequestInit(body: any): Promise<RequestInit> {
    return {
      ...(await super.getRequestInit(body)),
      credentials: 'same-origin',
    };
  }
}

export function myResource<O extends ResourceGenerics = any>({
  schema,
  Endpoint = AuthdEndpoint,
  ...extraOptions
}: Readonly<O> & ResourceOptions) {
  return resource({
    Endpoint,
    schema,
    ...extraOptions,
  }).extend({
    getList: {
      schema: {
        results: new Collection([schema]),
        total: 0,
        limit: 0,
        skip: 0,
      },
    },
  });
}
```

### GraphQL + REST híbrido {#graphql--rest-hybrid}

Cuando tu API ofrece endpoints tanto REST como GraphQL, puedes combinarlos en un solo resource.
Usa [Entity.process()](/rest/api/Entity#process) para normalizar las distintas formas de respuesta.

```typescript
import { GQLEndpoint } from '@data-client/graphql';
import { Entity, resource } from '@data-client/rest';

const gql = new GQLEndpoint('https://api.myservice.com/graphql');

export class Repository extends Entity {
  id = '';
  name = '';
  owner = { login: '' };
  stargazersCount = 0;
  forksCount = 0;

  pk() {
    return `${this.owner.login}/${this.name}`;
  }

  static key = 'Repository';
}

/** Normalizes GraphQL response shape to match REST Entity */
export class GqlRepository extends Repository {
  static process(input: any, parent: any, key: string | undefined) {
    // GraphQL uses different field names than REST
    if ('stargazerCount' in input) {
      return {
        ...input,
        stargazersCount: input.stargazerCount,
        forksCount: input.forkCount,
      };
    }
    return input;
  }
}

export const RepositoryResource = resource({
  path: '/repos/:owner/:repo',
  schema: Repository,
}).extend(base => ({
  // REST endpoint for single repo
  get: base.get,
  // GraphQL endpoint for user's pinned repos
  getByPinned: gql.query(
    (v: { login: string }) => `query ($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              id
              name
              owner { login }
              stargazerCount
              forkCount
            }
          }
        }
      }
    }`,
    { user: { pinnedItems: { nodes: [GqlRepository] } } },
  ),
}));
```

#### Ejemplo de Github {#github-example}

<StackBlitz app="github-app" file="src/resources/Base.ts" view="editor" height={750} />
