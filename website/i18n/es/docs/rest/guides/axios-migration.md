---
title: Migrar de Axios a Reactive Data Client
sidebar_label: Migración desde Axios
---

import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import PkgTabs from '@site/src/components/PkgTabs';
import DiffEditor from '@site/src/components/DiffEditor';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

# Migrar desde Axios

[`@data-client/rest`](/rest) reemplaza las llamadas de axios con definiciones de endpoints tipadas. Los componentes siguen llamándolas directamente,
así que la forma en que la aplicación carga y almacena los datos no cambia; solo cambia la forma de la llamada. Un [codemod](#codemod) convierte las llamadas; los
[pasos](#steps) de abajo cubren el resto.

<SiteOnly>

## Migra con tu agente de programación {#agent}

Pega esto en el chat de tu agente:

```prompt
Replace this app's axios calls with `@data-client/rest` endpoints, without changing how components load or store data. Install the REST setup skill first: `npx skills add reactive/data-client --skill data-client-rest-setup -y`, then read `.agents/skills/data-client-rest-setup/SKILL.md` and follow it.
```

La [skill](/docs/getting-started/agent-skills) de configuración de REST sigue esta guía: ejecuta el codemod y luego recorre
los [pasos](#steps) que el codemod no puede hacer. Revisa su diff como el de un compañero de equipo.

</SiteOnly>

<AgentOnly>

Para migrar una aplicación desde axios, instala la skill de configuración de REST desde la raíz del proyecto:

```bash
npx skills add reactive/data-client --skill data-client-rest-setup -y
```

Luego lee `.agents/skills/data-client-rest-setup/SKILL.md` y síguela; detecta axios y sigue los
[pasos](#steps) de abajo. Reemplaza únicamente las llamadas de axios y sus definiciones: deja los componentes, la carga de datos y la gestión
del estado como están, a menos que el usuario pida cambiarlos.

</AgentOnly>

## ¿Por qué migrar? {#why-migrate}

<DiffEditor caption="La URL se declara una sola vez: los parámetros de la ruta se tipan y codifican a partir de la plantilla `path`, y el resto pasa a la cadena de consulta. Las llamadas no cambian.">

```ts title="Before"
const getComments = ({
  userId,
  postId,
  sort,
}: {
  userId: string;
  postId: string;
  sort?: 'newest' | 'top';
}) =>
  // callout: Each parameter is typed, encoded and placed by hand, and nothing checks the template against the type.
  axios.get(
    `/users/${encodeURIComponent(userId)}/posts/${encodeURIComponent(postId)}/comments`,
    { params: { sort } },
  );

getComments({ userId: user.id, postId: post.id, sort: 'newest' });
```

```ts title="After"
const getComments = new RestEndpoint({
  // callout: `userId` and `postId` are typed and encoded from the template, so a missing or misspelled one is a compile error.
  path: '/users/:userId/posts/:postId/comments',
  searchParams: {} as { sort?: 'newest' | 'top' },
});

getComments({ userId: user.id, postId: post.id, sort: 'newest' });
```

</DiffEditor>

- **Tipado de extremo a extremo**: los parámetros de la ruta, los cuerpos y las respuestas se tipan a partir de cada definición.
- **Menos código**: [`resource()`](../api/resource.md) crea una API CRUD completa a partir de un `path` y un `schema`.
- **Un solo lugar para el comportamiento de las peticiones**: los métodos de un endpoint base reemplazan a los interceptores y a la configuración por llamada.
- **Listo para el store**: los mismos endpoints y schemas funcionan con [`useSuspense()`](/docs/api/useSuspense) y la
  caché normalizada, cuando decidas adoptarlos.

## Migra paso a paso {#steps}

<SiteOnly>

Estos son los pasos que sigue tu agente. Haz commit antes de cada uno, para poder revisar su diff.

</SiteOnly>

### 1. Instala {#install}

<PkgTabs pkgs="@data-client/rest" />

### 2. Ejecuta el codemod {#codemod}

Un codemod de [jscodeshift](https://github.com/facebook/jscodeshift) se encarga de la parte mecánica. Haz commit primero y luego ejecútalo en
tus carpetas de código fuente, nunca en la raíz del repositorio:

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

<DiffEditor caption="Cada llamada de axios se convierte en una llamada a un endpoint. Los parámetros de la ruta, `params` y el cuerpo pasan a ser sus argumentos, y se resuelve con el cuerpo, por lo que `.data` desaparece.">

```ts title="Before"
import axios from 'axios';

const api = axios.create({ baseURL: 'https://api.example.com' });

export async function getPost(id: string) {
  const res = await api.get(`/posts/${id}`);
  return res.data;
}

export async function createPost(body: { title: string }) {
  const { data } = await api.post('/posts', body);
  return data;
}
```

```ts title="After"
import { RestEndpoint, RestGenerics } from '@data-client/rest';

class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';
}

export async function getPost(id: string) {
  const res = await new ApiEndpoint({ path: '/posts/:id' })({ id });
  return res;
}

export async function createPost(body: { title: string }) {
  const data = await new ApiEndpoint({ path: '/posts', method: 'POST' })(
    body,
  );
  return data;
}
```

</DiffEditor>

Lo que no puede convertir, como los interceptores, `timeout`, `isAxiosError()` o una función que devuelve la respuesta de axios
a quienes la llaman, recibe un comentario `// TODO(data-client):` con un enlace a la sección de abajo que lo cubre. Busca
`TODO(data-client)` y resuelve cada uno a medida que avanzas por los siguientes pasos.

Si el proyecto envuelve axios en su propia clase o función y nunca llama a `axios.get()` o `.post()` directamente, o solo
llama a `axios(config)`, el codemod tiene poco que hacer. Sáltalo y empieza en el [paso 3](#base-endpoint).

### 3. Mueve los interceptores a un endpoint base {#base-endpoint}

Los interceptores de axios y la configuración de la instancia pasan a ser métodos de una subclase de `RestEndpoint` que extienden todos los endpoints. El
codemod crea esta clase a partir de `axios.create()`; mueve los interceptores a ella.

<DiffEditor caption="`RestEndpoint` analiza el JSON por sí mismo, así que un interceptor que solo extrae `response.data` ya no tiene nada que hacer.">

```ts title="Before"
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'my-key' },
});

api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

api.interceptors.response.use(response => response.data);

export default api;
```

```ts title="After"
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  // callout: Runs before every request, like a request interceptor. It can be `async`, to refresh a token first.
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'X-API-Key': 'my-key',
      Authorization: `Bearer ${getToken()}`,
    };
  }
}
```

</DiffEditor>

Los interceptores de respuesta que modifican el cuerpo, como convertir claves `snake_case`, van en
[`process()`](../api/RestEndpoint.md#process); consulta [de snake a camel](./network-transform.md#snakes-to-camels).

Cuando un interceptor de respuesta devolvía `response.data`, el `.data` de quien llamaba leía un campo del cuerpo, no la respuesta de axios,
así que consérvalo. El codemod marca estas llamadas cuando el interceptor está en el mismo archivo; si un
`axios.interceptors.response` global vive en otro archivo, revisa el `.data` que quitó de las llamadas de allí.

#### Mensajes de error del servidor {#server-error-messages}

Es habitual que las bases de código con axios muestren al usuario `error.response.data.error` o `.message`. Léelo una sola vez del cuerpo de la `Response`,
en el [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) de la clase base, de modo que los puntos de llamada lo obtengan de
`error.message`:

```ts title="ApiEndpoint.ts"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    try {
      return await super.fetchResponse(input, init);
    } catch (error) {
      if (error instanceof NetworkError) {
        const body = await error.response
          .clone()
          .json()
          .catch(() => null);
        // keep the NetworkError so `status` and `errorPolicy()` still work
        error.message = body?.error ?? body?.message ?? error.message;
      }
      throw error;
    }
  }
}
```

#### Abstracciones de endpoint existentes {#existing-endpoint-abstractions}

Una clase de endpoint personalizada que envuelve axios (por ejemplo, una con `path`, `method` y un ayudante `toDynamicUrl()`) puede extender
`RestEndpoint` en lugar de ser reemplazada. Conserva sus métodos retrocompatibles y gana
[`url()`](../api/RestEndpoint.md#url), [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit),
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) y [`parseResponse()`](../api/RestEndpoint.md#parseResponse):

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export class LegacyEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = API_ROOT;
  declare queryKey?: string;

  /** @deprecated use url() */
  toDynamicUrl = this.url;
}

const getUser = new LegacyEndpoint({
  path: '/users/:id',
  queryKey: 'user',
  schema: User,
});
```

Pasa miembros adicionales como `queryKey` como opciones en lugar de usar un constructor personalizado, para que
[`extend()`](../api/RestEndpoint.md#extend) (usado por `resource()`, `hookifyResource()` y `useCancelling()`) siga
funcionando.

#### Autenticación basada en contexto {#context-based-auth}

Cuando los tokens provienen de :react[el contexto de React]:vue[`inject()`] (Okta, Auth0) en lugar del almacenamiento, `getHeaders()` no puede
leerlos. Usa [`hookifyResource()`](../api/hookifyResource.md) para añadir las cabeceras mediante :react[un hook]:vue[un composable]. Consulta la
[guía de autenticación](./auth.md) para este y otros patrones.

### 4. Define entities y resources {#entities}

El codemod crea endpoints sin `schema`. Define una [Entity](../api/Entity.md) para cada tipo que devuelve la API: sus
campos, sus tipos y su clave primaria. Reemplaza las funciones CRUD de cada módulo que usan una misma ruta por un
[`resource()`](../api/resource.md):

<DiffEditor caption="Un solo `resource()` reemplaza a un módulo de funciones CRUD, y `schema` tipa cada respuesta.">

```ts title="Before"
import api from './api';

export interface Post {
  id: string;
  title: string;
  body: string;
}

export const getPosts = () => api.get<Post[]>('/posts');
export const getPost = (id: string) => api.get<Post>(`/posts/${id}`);
export const createPost = (data: Omit<Post, 'id'>) =>
  api.post<Post>('/posts', data);
export const updatePost = (id: string, data: Partial<Post>) =>
  api.patch<Post>(`/posts/${id}`, data);
export const deletePost = (id: string) => api.delete(`/posts/${id}`);
```

```ts title="After"
import { Entity, resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';

export class Post extends Entity {
  id = '';
  title = '';
  body = '';
  static key = 'Post';
}

// callout: Gives `getList`, `get`, `getList.push`, `update`, `partialUpdate` and `delete`, all typed.
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  Endpoint: ApiEndpoint,
});
```

</DiffEditor>

Prueba el resultado con una API simulada:

<EndpointPlayground input="https://api.example.com/posts/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'X-API-Key': 'my-key'}}} status={200} response={{ "id": "1", "title": "Hello World", "body": "First post" }}>

```ts title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  body = '';
  static key = 'Post';
}
```

```ts title="ApiEndpoint" collapsed
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'X-API-Key': 'my-key',
    };
  }
}
```

```ts title="PostResource"
import { resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';
import Post from './Post';

export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  Endpoint: ApiEndpoint,
});
```

```ts title="Usage" column
import { PostResource } from './PostResource';
PostResource.get({ id: '1' });
```

</EndpointPlayground>

Las rutas anidadas como `/projects/:projectId/tasks/:taskId` tienen su propio resource. Conserva `new ApiEndpoint()` independiente para
las operaciones que no son CRUD, como la búsqueda, las acciones personalizadas y la autenticación.

:::warning

No definas clases Entity y luego dejes `schema` sin definir en los endpoints: sin `schema`, las respuestas pierden sus
tipos y el store no puede normalizarlas cuando lo adoptes.

:::

#### Claves primarias no estándar {#non-standard-primary-keys}

Muchas APIs (MongoDB, por ejemplo) usan `_id` en lugar de `id`. Sobrescribe [`pk()`](../api/Entity.md#pk):

```ts
import { Entity } from '@data-client/rest';

export class User extends Entity {
  _id = '';
  name = '';
  email = '';
  static key = 'User';

  pk() {
    return this._id;
  }
}
```

#### Tipado del cuerpo {#body-typing}

Tipa el cuerpo de los endpoints `POST`, `PUT` y `PATCH` independientes con `body: {} as BodyType`. No uses
`undefined as unknown as BodyType`: `RestEndpoint` trata [`body`](../api/RestEndpoint.md#body)`: undefined` como si no hubiera
argumento de cuerpo. [`resource()`](../api/resource.md) tipa por sí mismo los cuerpos de sus endpoints.

```ts
const createUser = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: {} as { name: string; email: string },
  schema: User,
});
```

#### Convivir con Zod o Yup {#coexisting-with-zod-or-yup}

Si la base de código ya valida las respuestas con Zod o Yup, elige un enfoque por tipo:

- **Zod en `process()`** (recomendado): mantén la validación en tiempo de ejecución analizando en
  [`process()`](../api/RestEndpoint.md#process), y deja que la Entity se encargue de la normalización:

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **La Entity reemplaza a Zod**: mueve la forma de los campos a la clase Entity y elimina el schema de Zod. Los campos de la Entity aportan
  tipos, no comprobaciones en tiempo de ejecución, así que añade [`static validate()`](../api/Entity.md#validate) para cualquier campo que el servidor pueda
  enviar mal formado.
- **Solo Zod, sin Entity**: deja `schema` sin definir y analiza manualmente. Hazlo solo en los endpoints que no se benefician de la
  normalización (tokens de autenticación, respuestas puntuales).

### 5. Actualiza los puntos de llamada {#call-sites}

Los componentes y servicios conservan su propia carga y estado; solo cambia la llamada.

<DiffEditor caption="Los endpoints se resuelven con el cuerpo ya analizado, por lo que `.data` desaparece, y los parámetros pasan a ser un único objeto.">

```ts title="Before"
import { createPost, getPost, getPosts } from './api/posts';

const { data: posts } = await getPosts();
const { data: post } = await getPost('1');
const { data: created } = await createPost({ title: 'Hello', body: '' });
```

```ts title="After"
import { PostResource } from './api/posts';

const posts = await PostResource.getList();
const post = await PostResource.get({ id: '1' });
const created = await PostResource.getList.push({
  title: 'Hello',
  body: '',
});
```

</DiffEditor>

Leer estos endpoints a través del store, con [`useSuspense()`](/docs/api/useSuspense) y la caché normalizada, es un
paso aparte que puedes dar más adelante; consulta [las dependencias de datos](/docs/getting-started/data-dependency).

### 6. Migra el manejo de errores {#error-handling}

<DiffEditor caption="`NetworkError` tiene el `status` y la `Response` sin procesar, en lugar del `error.response` de axios.">

```ts title="Before"
import axios from 'axios';
import { getPost } from './api/posts';

try {
  const { data } = await getPost('1');
} catch (err) {
  if (axios.isAxiosError(err)) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}
```

```ts title="After"
import { NetworkError } from '@data-client/rest';
import { PostResource } from './api/posts';

try {
  const post = await PostResource.get({ id: '1' });
} catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.status);
    console.log(err.response);
  }
}
```

</DiffEditor>

Lee el mensaje de error de un servidor del cuerpo una sola vez, en el endpoint base; consulta
[mensajes de error del servidor](#server-error-messages).

### 7. Elimina axios {#remove-axios}

Busca lo que aún usa axios:

| Patrón                                     | Encuentra                 |
| ------------------------------------------ | ------------------------- |
| `TODO\(data-client\)`                      | lo que dejó el codemod     |
| `import.*from ['"]axios['"]`               | sentencias import          |
| `axios\.create`                            | creación de instancias     |
| `axios\.(get\|post\|put\|patch\|delete)`   | llamadas directas          |
| `\.interceptors\.(request\|response)\.use` | interceptores              |
| `isAxiosError`                             | manejo de errores          |
| `cancelToken\|CancelToken`                 | cancelación (obsoleta)     |
| `onUploadProgress\|onDownloadProgress`     | callbacks de progreso      |

Migra cada coincidencia con la [referencia](#quick-reference) de abajo. Cuando no quede ninguna, desinstala axios y ejecuta el
verificador de tipos y las pruebas:

```bash
npm uninstall axios
```

## Referencia de opciones de axios {#quick-reference}

| Axios                                    | @data-client/rest                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `baseURL`                                | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix)                                                                   |
| `headers` config                         | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                               |
| `interceptors.request`                   | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) / [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) |
| `interceptors.response`                  | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process)         |
| `transformRequest`                       | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                                                       |
| `transformResponse`                      | [`process()`](../api/RestEndpoint.md#process)                                                                     |
| `isAxiosError` / `error.response`        | [`NetworkError`](#error-handling) con `.status` y `.response`                                                  |
| `cancelToken` / `signal`                 | [`signal`](#cancellation)                                                                                         |
| `timeout`                                | [`AbortSignal.timeout()`](#timeout) en `getRequestInit()`                                                         |
| `responseType: 'blob'` / `'arraybuffer'` | [`content: 'blob'`](#binary-responses) / `'arrayBuffer'`                                                          |
| `params` / `paramsSerializer`            | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](#query-serialization)                |
| `auth: { username, password }`           | [`getHeaders()` con `btoa()`](#basic-auth)                                                                       |
| `validateStatus`                         | [`fetchResponse()` personalizado](#accepting-error-statuses)                                                             |
| `xsrfCookieName` / `xsrfHeaderName`      | [`getHeaders()`](#csrf-headers)                                                                                   |
| `onUploadProgress`                       | [`fetchResponse()` personalizado con XMLHttpRequest](#upload-progress)                                                  |

### Cancelación {#cancellation}

Tanto el `signal` de axios como el obsoleto `CancelToken` se corresponden con un `signal` de
[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController):

<DiffEditor>

```ts title="Before"
const source = axios.CancelToken.source();
axios.get('/users/1', { cancelToken: source.token });
source.cancel();
```

```ts title="After"
const getUser = new ApiEndpoint({ path: '/users/:id' });
const controller = new AbortController();
// callout: `extend()` gives this one request its own signal; a `signal` set when the endpoint is created would abort all of its requests.
getUser.extend({ signal: controller.signal })({ id: '1' });
controller.abort();
```

</DiffEditor>

Consulta la [guía de cancelación](./abort.md) para ver más patrones.

### Tiempo de espera {#timeout}

<DiffEditor>

```ts title="Before"
axios.get('/users', { timeout: 5000 });
```

```ts title="After"
export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // callout: Runs for each request, so each one gets its own 5 seconds. `AbortSignal.timeout()` passed to the constructor would start counting once, when the endpoint is created.
  async getRequestInit(
    body?: RequestInit['body'] | Record<string, unknown>,
  ) {
    const init = await super.getRequestInit(body);
    const timeout = AbortSignal.timeout(5000);
    // callout: Keeps `extend({ signal })` cancellation working: either signal aborts the request.
    const signal = init.signal
      ? AbortSignal.any([init.signal, timeout])
      : timeout;
    return { ...init, signal };
  }
}
```

</DiffEditor>

### Respuestas binarias {#binary-responses}

<DiffEditor>

```ts title="Before"
axios.get('/files/1', { responseType: 'blob' });
```

```ts title="After"
const downloadFile = new RestEndpoint({
  path: '/files/:id',
  content: 'blob',
});
```

</DiffEditor>

[`content`](../api/RestEndpoint.md#content) también acepta `'arrayBuffer'` y `'text'`. Consulta la
[descarga de archivos](./network-transform.md#file-download) para iniciar una descarga en el navegador.

### Serialización de la consulta {#query-serialization}

<DiffEditor>

```ts title="Before"
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params =>
    qs.stringify(params, { arrayFormat: 'repeat' }),
});
```

```ts title="After"
export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  searchToString(searchParams: Record<string, any>) {
    return qs.stringify(searchParams, {
      arrayFormat: 'repeat',
      skipNulls: true,
    });
  }
}
```

</DiffEditor>

axios omite los parámetros `null` y `undefined`, pero el `searchToString()` por defecto usa
[URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), que los envía como las cadenas
`"null"` y `"undefined"`; `skipNulls` arriba los descarta. Consulta [`searchToString()`](../api/RestEndpoint.md#searchToString).

### Autenticación básica {#basic-auth}

<DiffEditor>

```ts title="Before"
axios.get('/api', { auth: { username: 'user', password: 'pass' } });
```

```ts title="After"
export default class BasicAuthEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Basic ${btoa('user:pass')}`,
    };
  }
}
```

</DiffEditor>

### Aceptar estados de error {#accepting-error-statuses}

[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) lanza [`NetworkError`](#error-handling) para cualquier estado que
no sea `ok`. Sobrescríbelo para cambiar qué se considera un error:

<DiffEditor>

```ts title="Before"
axios.get('/api', { validateStatus: status => status < 500 });
```

```ts title="After"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class LenientEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    const response = await fetch(input, init);
    if (response.status >= 500) throw new NetworkError(response);
    return response;
  }
}
```

</DiffEditor>

### Cabeceras CSRF {#csrf-headers}

```ts title="Before"
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});
```

Lee la cookie en [`getHeaders()`](../api/RestEndpoint.md#getHeaders) para las peticiones que no sean `GET`. Consulta la
[integración con Django](./django.md) para ver la clase de endpoint completa.

### Progreso de subida {#upload-progress}

`fetch` no puede informar del progreso de subida, así que usa
[XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) dentro de
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse). El campo `onProgress` se pasa como una opción del endpoint, como
cualquier otro miembro.

```ts title="Before"
axios.post('/upload', formData, {
  onUploadProgress: e => console.log(e.loaded / e.total),
});
```

```ts title="UploadEndpoint.ts"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class UploadEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  declare onProgress?: (progress: number) => void;

  fetchResponse(input: RequestInfo, init: RequestInit) {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const abort = () => xhr.abort();
      const abortError = () =>
        new DOMException('The operation was aborted.', 'AbortError');
      if (init.signal?.aborted) return reject(abortError());
      init.signal?.addEventListener('abort', abort, { once: true });

      xhr.open(
        init.method ?? 'POST',
        typeof input === 'string' ? input : input.url,
      );
      new Headers(init.headers).forEach((value, key) =>
        xhr.setRequestHeader(key, value),
      );
      xhr.onloadend = () =>
        init.signal?.removeEventListener('abort', abort);
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) this.onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        const headers = new Headers();
        for (const line of xhr
          .getAllResponseHeaders()
          .trim()
          .split(/\r?\n/)) {
          const [key, ...rest] = line.split(': ');
          if (key) headers.append(key, rest.join(': '));
        }
        // 204, 205 and 304 responses can't have a body
        const body = [204, 205, 304].includes(xhr.status)
          ? null
          : xhr.response;
        const response = new Response(body, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers,
        });
        if (response.ok) resolve(response);
        else reject(new NetworkError(response));
      };
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.onabort = () => reject(abortError());
      xhr.send(init.body as XMLHttpRequestBodyInit | null);
    });
  }
}

const uploadFile = new UploadEndpoint({
  path: '/upload',
  method: 'POST',
  body: {} as FormData,
  onProgress: (progress: number) => console.log(progress),
});
```

## Guías relacionadas {#related-guides}

- [Autenticación](./auth.md): patrones de autenticación con tokens y cookies
- [Cancelar el fetch](./abort.md): cancelación y debouncing
- [Transformar datos al hacer fetch](./network-transform.md): transformaciones de respuestas, renombrado de campos, descargas de archivos
- [Integración con Django](./django.md): CSRF y autenticación por cookies para Django
