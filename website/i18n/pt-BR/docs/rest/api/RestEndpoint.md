---
title: RestEndpoint - Definições de API HTTP baseadas em path, com tipagem forte
sidebar_label: RestEndpoint
description: Definições de API HTTP extensíveis, baseadas em path e com tipagem forte.
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import Grid from '@site/src/components/Grid';
import Link from '@docusaurus/Link';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';

# RestEndpoint

`RestEndpoints` são para protocolos baseados em [HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP), como o REST.

:::info estende

`RestEndpoint` estende [Endpoint](./Endpoint.md)

:::

<details>
<summary><b>Interface</b></summary>

<Tabs
defaultValue="RestEndpoint"
values={[
{ label: 'RestEndpoint', value: 'RestEndpoint' },
{ label: 'Endpoint', value: 'Endpoint' },
]}>
<TabItem value="RestEndpoint">

```typescript
interface RestGenerics {
  readonly path: string;
  readonly schema?: Schema | undefined;
  readonly method?: string;
  readonly body?: any;
  readonly searchParams?: any;
  readonly paginationField?: string;
  readonly content?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream';
  process?(value: any, ...args: any): any;
}

export class RestEndpoint<O extends RestGenerics = any> extends Endpoint {
  /* Prepare fetch */
  readonly path: string;
  readonly urlPrefix: string;
  readonly requestInit: RequestInit;
  readonly method: string;
  readonly paginationField?: string;
  readonly content?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream';
  readonly signal: AbortSignal | undefined;
  url(...args: Parameters<F>): string;
  searchToString(searchParams: Record<string, any>): string;
  getRequestInit(
    this: any,
    body?: RequestInit['body'] | Record<string, unknown>,
  ): Promise<RequestInit> | RequestInit;
  getHeaders(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;

  /* Perform/process fetch */
  fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
  parseResponse(response: Response): Promise<any>;
  process(value: any, ...args: Parameters<F>): any;

  testKey(key: string): boolean;
}
```

</TabItem>
<TabItem value="Endpoint">

```typescript
class Endpoint<F extends (...args: any) => Promise<any>> {
  constructor(fetchFunction: F, options: EndpointOptions);

  key(...args: Parameters<F>): string;

  readonly sideEffect?: true;

  readonly schema?: Schema;

  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in milliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly getOptimisticResponse?: (
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ) => ResolveType<F>;
  /** Determines whether to throw or fallback to */
  readonly errorPolicy?: (error: any) => 'soft' | undefined;

  testKey(key: string): boolean;
}
```

</TabItem>
</Tabs>

</details>

## Uso {#usage}

Todas as opções são aceitas como argumentos do construtor, de [extend](#extend) e como sobrescritas ao usar [herança](#inheritance)

### Busca mais simples {#simplest-retrieval}

<Grid>

```ts
const getTodo = new RestEndpoint({
  path: '/todos/:id',
});
```

```ts
const todo = await getTodo({ id: 1 });
```

</Grid>

### Compartilhamento de configuração {#configuration-sharing}

Use [RestEndpoint.extend()](#extend) em vez de `{...getTodo}` ([spread de objeto](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals))

```ts
const updateTodo = getTodo.extend({ method: 'PUT' });
```

### Gerenciando o estado {#managing-state}

<TypeScriptEditor>

```ts path=Todo.ts
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;
}

export const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
export const updateTodo = getTodo.extend({ method: 'PUT' });
```

</TypeScriptEditor>

Usar um [Schema](./schema.md) possibilita a [consistência automática dos dados](/docs/concepts/normalization) sem a necessidade de prejudicar o desempenho com [novos fetches](/docs/api/Controller#expireAll).

### Tipagem {#typing}

<TypeScriptEditor>

```ts title="Comment" collapsed
export class Comment extends Entity {
  id = '';
  title = '';
  body = '';
  postId = '';

  static key = 'Comment';
}
```

:::react

```ts title="Usage"
import { Comment } from './Comment';

const getComments = new RestEndpoint({
  path: '/posts/:postId/comments',
  schema: new Collection([Comment]),
  searchParams: {} as { sortBy?: 'votes' | 'recent' } | undefined,
});

// Hover your mouse over 'comments' to see its type
const comments = useSuspense(getComments, {
  postId: '5',
  sortBy: 'votes',
});

const ctrl = useController();
const createComment = async data =>
  ctrl.fetch(getComments.push, { postId: '5' }, data);
```

:::

:::vue

```ts title="Usage"
import { Comment } from './Comment';

const getComments = new RestEndpoint({
  path: '/posts/:postId/comments',
  schema: new Collection([Comment]),
  searchParams: {} as { sortBy?: 'votes' | 'recent' } | undefined,
});

// Hover your mouse over 'comments' to see its type
const comments = await useSuspense(getComments, {
  postId: '5',
  sortBy: 'votes',
});

const ctrl = useController();
const createComment = async data =>
  ctrl.fetch(getComments.push, { postId: '5' }, data);
```

:::

</TypeScriptEditor>

#### Resolução/Retorno {#resolutionreturn}

[schema](#schema) determina o valor de retorno quando usado com :react[hooks]:vue[composables] de vinculação de dados, como [useSuspense](/docs/api/useSuspense), [useDLE](/docs/api/useDLE), [useCache](/docs/api/useCache),
ou quando usado com [Controller.fetch](/docs/api/Controller#fetch)

<TypeScriptEditor>

```ts title="Todo.ts" collapsed
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;

  static key = 'Todo';
}
```

:::react

```ts title="getTodo.ts"
import { Todo } from './Todo';

const getTodo = new RestEndpoint({ path: '/', schema: Todo });
// Hover your mouse over 'todo' to see its type
const todo = useSuspense(getTodo);

async () => {
  const ctrl = useController();
  const todo2 = await ctrl.fetch(getTodo);
};
```

:::

:::vue

```ts title="getTodo.ts"
import { Todo } from './Todo';

const getTodo = new RestEndpoint({ path: '/', schema: Todo });
// Hover your mouse over 'todo' to see its type
const todo = await useSuspense(getTodo);

async () => {
  const ctrl = useController();
  const todo2 = await ctrl.fetch(getTodo);
};
```

:::

</TypeScriptEditor>

[process](#process) determina o valor de resolução quando o endpoint é chamado diretamente. Para
`RestEndpoints` sem schema, também determina o tipo de retorno dos :react[[hooks](/docs/api/useSuspense)]:vue[[composables](/docs/api/useSuspense)] e de [Controller.fetch](/docs/api/Controller#fetch).

<TypeScriptEditor>

```ts path="process.ts"
interface TodoInterface {
  title: string;
  completed: boolean;
}
const getTodo = new RestEndpoint({
  path: '/',
  process(value): TodoInterface {
    return value;
  },
});
async () => {
  // todo is TodoInterface
  const todo = await getTodo();

  const ctrl = useController();
  const todo2 = await ctrl.fetch(getTodo);
};
```

</TypeScriptEditor>

#### Parâmetros da função {#function-parameters}

[path](#path), usado para construir a url, determina o tipo do primeiro argumento. Se não tiver padrões,
o 'primeiro' argumento é omitido.

<TypeScriptEditor>

```ts
const getRoot = new RestEndpoint({ path: '/' });
getRoot();
const getById = new RestEndpoint({ path: '/:id' });
// both number and string types work as they are serialized into strings to construct the url
getById({ id: 5 });
getById({ id: '5' });
```

</TypeScriptEditor>

[method](#method) determina se existe um segundo argumento a ser enviado como [body](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#body).

<TypeScriptEditor>

```ts path=method.ts
export const update = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
});
update({ id: 5 }, { title: 'updated', completed: true });
```

</TypeScriptEditor>

No entanto, ele é tipado como 'any', então não detecta erros de digitação.

[body](#body) pode ser usado para tipar o argumento após os parâmetros da url. Ele é usado apenas para tipagem, então o
valor enviado não importa. O valor `undefined` pode ser usado para 'desabilitar' o segundo argumento.

<TypeScriptEditor>

```ts path=body.ts
export const update = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
  body: {} as TodoInterface,
});
update({ id: 5 }, { title: 'updated', completed: true });
// `undefined` disables 'body' argument
const rpc = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
  body: undefined,
});
rpc({ id: 5 });
```

</TypeScriptEditor>

[searchParams](#searchParams) pode ser usado de forma semelhante a `body` para especificar os tipos de parâmetros extras, usados
nos searchParams/queryParams do GET em uma [url()](#url).

```ts
const getUsers = new RestEndpoint({
  path: '/:group/user/:id',
  searchParams: {} as { isAdmin?: boolean; sort: 'asc' | 'desc' },
});
getUsers.url({ group: 'big', id: '5', sort: 'asc' }) ===
  '/big/user/5?sort=asc';
getUsers.url({
  group: 'big',
  id: '5',
  sort: 'desc',
  isAdmin: true,
}) === '/big/user/5?isAdmin=true&sort=desc';
```

## Ciclo de vida do fetch {#fetch-lifecycle}

RestEndpoint acrescenta ao Endpoint personalizações para um método de fetch fornecido, usando
[herança](#inheritance) ou [.extend()](#extend).

import Lifecycle from '../diagrams/\_restendpoint_lifecycle.mdx';

<Lifecycle/>

```ts title="fetch implementation for RestEndpoint"
function fetch(...args) {
  const urlParams = this.#hasBody && args.length < 2 ? {} : args[0] || {};
  const body = this.#hasBody ? args[args.length - 1] : undefined;
  return this.fetchResponse(
    this.url(urlParams),
    await this.getRequestInit(body),
  )
    .then(response => this.parseResponse(response))
    .then(res => this.process(res, ...args));
}
```

## Preparar o fetch {#prepare-fetch}

Os membros também servem como opções (segundo argumento do construtor). Embora nenhum seja obrigatório, os primeiros
têm valores padrão.

### url(params): string {#url}

`urlPrefix` + `path template` + '?' + searchToString(`searchParams`)

`url()` usa os `params` para preencher o [path template](#path). Os membros de `params` não utilizados são então usados
como [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) (também chamados de params do 'GET' - o que vem depois de `?`).

<details collapsed>
<summary><b>Implementação</b></summary>

```typescript
import { getUrlBase, getUrlTokens } from '@data-client/rest';

url(urlParams = {}) {
  const urlBase = getUrlBase(this.path)(urlParams);
  const tokens = getUrlTokens(this.path);
  const searchParams = {};
  Object.keys(urlParams).forEach(k => {
    if (!tokens.has(k)) {
      searchParams[k] = urlParams[k];
    }
  });
  if (Object.keys(searchParams).length) {
    return `${this.urlPrefix}${urlBase}?${this.searchToString(searchParams)}`;
  }
  return `${this.urlPrefix}${urlBase}`;
}
```

</details>

### searchToString(searchParams): string {#searchToString}

Constrói o componente [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) da [url](#url).

Por padrão, usa o global padrão [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

Os [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) (também chamados de queryParams) são ordenados para manter o determinismo.

<details collapsed>
<summary><b>Implementação</b></summary>

```typescript
searchToString(searchParams) {
  const params = new URLSearchParams(searchParams);
  params.sort();
  return params.toString();
}
```

</details>

#### Usando a biblioteca `qs` {#using-qs-library}

Para codificar objetos complexos nos searchParams, você pode usar a biblioteca [qs](https://github.com/ljharb/qs).

```typescript
import { RestEndpoint, RestGenerics } from '@data-client/rest';
import qs from 'qs';

class QSEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  searchToString(searchParams) {
    // highlight-next-line
    return qs.stringify(searchParams);
  }
}
```

<EndpointPlayground input="/foo?a%5Bb%5D=c" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}}>

```typescript title="QSEndpoint" collapsed {7}
import { RestEndpoint, RestGenerics } from '@data-client/rest';
import qs from 'qs';

export default class QSEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  searchToString(searchParams) {
    return qs.stringify(searchParams);
  }
}
```

```typescript title="getFoo"
import QSEndpoint from './QSEndpoint';

const getFoo = new QSEndpoint({
  path: '/foo',
  searchParams: {} as { a: Record<string, string> },
});

getFoo({ a: { b: 'c' } });
```

</EndpointPlayground>

### path: string {#path}

Usa o [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp) para construir
urls a partir dos parâmetros passados. Isso também informa os tipos, de modo que sejam aplicados corretamente.

#### Parâmetros {#parameters}

Palavras com o prefixo `:` são nomes de parâmetros. Tanto strings quanto números são aceitos como valores,
pois são serializados na string da url.

<TypeScriptEditor>

```ts
const getThing = new RestEndpoint({ path: '/:group/things/:id' });
getThing({ group: 'first', id: 77 });
```

</TypeScriptEditor>

#### Parâmetros opcionais {#optional-parameters}

Envolva o segmento opcional (incluindo seu prefixo) em `{}` para torná-lo [opcional](https://github.com/pillarjs/path-to-regexp?tab=readme-ov-file#optional).
O tipo dos parâmetros opcionais passa a ser `string | number | undefined`.

<TypeScriptEditor>

```ts
const optional = new RestEndpoint({
  path: '/:group/things{/:number}',
});
optional({ group: 'first' });
optional({ group: 'first', number: 'fifty' });
```

</TypeScriptEditor>

Vários segmentos opcionais podem ser encadeados com prefixos diferentes:

```ts
const ep = new RestEndpoint({
  path: '{/:attr1}{-:attr2}{-:attr3}',
});

ep({ attr1: 'hi' });
ep({ attr2: 'hi' });
ep({ attr1: 'hi', attr3: 'ho' });
```

#### Wildcards (parâmetros repetidos) {#wildcards-repeating-parameters}

`*name` corresponde a um ou mais segmentos do path. Envolva em `{}` para torná-lo zero ou mais (opcional).
Parâmetros wildcard são tipados como `string[]` (arrays), pois representam vários segmentos do path.

```ts
const files = new RestEndpoint({ path: '/files/*path' });
files({ path: ['documents', 'reports', 'q4'] });
// URL: /files/documents/reports/q4

const optionalFiles = new RestEndpoint({ path: '/files{/*path}' });
optionalFiles({});
// URL: /files
optionalFiles({ path: ['documents'] });
// URL: /files/documents
```

#### Nomes de parâmetros entre aspas {#quoted-parameter-names}

Os nomes de parâmetros devem ser identificadores JavaScript válidos. Nomes que contenham caracteres especiais
como `-` ou `.` devem ser colocados entre aspas duplas:

```ts
const ep = new RestEndpoint({ path: '/:"with-dash"/:"my.param"' });
ep({ 'with-dash': 'hello', 'my.param': 'world' });
```

#### Escapando caracteres especiais {#escaping-special-characters}

Os caracteres `{}()*:` e `\\` são especiais no path-to-regexp e devem ser escapados com `\\` quando usados como literais.

<TypeScriptEditor>

```ts
const getSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
});
getSite({ slug: 'first' });
```

</TypeScriptEditor>

`?` e `+` **não** são especiais no path-to-regexp v8 e não precisam ser escapados.
Isso significa que query strings podem ser incorporadas ao path sem escapar `?`:

```ts
const search = new RestEndpoint({
  path: '/search?{q=:q}{&page=:page}',
});
search({ q: 'test', page: 1 });
// URL: /search?q=test&page=1
```

:::info

Os tipos são inferidos automaticamente a partir de `path`.

Parâmetros adicionais podem ser especificados com [searchParams](#searchParams)
e [body](#body).

:::

### searchParams {#searchParams}

`searchParams` pode ser usado para especificar os tipos de parâmetros extras, usados nos searchParams/queryParams do GET em uma [url()](#url).

O **valor em si não é usado** de nenhuma forma - isso apenas determina a [tipagem](#typing).

<EndpointPlayground input="https://site.com/cool?isReact=true" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}}>

```typescript title="getFoo"
import { RestEndpoint } from '@data-client/rest';

const getReactSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
  searchParams: {} as { isReact: boolean },
});

getReactSite({ slug: 'cool', isReact: true });
```

</EndpointPlayground>

### body {#body}

`body` pode ser usado para definir um segundo argumento para endpoints de mutação. O **valor em si não é
usado** de nenhuma forma - isso apenas determina a [tipagem](#typing).

Isso só é usado por endpoints com um método que usa body: 'POST', 'PUT', 'PATCH'.

<EndpointPlayground input="https://site.com/cool" init={{method: 'POST', body: '{ "url": "/" }', headers: {'Content-Type': 'application/json'}}}>

```ts {6}
import { RestEndpoint } from '@data-client/rest';

const updateSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
  method: 'POST',
  body: {} as { url: string },
});

updateSite({ slug: 'cool' }, { url: '/' });
```

</EndpointPlayground>

### paginationField {#paginationfield}

Se especificado, adiciona o método [getPage](#getpage) ao `RestEndpoint`. [Guia de paginação](../guides/pagination.md). O schema
também deve conter uma [Collection](./Collection.md).

### urlPrefix: string = '' {#urlPrefix}

Adiciona este valor como prefixo ao [path](#path) compilado

#### Padrões por herança {#inheritance-defaults}

```typescript
export class MyEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // this allows us to override the prefix in production environments, with a dev fallback
  urlPrefix = process.env.API_SERVER ?? 'http://localhost:8000';
}
```

[Saiba mais sobre padrões de herança](#inheritance) para RestEndpoint

#### Sobrescritas na instância {#instance-overrides}

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/ticker',
  schema: Ticker,
});
```

#### Prefixo dinâmico {#dynamic-prefix}

:::tip

Para um prefixo dinâmico, tente sobrescrever o método url():

```ts
const getTodo = new RestEndpoint({
  path: '/todo/:id',
  url(...args) {
    return dynamicPrefix() + super.url(...args);
  },
});
```

:::

### method: string = 'GET' {#method}

O [Method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) faz parte do protocolo HTTP.
Os protocolos REST os usam para indicar o tipo de operação. Por isso, o RestEndpoint usa isso
para informar `sideEffect` e se o endpoint deve usar um payload `body`. Definir
`sideEffect` explicitamente sobrescreve esse comportamento, permitindo designs de API fora do padrão.

`GET` é 'somente leitura'; os demais métodos implicam efeitos colaterais (sideEffects).

`GET` e `DELETE` têm, por padrão, nenhum `body`.

:::tip[Como method afeta os parâmetros da função]

`method` só influencia os parâmetros no construtor do RestEndpoint e _não_ em [.extend()](#extend).
Isso permite combinações de método e body fora do padrão.

`body` terá `any` como padrão. Você sempre pode definir body explicitamente para ter controle total. `undefined` pode ser usado
para indicar que não há body.

<TypeScriptEditor>

```ts
(id: string, myPayload: Record<string, unknown>) => {
  const standardCreate = new RestEndpoint({
    path: '/:id',
    method: 'POST',
  });
  standardCreate({ id }, myPayload);
  const nonStandardEndpoint = new RestEndpoint({
    path: '/:id',
    method: 'POST',
    body: undefined,
  });
  // no second 'body' argument, because body was set to 'undefined'
  nonStandardEndpoint({ id });
};
```

</TypeScriptEditor>

:::

### getRequestInit(body): RequestInit {#getRequestInit}

Prepara o [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) usado no fetch.
Ele é enviado para [fetchResponse](#fetchResponse)

Um `body` que seja um objeto simples ou um array é codificado como JSON, com um header `Content-Type: application/json`, a menos que
`requestInit` ou [getHeaders](#getHeaders) defina um. Qualquer outro `body`, como `FormData`, `Blob`,
`URLSearchParams` ou uma string, é passado ao `fetch()` como está.

:::tip async

<TypeScriptEditor>

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getRequestInit(body) {
    return {
      ...(await super.getRequestInit(body)),
      method: await getMethod(),
    };
  }
}

async function getMethod() {
  return 'GET';
}
```

</TypeScriptEditor>

:::

### getHeaders(headers: HeadersInit): HeadersInit {#getHeaders}

Chamado por [getRequestInit](#getRequestInit) para determinar os [headers HTTP](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers)

Isso costuma ser útil para [autenticação](../guides/auth)

:::warning

Não use :react[hooks]:vue[composables] aqui. Se você precisar usar :react[hooks]:vue[composables], tente usar [hookifyResource](./hookifyResource.md)

:::

:::tip async

<TypeScriptEditor>

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'Access-Token': await getAuthToken(),
    };
  }
}

async function getAuthToken() {
  return 'example';
}
```

</TypeScriptEditor>

:::

## Tratar o fetch {#handle-fetch}

### fetchResponse(input, init): Promise {#fetchResponse}

Executa a chamada [fetch(input, init)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). Quando
[response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok) não é `true` (como em um 404),
lança um NetworkError.

### content {#content}

Controla como o body da [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) é interpretado.
Quando definido, o tipo de retorno é inferido automaticamente e `schema` é restringido a `undefined`
para tipos de conteúdo que não sejam JSON.

| Valor | Interpretado via | Tipo de retorno |
|---|---|---|
| `'json'` | [response.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) | `any` |
| `'blob'` | [response.blob()](https://developer.mozilla.org/en-US/docs/Web/API/Response/blob) | `Blob` |
| `'text'` | [response.text()](https://developer.mozilla.org/en-US/docs/Web/API/Response/text) | `string` |
| `'arrayBuffer'` | [response.arrayBuffer()](https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer) | `ArrayBuffer` |
| `'stream'` | `response.body` | `ReadableStream<Uint8Array>` |
| *não definido* | Detecção automática pelo header Content-Type | `any` |

Quando `content` não está definido, `parseResponse` detecta automaticamente o tipo da resposta pelo
header `Content-Type`: tipos JSON chamam `.json()`, tipos binários (imagens, `application/octet-stream`,
PDFs etc.) chamam `.blob()` e tipos textuais chamam `.text()`.

#### Download de arquivos {#file-download}

Para downloads de arquivos, defina `content: 'blob'`. O tipo de retorno é `Blob` e `schema` deve ser
`undefined` (dados binários não podem ser normalizados). Use `dataExpiryLength: 0` para evitar manter
blobs grandes em cache na memória.

```ts
const downloadFile = new RestEndpoint({
  path: '/files/:id/download',
  content: 'blob',
  dataExpiryLength: 0,
});
```

Para extrair o nome do arquivo do header `Content-Disposition`, sobrescreva `parseResponse`:

```ts
const downloadFile = new RestEndpoint({
  path: '/files/:id/download',
  content: 'blob',
  dataExpiryLength: 0,
  async parseResponse(response) {
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    const filename =
      disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? 'download';
    return { blob, filename };
  },
  process(value): { blob: Blob; filename: string } {
    return value;
  },
});
```

Veja o [guia de download de arquivos](../guides/network-transform.md#file-download) para o uso completo, com o disparo do download no navegador.

### parseResponse(response): Promise {#parseResponse}

Recebe a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) e interpreta o body.

Quando [`content`](#content) está definido, ele controla diretamente a interpretação. Caso contrário, a detecção automática é executada
com base no [header `Content-Type`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type):
tipos JSON chamam [.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json), tipos
binários chamam [.blob()](https://developer.mozilla.org/en-US/docs/Web/API/Response/blob) e tipos
textuais chamam [.text()](https://developer.mozilla.org/en-US/docs/Web/API/Response/text).

Se `status` for 204, resolve como `null`.

Sobrescreva isto para casos avançados, como extrair headers junto com o body.

### process(value, ...args): any {#process}

Realiza quaisquer transformações com o resultado interpretado. Por padrão é a função identidade (não faz nada).

`args` são os argumentos com os quais o endpoint foi chamado. Eles são tipados a partir de [path](#path),
[searchParams](#searchParams) e [body](#body) do endpoint, incluindo os definidos na mesma chamada de [extend()](#extend).

```ts
const getUser = new RestEndpoint({ path: '/users/:id' });

const getUserWithId = getUser.extend({
  process(value, params) {
    // params is { id: string | number }
    return { ...value, id: `${params.id}` };
  },
});
```

:::tip

O tipo de retorno de process pode ser usado para definir o tipo de retorno do fetch do endpoint:

<TypeScriptEditor row={false}>

```ts title="getTodo.ts" {4}
export const getTodo = new RestEndpoint({
  path: '/todos/:id',
  // The identity function is the default value; so we aren't changing any runtime behavior
  process(value): TodoInterface {
    return value;
  },
});

interface TodoInterface {
  id: string;
  title: string;
  completed: boolean;
}
```

```ts title="useTodo.ts"
import { getTodo } from './getTodo';

async (id: string) => {
  // hover title to see it is a string
  // see TS autocomplete by deleting `.title` and retyping the `.`
  const title = (await getTodo({ id })).title;
};
```

</TypeScriptEditor>

:::

## Ciclo de vida do Endpoint {#endpoint-lifecycle}

### schema?: Schema {#schema}

[Ciclo de vida declarativo dos dados](./schema.md)

- Consistência global dos dados e desempenho com estado [DRY](https://www.plutora.com/blog/understanding-the-dry-dont-repeat-yourself-principle): [onde](./schema.md) esperar [Entities](./Entity.md)
- Funções para [desserializar campos](/rest/guides/network-transform#deserializing-fields)
- [Tratamento de condições de corrida](./Entity.md#shouldreorder)
- [Validação](./Entity.md#validate)

```tsx
import { Entity, RestEndpoint } from '@data-client/rest';

class User extends Entity {
  id = '';
  username = '';
}

const getUser = new RestEndpoint({
  path: '/users/:id',
  schema: User,
});
```

### key(urlParams): string {#key}

Serializa os parâmetros. É usado para construir uma chave de busca nas stores globais.

Padrão:

```typescript
`${this.method} ${this.url(urlParams)}`;
```

### testKey(key): boolean {#testKey}

Retorna `true` se a [key](#key) (de fetch) fornecida corresponde a este endpoint.

Isso é usado para interceptors de mock com o [&lt;MockResolver /&gt;](/docs/api/MockResolver),
[Controller.expireAll()](/docs/api/Controller#expireAll), and [Controller.invalidateAll()](/docs/api/Controller#invalidateAll).

import EndpointLifecycle from './_EndpointLifecycle.mdx';

<EndpointLifecycle />

## extend(options): RestEndpoint {#extend}

Pode ser usado para personalizar ainda mais a definição do endpoint

```typescript
const getUser = new RestEndpoint({ path: '/users/:id' });

const UserDetailNormalized = getUser.extend({
  schema: User,
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  },
});
```

## Extensores especializados {#specialized-extenders}

Estes acessores de conveniência criam novos endpoints para operações comuns de [Collection](./Collection.md).
Só funcionam quando o schema do `RestEndpoint` contém uma [Collection](./Collection.md).

### push {#push}

Cria um endpoint POST que coloca as Entities recém-criadas no _fim_ de uma [Collection](./Collection.md).

Retorna um novo RestEndpoint com [method](#method): 'POST' e schema: [Collection.push](./Collection.md#push)

```tsx
import { RestEndpoint, Collection } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Todo } from './resources';

const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new Collection([Todo]),
});
const ctrl = useController();

// POST /todos - adds new Todo to the end of the list
const newTodo = await ctrl.fetch(
  getTodos.push,
  { userId: '1' },
  { title: 'Buy groceries' },
);
```

```tsx
import { resource } from '@data-client/rest';
import { useController } from '@data-client/react';
import { User } from './resources';

const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});
const ctrl = useController();

// POST /groups/five/users - adds new User to the end of the list
const newUser = await ctrl.fetch(
  UserResource.getList.push,
  { group: 'five' },
  { username: 'newuser', email: 'new@example.com' },
);

// Send an array to create several at once; they're added to the end in order
await ctrl.fetch(
  UserResource.getList.push,
  { group: 'five' },
  [{ username: 'ana' }, { username: 'bo' }],
);
```

### unshift {#unshift}

Cria um endpoint POST que coloca as Entities recém-criadas no _início_ de uma [Collection](./Collection.md).

Retorna um novo RestEndpoint com [method](#method): 'POST' e schema: [Collection.unshift](./Collection.md#unshift)

```tsx
import { RestEndpoint, Collection } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Todo } from './resources';

const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new Collection([Todo]),
});
const ctrl = useController();

// POST /todos - adds new Todo to the beginning of the list
const newTodo = await ctrl.fetch(
  getTodos.unshift,
  { userId: '1' },
  { title: 'Urgent task' },
);
```

```tsx
import { resource } from '@data-client/rest';
import { useController } from '@data-client/react';
import { User } from './resources';

const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});
const ctrl = useController();

// POST /groups/five/users - adds new User to the start of the list
const newUser = await ctrl.fetch(
  UserResource.getList.unshift,
  { group: 'five' },
  { username: 'priorityuser', email: 'priority@example.com' },
);
```

### assign {#assign}

Cria um endpoint POST que mescla Entities em uma [Collection](./Collection.md) de [Values](./Values.md).

Retorna um novo RestEndpoint com [method](#method): 'POST' e schema: [Collection.assign](./Collection.md#assign)

```tsx
import { RestEndpoint, Collection, Values } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Stats } from './resources';

const getStats = new RestEndpoint({
  path: '/products/stats',
  schema: new Collection(new Values(Stats)),
});
const ctrl = useController();

// POST /products/stats - add/update entries in the Values collection
await ctrl.fetch(getStats.assign, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
  'ETH-USD': { product_id: 'ETH-USD', volume: 500 },
});
```

```tsx
import { resource, Collection, Values } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Stats } from './resources';

const StatsResource = resource({
  urlPrefix: 'https://api.exchange.example.com',
  path: '/products/:product_id/stats',
  schema: Stats,
}).extend({
  getList: {
    path: '/products/stats',
    schema: new Collection(new Values(Stats)),
  },
});
const ctrl = useController();

// POST /products/stats - add/update entries
await ctrl.fetch(StatsResource.getList.assign, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
});
```

### remove {#remove}

Cria um endpoint PATCH que remove Entities de uma [Collection](./Collection.md) e as atualiza com a resposta.

Retorna um novo RestEndpoint com [method](#method): 'PATCH' e schema: [Collection.remove](./Collection.md#remove)

```tsx
import { RestEndpoint, Collection } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Todo } from './resources';

const getTodos = new RestEndpoint({
  path: '/todos',
  schema: new Collection([Todo]),
});
const ctrl = useController();

// PATCH /todos - removes Todo from collection AND updates the entity
await ctrl.fetch(getTodos.remove, { id: '123', completed: true });
```

```tsx
import { resource } from '@data-client/rest';
import { useController } from '@data-client/react';
import { User } from './resources';

const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});
const ctrl = useController();

// PATCH /groups/five/users - removes user from 'five' group list
// AND updates the user entity with response data (e.g., new group)
await ctrl.fetch(
  UserResource.getList.remove,
  { group: 'five' },
  { id: '2', group: 'newgroup' },
);
```

Para usar o schema de remoção com um endpoint diferente (por exemplo, DELETE):

```ts
const deleteAndRemove = MyResource.delete.extend({
  schema: MyResource.getList.schema.remove,
});
```

### move {#move}

Cria um endpoint PATCH que move Entities entre [Collections](./Collection.md). Ele remove das
collections que correspondem ao estado existente da entidade e adiciona às collections que correspondem aos novos valores
(do body/último argumento).

Retorna um novo RestEndpoint com [method](#method): 'PATCH' e schema: [Collection.move](./Collection.md#move)

import { kanbanFixtures, getInitialInterceptorData } from '@site/src/fixtures/kanban';

<FrameworkPlayground defaultOpen="n" row fixtures={kanbanFixtures} getInitialInterceptorData={getInitialInterceptorData}>

```ts title="TaskResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Task extends Entity {
  id = '';
  title = '';
  status = 'backlog';
  pk() { return this.id; }
  static key = 'Task';
}
export const TaskResource = resource({
  path: '/tasks/:id',
  searchParams: {} as { status: string },
  schema: Task,
  optimistic: true,
});
```

:::react

```tsx title="TaskCard" {5-9}
import { useController } from '@data-client/react';
import { TaskResource, type Task } from './TaskResource';

export default function TaskCard({ task }: { task: Task }) {
  const handleMove = () => ctrl.fetch(
    TaskResource.getList.move,
    { id: task.id },
    { id: task.id, status: task.status === 'backlog' ? 'in-progress' : 'backlog' },
  );
  const ctrl = useController();
  return (
    <div className="listItem">
      <span style={{ flex: 1 }}>{task.title}</span>
      <button onClick={handleMove}>
        {task.status === 'backlog' ? '\u25bc' : '\u25b2'}
      </button>
    </div>
  );
}
```

```tsx title="TaskBoard" collapsed
import { useSuspense } from '@data-client/react';
import { TaskResource } from './TaskResource';
import TaskCard from './TaskCard';

function TaskBoard() {
  const backlog = useSuspense(TaskResource.getList, { status: 'backlog' });
  const inProgress = useSuspense(TaskResource.getList, { status: 'in-progress' });
  return (
    <div>
      <div className="boardColumn">
        <h4>Backlog</h4>
        {backlog.map(task => <TaskCard key={task.pk()} task={task} />)}
      </div>
      <div className="boardColumn">
        <h4>Active</h4>
        {inProgress.map(task => <TaskCard key={task.pk()} task={task} />)}
      </div>
    </div>
  );
}
render(<TaskBoard />);
```

:::

:::vue

```html title="TaskCard.vue" {7-16}
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TaskResource, type Task } from './TaskResource';

  const props = defineProps<{ task: Task }>();
  const ctrl = useController();
  const handleMove = () =>
    ctrl.fetch(
      TaskResource.getList.move,
      { id: props.task.id },
      {
        id: props.task.id,
        status:
          props.task.status === 'backlog' ? 'in-progress' : 'backlog',
      },
    );
</script>

<template>
  <div class="listItem">
    <span style="flex: 1">{{ task.title }}</span>
    <button @click="handleMove">
      {{ task.status === 'backlog' ? '\u25bc' : '\u25b2' }}
    </button>
  </div>
</template>
```

```html title="TaskBoard.vue" collapsed
<script setup lang="ts">
  import { useFetch, useSuspense } from '@data-client/vue';
  import { TaskResource } from './TaskResource';
  import TaskCard from './TaskCard.vue';

  // start both fetches in parallel before awaiting
  useFetch(TaskResource.getList, { status: 'backlog' });
  useFetch(TaskResource.getList, { status: 'in-progress' });
  const backlog = await useSuspense(TaskResource.getList, {
    status: 'backlog',
  });
  const inProgress = await useSuspense(TaskResource.getList, {
    status: 'in-progress',
  });
</script>

<template>
  <div>
    <div class="boardColumn">
      <h4>Backlog</h4>
      <TaskCard v-for="task in backlog" :key="task.pk()" :task="task" />
    </div>
    <div class="boardColumn">
      <h4>Active</h4>
      <TaskCard v-for="task in inProgress" :key="task.pk()" :task="task" />
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

O filtro de remoção se baseia nos valores **existentes** da entidade na store.
O filtro de adição se baseia nos valores mesclados da entidade (existentes + body).
Isso usa a mesma lógica de [createCollectionFilter](./Collection.md#createcollectionfilter) que push/remove.

```tsx
import { resource } from '@data-client/rest';
import { useController } from '@data-client/react';
import { User } from './resources';

const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});
const ctrl = useController();

// PATCH /groups/five/users/5 - moves user 5 from 'five' group to 'ten' group
await ctrl.fetch(
  UserResource.getList.move,
  { group: 'five', id: '2' },
  { id: '2', group: 'ten' },
);
```

### getPage {#getpage}

Um endpoint para obter a próxima página usando [paginationField](#paginationfield) como chave do searchParameter. O schema
também deve conter uma [Collection](./Collection.md)

:::react

```tsx nocheck
const getTodos = new RestEndpoint({
  path: '/todos',
  schema: Todo,
  paginationField: 'page',
});

const todos = useSuspense(getTodos);
const ctrl = useController();
return (
  <PaginatedList
    items={todos}
    fetchNextPage={() =>
      // fetches url `/todos?page=${nextPage}`
      ctrl.fetch(getTodos.getPage, { page: nextPage })
    }
  />
);
```

:::

:::vue

```html
<script lang="ts">
  import { RestEndpoint } from '@data-client/rest';
  import { Todo } from './resources';

  const getTodos = new RestEndpoint({
    path: '/todos',
    schema: Todo,
    paginationField: 'page',
  });
</script>

<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import PaginatedList from './PaginatedList.vue';

  const todos = await useSuspense(getTodos);
  const ctrl = useController();
  // fetches url `/todos?page=${nextPage}`
  const fetchNextPage = (nextPage: number) =>
    ctrl.fetch(getTodos.getPage, { page: nextPage });
</script>

<template>
  <PaginatedList :items="todos" :fetchNextPage="fetchNextPage" />
</template>
```

:::

Veja o [guia de paginação](../guides/pagination.md) para mais informações.

### paginated(paginationfield) {#paginated}

Cria um novo endpoint com uma string extra `paginationfield` que será usada para encontrar a
página específica a ser anexada a este endpoint. Veja [Paginação com rolagem infinita](../guides/pagination.md#infinite-scrolling) para mais informações.

```ts
const getNextPage = getList.paginated('cursor');
```

O schema também deve conter uma [Collection](./Collection.md)

### paginated(removeCursor) {#paginated-function}

```typescript
function paginated<E, A extends any[]>(
  this: E,
  removeCursor: (...args: A) => readonly [...Parameters<E>],
): PaginationEndpoint<E, A>;
```

A forma de função permite qualquer processamento de argumentos. É o equivalente a enviar a string `cursor`, como acima.

```ts
const getNextPage = getList.paginated(
  ({ cursor, ...rest }: { cursor: string | number }) =>
    (Object.keys(rest).length ? [rest] : []) as any,
);
```

`removeCusor` é uma função que recebe os argumentos enviados no fetch de `getNextPage` e retorna
os argumentos para atualizar `getList`.

O schema também deve conter uma [Collection](./Collection.md)

## Herança {#inheritance}

Certifique-se de usar `RestGenerics` para que os tipos continuem funcionando.

```ts
import { RestEndpoint, type RestGenerics } from '@data-client/rest';

class GithubEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.github.com';

  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  }
}
```
