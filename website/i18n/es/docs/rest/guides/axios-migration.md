---
title: Migrar de Axios a Reactive Data Client
sidebar_label: Migración desde Axios
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import SkillTabs from '@site/src/components/SkillTabs';
import SiteOnly from '@site/src/components/SiteOnly';

# Migrar desde Axios

[`@data-client/rest`](/rest) reemplaza axios con un enfoque declarativo y con tipado seguro para las APIs REST.

<SiteOnly>

## Migración asistida por IA {#skill}

Instala el skill de configuración de REST para automatizar la migración con tu asistente de programación con IA. Detecta automáticamente axios en tu proyecto y ejecuta el [codemod](#codemod) para las transformaciones deterministas; después te guía por los pasos manuales que requieren criterio (interceptores, manejo de errores, definiciones de schemas, etc.).

<SkillTabs repo="reactive/data-client" skills={['data-client-schema', 'data-client-rest-setup', 'data-client-rest']} />

Luego ejecuta el skill `/data-client-rest-setup` para iniciar la migración. Detectará axios y aplicará automáticamente el subprocedimiento de migración adecuado.

</SiteOnly>

## ¿Por qué migrar? {#why-migrate}

### Rutas con tipado seguro {#type-safe-paths}

Con axios, las rutas de la API son cadenas opacas: los errores tipográficos y los parámetros que faltan solo se detectan en tiempo de ejecución:

```ts
// axios: no type checking — typo silently produces wrong URL
axios.get(`/users/${usrId}`);
```

Con [`RestEndpoint`](../api/RestEndpoint.md), los parámetros de la ruta se infieren de la plantilla `path` y se exigen en tiempo de compilación:

```ts
const getUser = new RestEndpoint({ path: '/users/:id', schema: User });
// TypeScript enforces { id: string } — typos are compile errors
getUser({ id: '1' });
```

Esto también significa que el autocompletado del IDE funciona para cada parámetro de la ruta.

### Ventajas adicionales {#additional-benefits}

- **Caché normalizada** — las entidades compartidas se deduplican y se actualizan automáticamente en todas partes
- **Dependencias de datos declarativas** — los componentes declaran qué datos necesitan mediante [`useSuspense()`](/docs/api/useSuspense), no cómo obtenerlos
- **Actualizaciones optimistas** — respuesta instantánea en la interfaz antes de que responda el servidor
- **Cero código repetitivo** — [`resource()`](../api/resource.md) genera una API CRUD completa a partir de un `path` y un `schema`

## Referencia rápida {#quick-reference}

| Axios                                    | @data-client/rest                                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseURL`                                | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix)                                                                                                          |
| configuración `headers`                  | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                                                                      |
| `interceptors.request`                   | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) / [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                        |
| `interceptors.response`                  | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process)                                                |
| `timeout`                                | [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) mediante `signal`                                  |
| `params` / `paramsSerializer`            | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](../api/RestEndpoint.md#searchToString)                                      |
| `cancelToken` / `signal`                 | `signal` ([AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController))                                                           |
| `responseType: 'blob'` / `'arraybuffer'` | [`content: 'blob'`](../api/RestEndpoint.md#content) / `'arrayBuffer'` — consulta la [descarga de archivos](./network-transform.md#file-download)                        |
| `auth: { username, password }`           | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) con `btoa()`                                                                                          |
| `xsrfCookieName` / `xsrfHeaderName`      | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) — consulta la [integración con Django](./django.md)                                                              |
| `transformRequest`                       | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                                                                                              |
| `transformResponse`                      | [`process()`](../api/RestEndpoint.md#process)                                                                                                            |
| `validateStatus`                         | [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) personalizado                                                                                  |
| `onUploadProgress`                       | [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) personalizado con [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) |
| `isAxiosError` / `error.response`        | [`NetworkError`](../api/RestEndpoint.md#fetchResponse) con `.status` y `.response`                                                                    |

## Ejemplos de migración {#migration-examples}

### GET básico {#basic-get}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts title="api.ts"
import axios from 'axios';

export const getUser = (id: string) =>
  axios.get(`https://api.example.com/users/${id}`);
```

```ts title="usage.ts"
const { data } = await getUser('1');
```

</TabItem>
<TabItem value="after">

<EndpointPlayground input="https://api.example.com/users/1" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}} status={200} response={{ "id": "1", "username": "alice", "email": "alice@example.com" }}>

```ts title="User" collapsed
import { Entity } from '@data-client/rest';

export default class User extends Entity {
  id = '';
  username = '';
  email = '';
  static key = 'User';
}
```

```ts title="api"
import { RestEndpoint } from '@data-client/rest';
import User from './User';

export const getUser = new RestEndpoint({
  urlPrefix: 'https://api.example.com',
  path: '/users/:id',
  schema: User,
});
```

```ts title="Usage" column
import { getUser } from './api';
getUser({ id: '1' });
```

</EndpointPlayground>

</TabItem>
</Tabs>

### Instancia con URL base y cabeceras {#instance-with-base-url-and-headers}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts title="api.ts"
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'my-key' },
});

export const getPost = (id: string) => api.get(`/posts/${id}`);
export const createPost = (data: any) => api.post('/posts', data);
```

</TabItem>
<TabItem value="after">

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

```ts title="ApiEndpoint"
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

```ts title="PostResource" collapsed
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

</TabItem>
</Tabs>

### Mutación POST {#post-mutation}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts title="api.ts"
import axios from 'axios';

const api = axios.create({ baseURL: 'https://api.example.com' });

export const createPost = (data: { title: string; body: string }) =>
  api.post('/posts', data);
```

</TabItem>
<TabItem value="after">

<EndpointPlayground input="https://api.example.com/posts" init={{method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{"title":"New Post","body":"Content"}'}} status={201} response={{ "id": "2", "title": "New Post", "body": "Content" }}>

```ts title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  body = '';
  static key = 'Post';
}
```

```ts title="PostResource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  urlPrefix: 'https://api.example.com',
  path: '/posts/:id',
  schema: Post,
});
```

```ts title="Usage" column
import { PostResource } from './PostResource';
PostResource.getList.push({
  title: 'New Post',
  body: 'Content',
});
```

</EndpointPlayground>

</TabItem>
</Tabs>

### Interceptores → métodos del ciclo de vida {#interceptors--lifecycle-methods}

Los interceptores de axios se corresponden con los métodos del ciclo de vida de [RestEndpoint](../api/RestEndpoint.md):

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts title="api.ts"
import axios from 'axios';

const api = axios.create({ baseURL: 'https://api.example.com' });

// Request interceptor — add auth token
api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

// Response interceptor — unwrap .data
api.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error),
);
```

</TabItem>
<TabItem value="after">

```ts title="ApiEndpoint.ts"
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  // Equivalent to request interceptor
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Bearer ${getToken()}`,
    };
  }

  // Equivalent to response interceptor (unwrap/transform)
  process(value: any, ...args: any) {
    return value;
  }
}
```

</TabItem>
</Tabs>

:::tip

`RestEndpoint` ya devuelve el JSON analizado de forma predeterminada; no hace falta ningún interceptor para extraer `response.data`.

:::

Los interceptores de respuesta que transforman el cuerpo, como convertir claves `snake_case`, pertenecen a [`process()`](../api/RestEndpoint.md#process). Consulta [de snake a camel](./network-transform.md#snakes-to-camels) para ver un ejemplo completo.

### Manejo de errores {#error-handling}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts
import axios from 'axios';

try {
  const { data } = await axios.get('/users/1');
} catch (err) {
  if (axios.isAxiosError(err)) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}
```

</TabItem>
<TabItem value="after">

```ts
import { NetworkError } from '@data-client/rest';

try {
  const user = await getUser({ id: '1' });
} catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.status);
    console.log(err.response);
  }
}
```

[`NetworkError`](../api/RestEndpoint.md#fetchResponse) proporciona `.status` y `.response` (el objeto [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) sin procesar). Para reintentos suaves ante errores del servidor, consulta [`errorPolicy`](../api/RestEndpoint.md#errorpolicy).

</TabItem>
</Tabs>

#### Mensajes de error del servidor {#server-error-messages}

Es habitual que las bases de código con axios muestren al usuario `error.response.data.error` o `.message`. En su lugar, léelo una sola vez del cuerpo de la `Response`, en el [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) de la clase base, de modo que los puntos de llamada lo obtengan de `error.message` sin analizar el cuerpo:

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

### Cancelación {#cancellation}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts
import axios from 'axios';

const controller = new AbortController();
axios.get('/users', { signal: controller.signal });
controller.abort();
```

O con el `CancelToken`, ya obsoleto:

```ts
const source = axios.CancelToken.source();
axios.get('/users', { cancelToken: source.token });
source.cancel();
```

</TabItem>
<TabItem value="after">

Ambos se corresponden con un `signal` de [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController). El hook [`useCancelling()`](/docs/api/useCancelling) cancela automáticamente las peticiones en curso cuando cambian los parámetros:

```tsx
import { useSuspense } from '@data-client/react';
import { useCancelling } from '@data-client/react';
import { searchEndpoint } from './api/search';
import ResultsList from './ResultsList';

function SearchResults({ query }: { query: string }) {
  const results = useSuspense(useCancelling(searchEndpoint), { q: query });
  return <ResultsList results={results} />;
}
```

Para la cancelación manual, pasa `signal` directamente:

```ts
const controller = new AbortController();
const getUser = new RestEndpoint({
  path: '/users/:id',
  signal: controller.signal,
});
controller.abort();
```

</TabItem>
</Tabs>

Consulta la [guía de abort](./abort.md) para ver más patrones.

### Tiempo de espera {#timeout}

```ts title="Before (axios)"
axios.get('/users', { timeout: 5000 });
```

```ts title="After (data-client)"
const getUsers = new RestEndpoint({
  path: '/users',
  signal: AbortSignal.timeout(5000),
});
```

### Respuestas binarias {#binary-responses}

```ts title="Before (axios)"
axios.get('/files/1', { responseType: 'blob' });
```

Establece [`content`](../api/RestEndpoint.md#content) en `'blob'`, `'arrayBuffer'` o `'text'`. Consulta la [descarga de archivos](./network-transform.md#file-download) para ver el endpoint completo y cómo iniciar una descarga en el navegador.

### Serialización de la consulta {#query-serialization}

```ts title="Before (axios)"
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params =>
    qs.stringify(params, { arrayFormat: 'repeat' }),
});
```

Sobrescribe [`searchToString()`](../api/RestEndpoint.md#searchToString) para serializar con `qs`; consulta [el uso de la librería `qs`](../api/RestEndpoint.md#searchToString).

### Autenticación básica {#basic-auth}

```ts title="Before (axios)"
axios.get('/api', { auth: { username: 'user', password: 'pass' } });
```

```ts title="After (data-client)"
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

### Aceptar estados de error {#accepting-error-statuses}

[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) lanza [`NetworkError`](../api/RestEndpoint.md#fetchResponse) para cualquier estado que no sea `ok`. Sobrescríbelo para cambiar qué se considera un error:

```ts title="Before (axios)"
axios.get('/api', { validateStatus: status => status < 500 });
```

```ts title="After (data-client)"
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

### Cabeceras CSRF {#csrf-headers}

```ts title="Before (axios)"
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});
```

Lee la cookie en [`getHeaders()`](../api/RestEndpoint.md#getHeaders) para las peticiones que no sean `GET`. Consulta la [integración con Django](./django.md) para ver la clase de endpoint completa.

### Progreso de subida {#upload-progress}

`fetch` no puede informar del progreso de subida, así que usa [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) dentro de [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse). El campo `onProgress` se pasa como una opción del endpoint, como cualquier otro miembro.

```ts title="Before (axios)"
axios.post('/upload', formData, {
  onUploadProgress: e => console.log(e.loaded / e.total),
});
```

```ts title="After (data-client)"
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

## Codemod {#codemod}

Un codemod independiente de [jscodeshift](https://github.com/facebook/jscodeshift) se encarga de las partes mecánicas de la migración.<SiteOnly> Ejecútalo tú mismo si no usas flujos de trabajo con IA; el [skill de IA](#skill) de arriba lo ejecuta automáticamente como primer paso.</SiteOnly>

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

El codemod, de forma automática:

- Reemplaza `import axios from 'axios'` por `import { RestEndpoint } from '@data-client/rest'`
- Convierte `axios.create({ baseURL, headers })` en una subclase base de `RestEndpoint` con `urlPrefix` y `getHeaders()`
- Transforma `axios.get()`, `.post()`, `.put()`, `.patch()`, `.delete()` en `new RestEndpoint({ path, method })`
- Transforma las llamadas sobre una instancia creada (`api.post()` donde `api = axios.create(...)`) en `new CreatedClassName({ path, method })`

El codemod tiene poco que hacer cuando el proyecto envuelve axios en su propia clase o función y nunca llama a `axios.get()`/`.post()` directamente, o solo llama a `axios(config)` sin nombre de método. En esos casos, sáltalo y empieza con [los pasos manuales](#after-the-codemod).

El codemod **no** se encarga de:

- Los interceptores — consulta los [métodos del ciclo de vida](#interceptors--lifecycle-methods)
- El manejo de errores (`isAxiosError`, `error.response`) — consulta el [manejo de errores](#error-handling)
- El resto de la [referencia rápida](#quick-reference) — consulta los [ejemplos de migración](#migration-examples) de arriba
- Las definiciones de schemas de [Entity](../api/Entity.md) y la conversión de los puntos de llamada a hooks — consulta [más abajo](#after-the-codemod)

### Encontrar el uso restante de axios {#finding-remaining-axios-usage}

Patrones de búsqueda para localizar lo que aún falta por migrar:

| Patrón                                     | Encuentra                 |
| ------------------------------------------ | ------------------------- |
| `import.*from ['"]axios['"]`               | sentencias import         |
| `axios\.create`                            | creación de instancias    |
| `axios\.(get\|post\|put\|patch\|delete)`   | llamadas directas         |
| `\.interceptors\.(request\|response)\.use` | interceptores             |
| `isAxiosError`                             | manejo de errores         |
| `cancelToken\|CancelToken`                 | cancelación (obsoleta)    |
| `onUploadProgress\|onDownloadProgress`     | callbacks de progreso     |

## Después del codemod {#after-the-codemod}

El codemod produce endpoints sin schemas. Definir schemas de [Entity](../api/Entity.md) y conectarlos a los endpoints habilita la normalización y el almacenamiento en caché, que es el valor central de Reactive Data Client.

### Claves primarias no estándar {#non-standard-primary-keys}

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

### Agrupar endpoints CRUD con resource() {#group-crud-endpoints-with-resource}

Cuando un módulo de axios tiene funciones separadas `getUsers`, `getUser`, `createUser`, `updateUser` y `deleteUser` para una misma ruta, reemplázalas por un único [`resource()`](../api/resource.md):

```ts
import { resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';
import { User } from './User';

export const UserResource = resource({
  path: '/users/:id',
  schema: User,
  Endpoint: ApiEndpoint,
});
// UserResource.getList, .get, .getList.push, .update, .partialUpdate, .delete
```

Las rutas anidadas como `/projects/:projectId/tasks/:taskId` tienen su propio resource. Reserva `new ApiEndpoint()` independiente para las operaciones que no son CRUD (búsqueda, acciones personalizadas, autenticación).

### Convivir con Zod o Yup {#coexisting-with-zod-or-yup}

Si la base de código ya valida las respuestas con Zod o Yup, elige un enfoque por tipo:

- **Zod en `process()`** (recomendado): mantén la validación en tiempo de ejecución analizando en [`process()`](../api/RestEndpoint.md#process) y deja que la Entity se encargue de la normalización:

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **La Entity reemplaza a Zod**: mueve la forma de los campos a la clase Entity y elimina el schema de Zod. Los campos de la Entity aportan tipos, no comprobaciones en tiempo de ejecución, así que añade [`static validate()`](../api/Entity.md#validate) para cualquier campo que el servidor pueda enviar mal formado.
- **Solo Zod, sin Entity**: deja `schema` sin definir y analiza manualmente. Hazlo solo en los endpoints que no se benefician de la normalización (tokens de autenticación, respuestas puntuales).

:::warning

No definas clases Entity y luego dejes `schema` sin definir en todos los endpoints: sin `schema`, nada se normaliza y la migración aporta poco respecto a axios.

:::

### Tipado del cuerpo {#body-typing}

Tipa el cuerpo de los endpoints `POST`/`PUT`/`PATCH` independientes con `body: {} as BodyType`. No uses `undefined as unknown as BodyType`: `RestEndpoint` trata [`body`](../api/RestEndpoint.md#body)`: undefined` como si no hubiera argumento de cuerpo.

```ts
const createUser = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: {} as { name: string; email: string },
  schema: User,
});
```

[`resource()`](../api/resource.md) tipa sus endpoints CRUD automáticamente.

### Convertir los puntos de llamada a hooks {#convert-call-sites-to-hooks}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```tsx
import { useEffect, useState } from 'react';
import api from './lib/api';
import { Spinner } from './Spinner';
import type { User } from './User';

function UserProfile({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    api.get(`/users/${id}`).then(({ data }) => setUser(data));
  }, [id]);
  if (!user) return <Spinner />;
  return <h1>{user.name}</h1>;
}
```

</TabItem>
<TabItem value="after">

```tsx
import { useSuspense } from '@data-client/react';
import { UserResource } from './UserResource';

function UserProfile({ id }: { id: string }) {
  const user = useSuspense(UserResource.get, { id });
  return <h1>{user.name}</h1>;
}
```

</TabItem>
</Tabs>

Los estados de carga y de error pasan a [`AsyncBoundary`](/docs/api/AsyncBoundary). Consulta [`useSuspense()`](/docs/api/useSuspense) para más detalles.

### Autenticación basada en contexto {#context-based-auth}

Cuando los tokens provienen del contexto de React (Okta, Auth0) en lugar del almacenamiento, usa [`hookifyResource()`](../api/hookifyResource.md) para inyectar las cabeceras mediante un hook. Consulta la [guía de autenticación](./auth.md) para este y otros patrones.

### Migración gradual {#gradual-migration}

Si la aplicación usa TanStack Query o SWR y no puede convertirlo todo de una vez, conserva temporalmente esos hooks pero haz el fetch a través de [`controller.fetch()`](/docs/api/Controller#fetch). Llamar a un endpoint directamente solo ejecuta su fetch; pasar por el Controller también normaliza la respuesta en la caché compartida, de modo que los datos son consistentes desde el primer día:

```ts
import { useController } from '@data-client/react';
import { useQuery } from '@tanstack/react-query';
import ApiEndpoint from './ApiEndpoint';
import { Project } from './Project';

export const getProject = new ApiEndpoint({
  path: '/projects/:id',
  schema: Project,
});

export function useProject(id: string) {
  const ctrl = useController();
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => ctrl.fetch(getProject, { id }),
  });
}
```

Más adelante, reemplaza `useProject(id)` por `useSuspense(getProject, { id })`.

### Abstracciones de endpoint existentes {#existing-endpoint-abstractions}

Las bases de código que ya tienen una clase de endpoint personalizada que envuelve axios (por ejemplo, una con `path`, `method` y un ayudante `toDynamicUrl()`) pueden extender `RestEndpoint` en lugar de reemplazarla, manteniendo los métodos retrocompatibles y ganando [`url()`](../api/RestEndpoint.md#url), [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit), [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) and [`parseResponse()`](../api/RestEndpoint.md#parseResponse):

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

Pasa los miembros adicionales como `queryKey` como opciones en lugar de mediante un constructor personalizado, para que [`extend()`](../api/RestEndpoint.md#extend) (usado por `resource()`, `hookifyResource()` y `useCancelling()`) siga funcionando.

## Guías relacionadas {#related-guides}

- [Autenticación](./auth.md) — patrones de autenticación con tokens y cookies
- [Cancelar el fetch](./abort.md) — cancelación y debouncing
- [Transformar datos al hacer fetch](./network-transform.md) — transformaciones de respuestas, renombrado de campos, descargas de archivos
- [Integración con Django](./django.md) — CSRF y autenticación por cookies para Django
