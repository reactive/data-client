---
title: Migrando do Axios para o Reactive Data Client
sidebar_label: Migração do Axios
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import SkillTabs from '@site/src/components/SkillTabs';
import SiteOnly from '@site/src/components/SiteOnly';

# Migrando do Axios

O [`@data-client/rest`](/rest) substitui o axios por uma abordagem declarativa e com tipagem segura para APIs REST.

<SiteOnly>

## Migração assistida por IA {#skill}

Instale a skill de configuração do REST para automatizar a migração com seu assistente de código com IA. Ela detecta automaticamente o axios no seu projeto e executa o [codemod](#codemod) para as transformações determinísticas; depois, guia você pelos passos manuais que exigem julgamento (interceptors, tratamento de erros, definições de schema etc.).

<SkillTabs repo="reactive/data-client" skills={['data-client-schema', 'data-client-rest-setup', 'data-client-rest']} />

Em seguida, execute a skill `/data-client-rest-setup` para iniciar a migração. Ela detectará o axios e aplicará automaticamente o subprocedimento de migração adequado.

</SiteOnly>

## Por que migrar? {#why-migrate}

### Paths com tipagem segura {#type-safe-paths}

Com o axios, os paths da API são strings opacas — erros de digitação e parâmetros ausentes só são detectados em tempo de execução:

```ts
// axios: no type checking — typo silently produces wrong URL
axios.get(`/users/${usrId}`);
```

Com o [`RestEndpoint`](../api/RestEndpoint.md), os parâmetros do path são inferidos a partir do template de `path` e verificados em tempo de compilação:

```ts
const getUser = new RestEndpoint({ path: '/users/:id', schema: User });
// TypeScript enforces { id: string } — typos are compile errors
getUser({ id: '1' });
```

Isso também significa que o autocompletar da IDE funciona para todos os parâmetros do path.

### Benefícios adicionais {#additional-benefits}

- **Cache normalizado** — entities compartilhadas são deduplicadas e atualizadas automaticamente em todos os lugares
- **Dependências de dados declarativas** — os componentes declaram quais dados precisam por meio de [`useSuspense()`](/docs/api/useSuspense), e não como buscá-los
- **Atualizações otimistas** — feedback instantâneo na UI antes de o servidor responder
- **Zero código boilerplate** — [`resource()`](../api/resource.md) gera uma API CRUD completa a partir de um `path` e de um `schema`

## Referência rápida {#quick-reference}

| Axios                                    | @data-client/rest                                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseURL`                                | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix)                                                                                                          |
| configuração `headers`                   | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                                                                      |
| `interceptors.request`                   | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) / [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                        |
| `interceptors.response`                  | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process)                                                |
| `timeout`                                | [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) via `signal`                                      |
| `params` / `paramsSerializer`            | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](../api/RestEndpoint.md#searchToString)                                      |
| `cancelToken` / `signal`                 | `signal` ([AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController))                                                           |
| `responseType: 'blob'` / `'arraybuffer'` | [`content: 'blob'`](../api/RestEndpoint.md#content) / `'arrayBuffer'` — veja [download de arquivo](./network-transform.md#file-download)                        |
| `auth: { username, password }`           | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) com `btoa()`                                                                                        |
| `xsrfCookieName` / `xsrfHeaderName`      | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) — veja [Integração com Django](./django.md)                                                              |
| `transformRequest`                       | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                                                                                              |
| `transformResponse`                      | [`process()`](../api/RestEndpoint.md#process)                                                                                                            |
| `validateStatus`                         | [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) personalizado                                                                                  |
| `onUploadProgress`                       | [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) personalizado usando [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) |
| `isAxiosError` / `error.response`        | [`NetworkError`](../api/RestEndpoint.md#fetchResponse) com `.status` e `.response`                                                                    |

## Exemplos de migração {#migration-examples}

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

### Instância com URL base e headers {#instance-with-base-url-and-headers}

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

### Mutação com POST {#post-mutation}

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

### Interceptors → métodos de ciclo de vida {#interceptors--lifecycle-methods}

Os interceptors do axios correspondem aos métodos de ciclo de vida do [RestEndpoint](../api/RestEndpoint.md):

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

O `RestEndpoint` já retorna o JSON interpretado por padrão — não é necessário nenhum interceptor para extrair `response.data`.

:::

Interceptors de resposta que transformam o corpo, como a conversão de chaves em `snake_case`, pertencem a [`process()`](../api/RestEndpoint.md#process). Veja [snakes to camels](./network-transform.md#snakes-to-camels) para um exemplo completo.

### Tratamento de erros {#error-handling}

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

[`NetworkError`](../api/RestEndpoint.md#fetchResponse) fornece `.status` e `.response` (o objeto [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) bruto). Para novas tentativas suaves em erros de servidor, veja [`errorPolicy`](../api/RestEndpoint.md#errorpolicy).

</TabItem>
</Tabs>

#### Mensagens de erro do servidor {#server-error-messages}

Bases de código com axios costumam expor `error.response.data.error` ou `.message` ao usuário. Em vez disso, leia isso do corpo da `Response` uma única vez, no [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) da classe base, para que os pontos de chamada obtenham a mensagem em `error.message` sem precisar interpretar o corpo:

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

### Cancelamento {#cancellation}

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

Ou com o `CancelToken`, já obsoleto:

```ts
const source = axios.CancelToken.source();
axios.get('/users', { cancelToken: source.token });
source.cancel();
```

</TabItem>
<TabItem value="after">

Ambos correspondem a um `signal` de [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController). O hook [`useCancelling()`](/docs/api/useCancelling) cancela automaticamente as requisições em andamento quando os parâmetros mudam:

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

Para cancelamento manual, passe `signal` diretamente:

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

Veja o [guia de abort](./abort.md) para mais padrões.

### Timeout {#timeout}

```ts title="Before (axios)"
axios.get('/users', { timeout: 5000 });
```

```ts title="After (data-client)"
const getUsers = new RestEndpoint({
  path: '/users',
  signal: AbortSignal.timeout(5000),
});
```

### Respostas binárias {#binary-responses}

```ts title="Before (axios)"
axios.get('/files/1', { responseType: 'blob' });
```

Defina [`content`](../api/RestEndpoint.md#content) como `'blob'`, `'arrayBuffer'` ou `'text'`. Veja [download de arquivo](./network-transform.md#file-download) para o endpoint completo e para disparar um download no navegador.

### Serialização de query {#query-serialization}

```ts title="Before (axios)"
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params =>
    qs.stringify(params, { arrayFormat: 'repeat' }),
});
```

Sobrescreva [`searchToString()`](../api/RestEndpoint.md#searchToString) para serializar com `qs`; veja [usando a biblioteca `qs`](../api/RestEndpoint.md#searchToString).

### Autenticação básica {#basic-auth}

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

### Aceitando status de erro {#accepting-error-statuses}

[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) lança [`NetworkError`](../api/RestEndpoint.md#fetchResponse) para qualquer status diferente de `ok`. Sobrescreva-o para mudar o que conta como erro:

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

### Headers CSRF {#csrf-headers}

```ts title="Before (axios)"
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});
```

Leia o cookie em [`getHeaders()`](../api/RestEndpoint.md#getHeaders) para requisições que não sejam `GET`. Veja [Integração com Django](./django.md) para a classe de endpoint completa.

### Progresso de upload {#upload-progress}

O `fetch` não consegue informar o progresso de upload, então use [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) dentro de [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse). O campo `onProgress` é passado como uma opção do endpoint, como qualquer outro membro.

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

Um codemod independente do [jscodeshift](https://github.com/facebook/jscodeshift) cuida das partes mecânicas da migração.<SiteOnly> Execute-o você mesmo em fluxos de trabalho sem IA; a [skill de IA](#skill) acima o executa automaticamente como primeiro passo.</SiteOnly>

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

O codemod, automaticamente:

- Substitui `import axios from 'axios'` por `import { RestEndpoint } from '@data-client/rest'`
- Converte `axios.create({ baseURL, headers })` em uma subclasse base de `RestEndpoint` com `urlPrefix` e `getHeaders()`
- Transforma `axios.get()`, `.post()`, `.put()`, `.patch()`, `.delete()` em `new RestEndpoint({ path, method })`
- Transforma chamadas em uma instância criada (`api.post()`, em que `api = axios.create(...)`) em `new CreatedClassName({ path, method })`

O codemod tem pouco a fazer quando o projeto encapsula o axios em uma classe ou função própria e nunca chama `axios.get()`/`.post()` diretamente, ou só chama `axios(config)` sem um nome de método. Nesses casos, pule-o e comece pelos [passos manuais](#after-the-codemod).

O codemod **não** trata:

- Interceptors — veja [métodos de ciclo de vida](#interceptors--lifecycle-methods)
- Tratamento de erros (`isAxiosError`, `error.response`) — veja [tratamento de erros](#error-handling)
- O restante da [referência rápida](#quick-reference) — veja os [exemplos de migração](#migration-examples) acima
- Definições de schema de [Entity](../api/Entity.md) e a conversão dos pontos de chamada para hooks — veja [abaixo](#after-the-codemod)

### Encontrando usos restantes do axios {#finding-remaining-axios-usage}

Padrões de busca para localizar o que ainda precisa ser migrado:

| Padrão                                     | Encontra                  |
| ------------------------------------------ | ------------------------- |
| `import.*from ['"]axios['"]`               | instruções de import      |
| `axios\.create`                            | criação de instância      |
| `axios\.(get\|post\|put\|patch\|delete)`   | chamadas diretas          |
| `\.interceptors\.(request\|response)\.use` | interceptors              |
| `isAxiosError`                             | tratamento de erros       |
| `cancelToken\|CancelToken`                 | cancelamento (obsoleto)   |
| `onUploadProgress\|onDownloadProgress`     | callbacks de progresso    |

## Depois do codemod {#after-the-codemod}

O codemod produz endpoints sem schemas. Definir schemas de [Entity](../api/Entity.md) e ligá-los aos endpoints habilita a normalização e o cache — o principal valor do Reactive Data Client.

### Chaves primárias fora do padrão {#non-standard-primary-keys}

Muitas APIs (MongoDB, por exemplo) usam `_id` em vez de `id`. Sobrescreva [`pk()`](../api/Entity.md#pk):

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

### Agrupe endpoints CRUD com resource() {#group-crud-endpoints-with-resource}

Quando um módulo axios tem funções separadas `getUsers`, `getUser`, `createUser`, `updateUser` e `deleteUser` para um mesmo path, substitua-as por um único [`resource()`](../api/resource.md):

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

Paths aninhados como `/projects/:projectId/tasks/:taskId` ganham o seu próprio resource. Reserve `new ApiEndpoint()` avulso para operações que não são CRUD (busca, ações personalizadas, autenticação).

### Convivendo com Zod ou Yup {#coexisting-with-zod-or-yup}

Se a base de código já valida respostas com Zod ou Yup, escolha uma abordagem por tipo:

- **Zod em `process()`** (recomendado): mantenha a validação em tempo de execução fazendo o parse em [`process()`](../api/RestEndpoint.md#process) e deixe a Entity cuidar da normalização:

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **Entity substitui o Zod**: mova o formato dos campos para a classe Entity e remova o schema do Zod. Os campos da Entity fornecem tipos, não verificações em tempo de execução, então adicione [`static validate()`](../api/Entity.md#validate) para os campos que o servidor possa enviar malformados.
- **Somente Zod, sem Entity**: deixe `schema` indefinido e faça o parse manualmente. Faça isso apenas em endpoints que não se beneficiam da normalização (tokens de autenticação, respostas pontuais).

:::warning

Não defina classes Entity e depois deixe `schema` indefinido em todos os endpoints — sem `schema`, nada é normalizado e a migração ganha pouco em relação ao axios.

:::

### Tipagem do body {#body-typing}

Tipe o body de endpoints `POST`/`PUT`/`PATCH` avulsos com `body: {} as BodyType`. Não use `undefined as unknown as BodyType`: o `RestEndpoint` trata [`body`](../api/RestEndpoint.md#body)`: undefined` como ausência de argumento de body.

```ts
const createUser = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: {} as { name: string; email: string },
  schema: User,
});
```

[`resource()`](../api/resource.md) tipa seus endpoints CRUD automaticamente.

### Converta os pontos de chamada em hooks {#convert-call-sites-to-hooks}

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

Os estados de carregamento e de erro passam para o [`AsyncBoundary`](/docs/api/AsyncBoundary). Veja [`useSuspense()`](/docs/api/useSuspense) para mais detalhes.

### Autenticação baseada em contexto {#context-based-auth}

Quando os tokens vêm do contexto do React (Okta, Auth0) em vez de um armazenamento, use [`hookifyResource()`](../api/hookifyResource.md) para injetar headers por meio de um hook. Veja o [guia de autenticação](./auth.md) para este e outros padrões.

### Migração gradual {#gradual-migration}

Se o app usa TanStack Query ou SWR e não consegue converter tudo de uma vez, mantenha esses hooks temporariamente, mas faça o fetch por meio de [`controller.fetch()`](/docs/api/Controller#fetch). Chamar um endpoint diretamente apenas executa o seu fetch; passar pelo Controller também normaliza a resposta no cache compartilhado, de modo que os dados ficam consistentes desde o primeiro dia:

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

Mais tarde, substitua `useProject(id)` por `useSuspense(getProject, { id })`.

### Abstrações de endpoint existentes {#existing-endpoint-abstractions}

Bases de código que já têm uma classe de endpoint personalizada encapsulando o axios (digamos, uma com `path`, `method` e um helper `toDynamicUrl()`) podem estender `RestEndpoint` em vez de substituí-lo, mantendo métodos compatíveis com versões anteriores e ganhando [`url()`](../api/RestEndpoint.md#url), [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit), [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) e [`parseResponse()`](../api/RestEndpoint.md#parseResponse):

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

Passe membros extras como `queryKey` como opções, em vez de usar um construtor personalizado, para que [`extend()`](../api/RestEndpoint.md#extend) (usado por `resource()`, `hookifyResource()` e `useCancelling()`) continue funcionando.

## Guias relacionados {#related-guides}

- [Autenticação](./auth.md) — padrões de autenticação por token e cookie
- [Abortando o fetch](./abort.md) — cancelamento e debouncing
- [Transformando dados no fetch](./network-transform.md) — transformações de resposta, renomeação de campos, downloads de arquivos
- [Integração com Django](./django.md) — CSRF e autenticação por cookie para Django
