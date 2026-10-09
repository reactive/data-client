---
title: RestEndpoint - Definiciones de API HTTP basadas en rutas con tipado fuerte
sidebar_label: RestEndpoint
description: Definiciones de API HTTP extensibles, basadas en rutas y con tipado fuerte.
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

Los `RestEndpoints` son para protocolos basados en [HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) como REST.

:::info extends

`RestEndpoint` extiende [Endpoint](./Endpoint.md)

:::

<details>
<summary><b>Interfaz</b></summary>

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

Todas las opciones se admiten como argumentos del constructor, de [extend](#extend) y como sobrescrituras al usar [herencia](#inheritance)

### La obtención más simple {#simplest-retrieval}

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

### Compartir configuración {#configuration-sharing}

Usa [RestEndpoint.extend()](#extend) en lugar de `{...getTodo}` ([Object spread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals))

```ts
const updateTodo = getTodo.extend({ method: 'PUT' });
```

### Gestionar el estado {#managing-state}

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

Usar un [Schema](./schema.md) habilita la [consistencia automática de los datos](/docs/concepts/normalization) sin necesidad de perjudicar el rendimiento con [volver a obtener los datos](/docs/api/Controller#expireAll).

### Tipado {#typing}

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

#### Resolución/Retorno {#resolutionreturn}

[schema](#schema) determina el valor de retorno cuando se usa con :react[hooks]:vue[composables] de enlace de datos como [useSuspense](/docs/api/useSuspense), [useDLE](/docs/api/useDLE), [useCache](/docs/api/useCache)
o cuando se usa con [Controller.fetch](/docs/api/Controller#fetch)

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

[process](#process) determina el valor de resolución cuando el endpoint se llama directamente. En los
`RestEndpoints` sin schema, también determina el tipo de retorno de :react[[hooks](/docs/api/useSuspense)]:vue[[composables](/docs/api/useSuspense)] y de [Controller.fetch](/docs/api/Controller#fetch).

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

#### Parámetros de la función {#function-parameters}

[path](#path), que se usa para construir la url, determina el tipo del primer argumento. Si no tiene patrones,
se omite el 'primer' argumento.

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

[method](#method) determina si hay un segundo argumento que se envía como [body](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#body).

<TypeScriptEditor>

```ts path=method.ts
export const update = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
});
update({ id: 5 }, { title: 'updated', completed: true });
```

</TypeScriptEditor>

Sin embargo, este se tipa como 'any', por lo que no detectará errores tipográficos.

[body](#body) se puede usar para tipar el argumento que sigue a los parámetros de la url. Solo se usa para el tipado, así que el
valor enviado no importa. El valor `undefined` se puede usar para 'deshabilitar' el segundo argumento.

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

[searchParams](#searchParams) se puede usar de forma similar a `body` para especificar los tipos de parámetros adicionales, usados
para los searchParams/queryParams del GET en un [url()](#url).

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

## Ciclo de vida del fetch {#fetch-lifecycle}

RestEndpoint amplía Endpoint al ofrecer personalizaciones para un método fetch proporcionado mediante
[herencia](#inheritance) o [.extend()](#extend).

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

## Preparar el fetch {#prepare-fetch}

Los miembros funcionan también como opciones (segundo argumento del constructor). Aunque ninguno es obligatorio, los primeros
tienen valores por defecto.

### url(params): string {#url}

`urlPrefix` + `path template` + '?' + searchToString(`searchParams`)

`url()` usa los `params` para rellenar la [plantilla de path](#path). Los miembros de `params` que no se usen se emplean después
como [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) (también llamados params 'GET', lo que va después de `?`).

<details collapsed>
<summary><b>Implementación</b></summary>

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

Construye el componente [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) de la [url](#url).

Por defecto usa el global estándar [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

Los [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) (también llamados queryParams) se ordenan para mantener el determinismo.

<details collapsed>
<summary><b>Implementación</b></summary>

```typescript
searchToString(searchParams) {
  const params = new URLSearchParams(searchParams);
  params.sort();
  return params.toString();
}
```

</details>

#### Usar la librería `qs` {#using-qs-library}

Para codificar objetos complejos en los searchParams, puedes usar la librería [qs](https://github.com/ljharb/qs).

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

Usa [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp) para construir
urls con los parámetros pasados. Esto también define los tipos, de modo que se apliquen correctamente.

#### Parámetros {#parameters}

Las palabras con prefijo `:` son nombres de parámetros. Se aceptan tanto strings como números como valores,
ya que se serializan en el string de la url.

<TypeScriptEditor>

```ts
const getThing = new RestEndpoint({ path: '/:group/things/:id' });
getThing({ group: 'first', id: 77 });
```

</TypeScriptEditor>

#### Parámetros opcionales {#optional-parameters}

Envuelve el segmento opcional (incluido su prefijo) en `{}` para hacerlo [opcional](https://github.com/pillarjs/path-to-regexp?tab=readme-ov-file#optional).
El tipo de los parámetros opcionales pasa a ser `string | number | undefined`.

<TypeScriptEditor>

```ts
const optional = new RestEndpoint({
  path: '/:group/things{/:number}',
});
optional({ group: 'first' });
optional({ group: 'first', number: 'fifty' });
```

</TypeScriptEditor>

Se pueden encadenar varios segmentos opcionales con distintos prefijos:

```ts
const ep = new RestEndpoint({
  path: '{/:attr1}{-:attr2}{-:attr3}',
});

ep({ attr1: 'hi' });
ep({ attr2: 'hi' });
ep({ attr1: 'hi', attr3: 'ho' });
```

#### Comodines (parámetros repetidos) {#wildcards-repeating-parameters}

`*name` coincide con uno o más segmentos de la ruta. Envuélvelo en `{}` para que coincida con cero o más (opcional).
Los parámetros comodín se tipan como `string[]` (arrays), ya que representan varios segmentos de la ruta.

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

#### Nombres de parámetros entre comillas {#quoted-parameter-names}

Los nombres de parámetros deben ser identificadores válidos de JavaScript. Los nombres que contienen caracteres especiales
como `-` o `.` deben ir entre comillas dobles:

```ts
const ep = new RestEndpoint({ path: '/:"with-dash"/:"my.param"' });
ep({ 'with-dash': 'hello', 'my.param': 'world' });
```

#### Escapar caracteres especiales {#escaping-special-characters}

Los caracteres `{}()*:` y `\\` son especiales en path-to-regexp y deben escaparse con `\\` cuando se usan como literales.

<TypeScriptEditor>

```ts
const getSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
});
getSite({ slug: 'first' });
```

</TypeScriptEditor>

`?` y `+` **no** son especiales en path-to-regexp v8 y no necesitan escaparse.
Esto significa que los query strings se pueden incrustar en la ruta sin escapar `?`:

```ts
const search = new RestEndpoint({
  path: '/search?{q=:q}{&page=:page}',
});
search({ q: 'test', page: 1 });
// URL: /search?q=test&page=1
```

:::info

Los tipos se infieren automáticamente a partir de `path`.

Se pueden especificar parámetros adicionales con [searchParams](#searchParams)
y [body](#body).

:::

### searchParams {#searchParams}

`searchParams` se puede usar para especificar los tipos de parámetros adicionales, usados para los searchParams/queryParams del GET en un [url()](#url).

El **valor real no se usa** de ninguna manera; esto solo determina el [tipado](#typing).

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

`body` se puede usar para definir un segundo argumento en endpoints de mutación. El **valor real no se
usa** de ninguna manera; esto solo determina el [tipado](#typing).

Solo lo usan los endpoints con un método que utiliza body: 'POST', 'PUT', 'PATCH'.

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

Si se especifica, agregará el método [getPage](#getpage) al `RestEndpoint`. [Guía de paginación](../guides/pagination.md). El schema
también debe contener una [Collection](./Collection.md).

### urlPrefix: string = '' {#urlPrefix}

Antepone esto al [path](#path) compilado

#### Valores por defecto mediante herencia {#inheritance-defaults}

```typescript
export class MyEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // this allows us to override the prefix in production environments, with a dev fallback
  urlPrefix = process.env.API_SERVER ?? 'http://localhost:8000';
}
```

[Más información sobre los patrones de herencia](#inheritance) para RestEndpoint

#### Sobrescrituras por instancia {#instance-overrides}

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/ticker',
  schema: Ticker,
});
```

#### Prefijo dinámico {#dynamic-prefix}

:::tip

Para un prefijo dinámico, prueba mejor sobrescribir el método url():

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

El [método](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) es parte del protocolo HTTP.
Los protocolos REST lo usan para indicar el tipo de operación. Por eso RestEndpoint lo usa
para determinar `sideEffect` y si el endpoint debe usar un payload `body`. Establecer
`sideEffect` explícitamente sobrescribirá este comportamiento, lo que permite diseños de API no estándar.

`GET` es 'de solo lectura'; los demás métodos implican sideEffects.

`GET` y `DELETE` no tienen `body` por defecto.

:::tip[Cómo afecta method a los parámetros de la función]

`method` solo influye en los parámetros del constructor de RestEndpoint y _no_ en [.extend()](#extend).
Esto permite combinaciones no estándar de método y body.

`body` será `any` por defecto. Siempre puedes establecer body explícitamente para tener el control total. Se puede usar `undefined`
para indicar que no hay body.

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

Prepara el [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) que se usa en el fetch.
Se envía a [fetchResponse](#fetchResponse)

Un `body` que sea un objeto plano o un array se codifica como JSON, con un encabezado `Content-Type: application/json`, a menos que
`requestInit` o [getHeaders](#getHeaders) establezcan uno. Cualquier otro `body`, como `FormData`, `Blob`,
`URLSearchParams` o un string, se pasa a `fetch()` tal cual.

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

Lo llama [getRequestInit](#getRequestInit) para determinar los [encabezados HTTP](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers)

Esto suele ser útil para la [autenticación](../guides/auth)

:::warning

No uses :react[hooks]:vue[composables] aquí. Si necesitas usar :react[hooks]:vue[composables], prueba con [hookifyResource](./hookifyResource.md)

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

## Manejar el fetch {#handle-fetch}

### fetchResponse(input, init): Promise {#fetchResponse}

Realiza la llamada [fetch(input, init)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). Cuando
[response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok) no es `true` (como en un 404),
lanza un NetworkError.

### content {#content}

Controla cómo se interpreta el cuerpo de la [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response).
Cuando se establece, el tipo de retorno se infiere automáticamente y `schema` queda restringido a `undefined`
para los tipos de contenido que no son JSON.

| Valor | Se interpreta con | Tipo de retorno |
|---|---|---|
| `'json'` | [response.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) | `any` |
| `'blob'` | [response.blob()](https://developer.mozilla.org/en-US/docs/Web/API/Response/blob) | `Blob` |
| `'text'` | [response.text()](https://developer.mozilla.org/en-US/docs/Web/API/Response/text) | `string` |
| `'arrayBuffer'` | [response.arrayBuffer()](https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer) | `ArrayBuffer` |
| `'stream'` | `response.body` | `ReadableStream<Uint8Array>` |
| *sin establecer* | Detección automática según el encabezado Content-Type | `any` |

Cuando `content` no está establecido, `parseResponse` detecta automáticamente el tipo de respuesta a partir del
encabezado `Content-Type`: los tipos JSON llaman a `.json()`, los tipos binarios (imágenes, `application/octet-stream`,
PDFs, etc.) llaman a `.blob()` y los tipos de texto llaman a `.text()`.

#### Descargas de archivos {#file-download}

Para descargar archivos, establece `content: 'blob'`. El tipo de retorno es `Blob` y `schema` debe ser
`undefined` (los datos binarios no se pueden normalizar). Usa `dataExpiryLength: 0` para evitar guardar en caché
blobs grandes en memoria.

```ts
const downloadFile = new RestEndpoint({
  path: '/files/:id/download',
  content: 'blob',
  dataExpiryLength: 0,
});
```

Para extraer el nombre del archivo del encabezado `Content-Disposition`, sobrescribe `parseResponse`:

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

Consulta la [guía de descarga de archivos](../guides/network-transform.md#file-download) para ver el uso completo con el disparador de descarga del navegador.

### parseResponse(response): Promise {#parseResponse}

Toma la [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) e interpreta el cuerpo.

Cuando [`content`](#content) está establecido, controla directamente la interpretación. En caso contrario, se ejecuta la detección automática
según el [encabezado `Content-Type`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type):
los tipos JSON llaman a [.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json), los tipos
binarios llaman a [.blob()](https://developer.mozilla.org/en-US/docs/Web/API/Response/blob) y los tipos
de texto llaman a [.text()](https://developer.mozilla.org/en-US/docs/Web/API/Response/text).

Si `status` es 204, se resuelve como `null`.

Sobrescríbelo para casos avanzados, como extraer los encabezados junto con el cuerpo.

### process(value, ...args): any {#process}

Aplica cualquier transformación al resultado ya interpretado. Por defecto es la función identidad (no hace nada).

`args` son los argumentos con los que se llamó al endpoint. Se tipan a partir de [path](#path),
[searchParams](#searchParams) y [body](#body) del endpoint, incluidos los definidos en la misma llamada a [extend()](#extend).

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

El tipo de retorno de process se puede usar para establecer el tipo de retorno del fetch del endpoint:

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

## Ciclo de vida del Endpoint {#endpoint-lifecycle}

### schema?: Schema {#schema}

[Ciclo de vida declarativo de los datos](./schema.md)

- Consistencia global de los datos y rendimiento con un estado [DRY](https://www.plutora.com/blog/understanding-the-dry-dont-repeat-yourself-principle): [dónde](./schema.md) esperar [Entities](./Entity.md)
- Funciones para [deserializar campos](/rest/guides/network-transform#deserializing-fields)
- [Manejo de condiciones de carrera](./Entity.md#shouldreorder)
- [Validación](./Entity.md#validate)

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

Serializa los parámetros. Se usa para construir una clave de búsqueda en stores globales.

Por defecto:

```typescript
`${this.method} ${this.url(urlParams)}`;
```

### testKey(key): boolean {#testKey}

Devuelve `true` si la [key](#key) (de fetch) proporcionada coincide con este endpoint.

Se usa para los interceptors de mock con [&lt;MockResolver /&gt;](/docs/api/MockResolver),
[Controller.expireAll()](/docs/api/Controller#expireAll), and [Controller.invalidateAll()](/docs/api/Controller#invalidateAll).

import EndpointLifecycle from './_EndpointLifecycle.mdx';

<EndpointLifecycle />

## extend(options): RestEndpoint {#extend}

Se puede usar para personalizar aún más la definición del endpoint

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

Estos accesores de conveniencia crean nuevos endpoints para operaciones comunes de [Collection](./Collection.md).
Solo funcionan cuando el schema del `RestEndpoint` contiene una [Collection](./Collection.md).

### push {#push}

Crea un endpoint POST que coloca las Entities recién creadas al _final_ de una [Collection](./Collection.md).

Devuelve un nuevo RestEndpoint con [method](#method): 'POST' y schema: [Collection.push](./Collection.md#push)

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

Crea un endpoint POST que coloca las Entities recién creadas al _inicio_ de una [Collection](./Collection.md).

Devuelve un nuevo RestEndpoint con [method](#method): 'POST' y schema: [Collection.unshift](./Collection.md#unshift)

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

Crea un endpoint POST que fusiona Entities en una [Collection](./Collection.md) de [Values](./Values.md).

Devuelve un nuevo RestEndpoint con [method](#method): 'POST' y schema: [Collection.assign](./Collection.md#assign)

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

Crea un endpoint PATCH que elimina Entities de una [Collection](./Collection.md) y las actualiza con la respuesta.

Devuelve un nuevo RestEndpoint con [method](#method): 'PATCH' y schema: [Collection.remove](./Collection.md#remove)

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

Para usar el schema remove con un endpoint distinto (por ejemplo, DELETE):

```ts
const deleteAndRemove = MyResource.delete.extend({
  schema: MyResource.getList.schema.remove,
});
```

### move {#move}

Crea un endpoint PATCH que mueve Entities entre [Collections](./Collection.md). Elimina de las
colecciones que coinciden con el estado actual de la entidad y agrega a las colecciones que coinciden con los nuevos valores
(del body o último argumento).

Devuelve un nuevo RestEndpoint con [method](#method): 'PATCH' y schema: [Collection.move](./Collection.md#move)

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

El filtro de eliminación se basa en los valores **existentes** de la entidad en el store.
El filtro de adición se basa en los valores combinados de la entidad (existentes + body).
Esto usa la misma lógica de [createCollectionFilter](./Collection.md#createcollectionfilter) que push/remove.

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

Un endpoint para obtener la página siguiente usando [paginationField](#paginationfield) como clave del searchParameter. El schema
también debe contener una [Collection](./Collection.md)

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

Consulta la [guía de paginación](../guides/pagination.md) para más información.

### paginated(paginationfield) {#paginated}

Crea un nuevo endpoint con un string `paginationfield` adicional que se usará para encontrar la página
específica que se agregará a este endpoint. Consulta [Paginación con scroll infinito](../guides/pagination.md#infinite-scrolling) para más información.

```ts
const getNextPage = getList.paginated('cursor');
```

El schema también debe contener una [Collection](./Collection.md)

### paginated(removeCursor) {#paginated-function}

```typescript
function paginated<E, A extends any[]>(
  this: E,
  removeCursor: (...args: A) => readonly [...Parameters<E>],
): PaginationEndpoint<E, A>;
```

La forma de función permite cualquier procesamiento de argumentos. Es el equivalente a enviar el string `cursor` como arriba.

```ts
const getNextPage = getList.paginated(
  ({ cursor, ...rest }: { cursor: string | number }) =>
    (Object.keys(rest).length ? [rest] : []) as any,
);
```

`removeCusor` es una función que toma los argumentos enviados en el fetch de `getNextPage` y devuelve
los argumentos para actualizar `getList`.

El schema también debe contener una [Collection](./Collection.md)

## Herencia {#inheritance}

Asegúrate de usar `RestGenerics` para que los tipos sigan funcionando.

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
