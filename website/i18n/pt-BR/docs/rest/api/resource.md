---
id: resource
title: Defina Resources de API REST em TypeScript em escala
sidebar_label: resource
description: Resources são uma coleção de RestEndpoints que operam sobre dados em comum ao compartilhar um schema
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

`Resources` são uma coleção de [RestEndpoints](./RestEndpoint.md) que operam sobre dados em comum
ao compartilhar um [schema](./schema.md)

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

Repassado para [RestEndpoint.path](./RestEndpoint.md#path) nos [endpoints](#members) de item único.
Usa a sintaxe do [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp); veja
[RestEndpoint.path](./RestEndpoint.md#path) para detalhes completos sobre
[parâmetros opcionais](./RestEndpoint.md#path), [wildcards](./RestEndpoint.md#path),
[nomes entre aspas](./RestEndpoint.md#path) e [escape](./RestEndpoint.md#path).

Create ([getList.push](#push)/[getList.unshift](#unshift)) e [getList](#getlist) removem o último token `:param` ou `*wildcard`.

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

Parâmetros opcionais usam a sintaxe `{}`:

```ts
const PostResource = resource({
  schema: Post,
  path: '/:group/posts{/:id}',
});

PostResource.get({ group: 'react', id: 'abc' });
PostResource.getList({ group: 'react' });
```

Parâmetros wildcard também são aceitos como último token:

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

Repassado para [RestEndpoint.schema](./RestEndpoint.md#schema), representando um único item. Normalmente é
uma [Entity](./Entity.md) ou [Union](./Union.md).

- [getList](#getlist) usa uma [Collection](./Collection.md) de [Array](./Array.md) do schema.
- [delete](#delete) usa um [Invalidate](./Invalidate.md) do schema.

### urlPrefix {#urlprefix}

Repassado para [RestEndpoint.urlPrefix](./RestEndpoint.md#urlPrefix)

### searchParams {#searchparams}

Repassado para [RestEndpoint.searchParams](./RestEndpoint.md#searchParams) em [getList](#getlist) e [getList.push](#push)

### body {#body}

Repassado para [RestEndpoint.body](./RestEndpoint.md#body) em [getList.push](#push), [update](#update) e [partialUpdate](#partialupdate)

### paginationField {#paginationfield}

Se especificado, adiciona o método [Resource.getList.getPage](#getpage) ao `Resource`.

### nonFilterArgumentKeys {#nonfilterargumentkeys}

Opção repassada para [Collection.nonFilterArgumentKeys](./Collection.md#nonFilterArgumentKeys)
no schema de [getList](#getlist).

```ts
const PostResource = resource({
  path: '/:group/posts/:id',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: Post,
  nonFilterArgumentKeys: ['orderBy'],
});
```

As formas `RegExp` e função também são aceitas:

```ts
resource({
  path: '/:group/posts/:id',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: Post,
  nonFilterArgumentKeys: /orderBy/,
});
```

### optimistic {#optimistic}

`true` torna todos os endpoints de mutação [otimistas](../guides/optimistic-updates.md), fazendo com que as atualizações da <abbr title="Interface de Usuário">UI</abbr>
sejam imediatas, mesmo antes da conclusão do fetch.

### Endpoint {#endpoint}

Classe usada para construir os membros.

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

[Classe Collection](./Collection.md) usada para construir o schema de [getList](#getlist).
Use-a quando precisar personalizar o comportamento da collection além de
[`nonFilterArgumentKeys`](#nonfilterargumentkeys), como alterar a lógica de merge do move.

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

Inclui: dataExpiryLength, errorExpiryLength, errorPolicy, invalidIfStale, pollFrequency

## Membros {#members}

Eles fornecem os [endpoints](./Endpoint.md) [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
padrão, comuns em APIs [REST](https://www.restapitutorial.com/). Sinta-se à vontade para [personalizar ou adicionar
novos endpoints](#extend-new) para se adequar à sua API.

```ts
const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
  paginationField: 'page',
});
```

| Nome                        | Método                                                                     | Args                                                | Schema                                                |
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

Obtém uma única entity.

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

| Campo  | Valor             |
| :----: | ----------------- |
| method | 'GET'             |
|  path  | [path](#path)     |
| schema | [schema](#schema) |

Normalmente usado com [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate), [Controller.expireAll](/docs/api/Controller#expireAll)

### getList {#getlist}

Obtém uma lista de entities.

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

|      Campo      | Valor                                                |
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

Normalmente usado com [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate), [Controller.expireAll](/docs/api/Controller#expireAll)

### getList.push {#push}

[RestEndpoint.push](./RestEndpoint.md#push) cria uma nova entity e a adiciona ao final de getList. Use [getList.unshift](#unshift)
para colocá-la no início. Passe um array como body para criar várias de uma só vez.

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

|    Campo     | Valor                                       |
| :----------: | ------------------------------------------- |
|    method    | 'POST'                                      |
|     path     | removeLastArg([path](#path))                |
| searchParams | [searchParams](#searchparams)               |
|     body     | [body](#body)                               |
|    schema    | getList.[schema.push](./Collection.md#push) |

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### getList.unshift {#unshift}

[RestEndpoint.unshift](./RestEndpoint.md#unshift) cria uma nova entity e a adiciona ao início de getList.

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

|    Campo     | Valor                                             |
| :----------: | ------------------------------------------------- |
|    method    | 'POST'                                            |
|     path     | removeLastArg([path](#path))                      |
| searchParams | [searchParams](#searchparams)                     |
|     body     | [body](#body)                                     |
|    schema    | getList.[schema.unshift](./Collection.md#unshift) |

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### getList.getPage {#getpage}

[RestEndpoint.getPage](./RestEndpoint.md#getpage) obtém outra [página](../guides/pagination.md#infinite-scrolling), acrescentando-a a getList e garantindo que não haja duplicatas.

Este membro só está disponível quando [paginationField](#paginationfield) é especificado.

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

|      Campo      | Valor                                               |
| :-------------: | --------------------------------------------------- |
|     method      | 'GET'                                               |
|      path       | removeLastArg([path](#path))                        |
|  searchParams   | [searchParams](#searchparams)                       |
| paginationField | [paginationField](#paginationfield)                 |
|     schema      | [getList.schema.addWith](./Collection.md#addWith) |

args: `PathToArgs(shortenPath(path)) & searchParams & \{ [paginationField]: string | number \}`

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### getList.move {#move}

[RestEndpoint.move](./RestEndpoint.md#move) move uma entity entre [Collections](./Collection.md), removendo-a das
collections que correspondem ao seu estado antigo e adicionando-a às collections que correspondem aos novos valores do body.

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

|    Campo     | Valor                                       |
| :----------: | ------------------------------------------- |
|    method    | 'PATCH'                                     |
|     path     | [path](#path)                               |
|     body     | [body](#body)                               |
|    schema    | getList.[schema.move](./Collection.md#move) |

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### update {#update}

Atualiza uma entity.

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

| Campo  | Valor             |
| :----: | ----------------- |
| method | 'PUT'             |
|  path  | [path](#path)     |
|  body  | [body](#body)     |
| schema | [schema](#schema) |

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### partialUpdate {#partialupdate}

Atualiza um subconjunto de campos de uma entity.

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

| Campo  | Valor             |
| :----: | ----------------- |
| method | 'PATCH'           |
|  path  | [path](#path)     |
|  body  | [body](#body)     |
| schema | [schema](#schema) |

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

### delete {#delete}

Exclui uma entity.

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

|  Campo  | Valor                                            |
| :-----: | ------------------------------------------------ |
| method  | 'DELETE'                                         |
|  path   | [path](#path)                                    |
| schema  | [new Invalidate(schema)](./Invalidate.md) |
| process | <DeleteProcess />                                |

Normalmente usado com [Controller.fetch](/docs/api/Controller#fetch)

#### Response {#response}

```json
{ "id": "xyz" }
```

A resposta deve ser a [pk](./Entity.md#pk) como string (como `'xyz'`) ou um objeto com os membros necessários para calcular
a [Entity.pk](./Entity.md#pk) (como `{id: 'xyz'}`).

Se nenhuma resposta for fornecida, a implementação de `process` tentará usar os parâmetros da url enviados como objeto para calcular
a [Entity.pk](./Entity.md#pk). Isso permite que a implementação padrão continue funcionando sem resposta, desde que sejam usados
argumentos padrão.

Isso permite que [Invalidate](./Invalidate.md) remova a entity da [tabela de entities](/docs/concepts/normalization)

### extend() {#extend}

`resource` constrói um ótimo ponto de partida, mas muitas vezes os endpoints precisam ser [personalizados ainda mais](./RestEndpoint.md#typing).

`extend()` é polimórfico, com três formas:

#### Forma de função (para obter BaseResource/super) {#extend-function}

É a mais flexível, mas também a mais verbosa.

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

#### Extensão em lote de membros conhecidos {#extend-override}

Funciona apenas com membros existentes.

```ts
export const CommentResource = resource({
  path: '/repos/:owner/:repo/issues/comments/:id',
  schema: Comment,
}).extend({
  getList: { path: '/repos/:owner/:repo/issues/:number/comments' },
  update: { body: { body: '' } },
});
```

#### Adicionando novos membros {#extend-new}

Só consegue adicionar um endpoint por vez.

```ts
export const UserResource = createGithubResource({
  path: '/users/:login',
  schema: User,
}).extend('current', {
  path: '/user',
  schema: User,
});
```


#### CommentResource do Github {#github-commentresource}

<StackBlitz app="github-app" file="src/pages/IssueDetail/CommentsList.tsx,src/resources/Comment.ts" initialpath="/reactjs/rfcs/issue/68" view="editor" height={600} />

## Padrões de herança com funções {#function-inheritance-patterns}

Para reutilizar código relacionado às definições de `Resource`, você pode criar sua própria função que chama resource().
Isso tem efeitos semelhantes aos da herança baseada em classes, com o benefício adicional de permitir sobrescritas
completas de tipagem.

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

### Híbrido GraphQL + REST {#graphql--rest-hybrid}

Quando sua API oferece endpoints REST e GraphQL, você pode misturá-los em um único resource.
Use [Entity.process()](/rest/api/Entity#process) para normalizar diferentes formatos de resposta.

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

#### Exemplo do Github {#github-example}

<StackBlitz app="github-app" file="src/resources/Base.ts" view="editor" height={750} />
