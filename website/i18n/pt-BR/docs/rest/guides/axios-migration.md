---
title: Migrando do Axios para o Reactive Data Client
sidebar_label: Migração do Axios
---

import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import PkgTabs from '@site/src/components/PkgTabs';
import DiffEditor from '@site/src/components/DiffEditor';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

# Migrando do Axios

O [`@data-client/rest`](/rest) substitui as chamadas do axios por definições de endpoint tipadas. Os componentes continuam chamando-as diretamente,
então a forma como o app carrega e armazena dados não muda; muda apenas o formato da chamada. Um [codemod](#codemod) converte as chamadas; os
[passos](#steps) abaixo cobrem o restante.

<SiteOnly>

## Migre com o seu agente de código {#agent}

Cole isto no chat do seu agent:

```prompt
Replace this app's axios calls with `@data-client/rest` endpoints, without changing how components load or store data. Install the REST setup skill first: `npx skills add reactive/data-client --skill data-client-rest-setup -y`, then read `.agents/skills/data-client-rest-setup/SKILL.md` and follow it.
```

A [skill](/docs/getting-started/agent-skills) de configuração do REST segue este guia: ela executa o codemod e depois percorre
os [passos](#steps) que o codemod não consegue fazer. Revise o diff dela como o de um colega de equipe.

</SiteOnly>

<AgentOnly>

Para migrar um app do axios, instale a skill de configuração do REST a partir da raiz do projeto:

```bash
npx skills add reactive/data-client --skill data-client-rest-setup -y
```

Em seguida, leia `.agents/skills/data-client-rest-setup/SKILL.md` e siga-o; ele detecta o axios e segue os
[passos](#steps) abaixo. Substitua apenas as chamadas do axios e suas definições: deixe os componentes, o carregamento de dados e o gerenciamento
de estado como estão, a menos que o usuário peça para alterá-los.

</AgentOnly>

## Por que migrar? {#why-migrate}

<DiffEditor caption="A URL é declarada uma única vez: os parâmetros do path são tipados e codificados a partir do template de `path`, e os demais viram a query string. As chamadas não mudam.">

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

- **Tipagem de ponta a ponta**: parâmetros de path, bodies e respostas são tipados a partir de cada definição.
- **Menos código**: [`resource()`](../api/resource.md) cria uma API CRUD completa a partir de um `path` e de um `schema`.
- **Um só lugar para o comportamento das requisições**: os métodos de um endpoint base substituem interceptors e a configuração por chamada.
- **Pronto para a store**: os mesmos endpoints e schemas funcionam com [`useSuspense()`](/docs/api/useSuspense) e o
  cache normalizado, quando você decidir adotá-los.

## Migre passo a passo {#steps}

<SiteOnly>

Estes são os passos que o seu agent segue. Faça commit antes de cada um, para poder revisar o diff.


</SiteOnly>

### 1. Instalar {#install}

<PkgTabs pkgs="@data-client/rest" />

### 2. Execute o codemod {#codemod}

Um codemod do [jscodeshift](https://github.com/facebook/jscodeshift) cuida da parte mecânica. Faça commit primeiro e depois execute-o nas
pastas de código-fonte, nunca na raiz do repositório:

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

<DiffEditor caption="Cada chamada do axios vira uma chamada a um endpoint. Os parâmetros do path, `params` e o body viram seus argumentos, e ele resolve para o body, então `.data` desaparece.">

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

O que ele não consegue converter, como interceptors, `timeout`, `isAxiosError()` ou uma função que devolve a resposta do axios
aos seus chamadores, recebe um comentário `// TODO(data-client):` com um link para a seção abaixo que trata do caso. Busque por
`TODO(data-client)` e resolva cada um ao percorrer os próximos passos.

Se o projeto encapsula o axios em uma classe ou função própria e nunca chama `axios.get()` ou `.post()` diretamente, ou só
chama `axios(config)`, o codemod tem pouco a fazer. Pule-o e comece pelo [passo 3](#base-endpoint).

### 3. Mova os interceptors para um endpoint base {#base-endpoint}

Os interceptors e a configuração de instância do axios viram métodos de uma subclasse de `RestEndpoint` que todos os endpoints estendem. O
codemod cria essa classe a partir de `axios.create()`; mova os interceptors para dentro dela.

<DiffEditor caption="O `RestEndpoint` interpreta o JSON por conta própria, então um interceptor que apenas extrai `response.data` não tem mais nada a fazer.">

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

Interceptors de resposta que alteram o corpo, como a conversão de chaves em `snake_case`, pertencem a
[`process()`](../api/RestEndpoint.md#process); veja [snakes to camels](./network-transform.md#snakes-to-camels).

Quando um interceptor de resposta devolvia `response.data`, o `.data` de um chamador lia um campo do corpo, não a resposta do axios,
então mantenha-o. O codemod marca essas chamadas quando o interceptor está no mesmo arquivo; se um
`axios.interceptors.response` global estiver em outro arquivo, verifique o `.data` que ele removeu das chamadas ali.

#### Mensagens de erro do servidor {#server-error-messages}

Bases de código com axios costumam exibir ao usuário `error.response.data.error` ou `.message`. Leia isso do corpo da `Response` uma única vez,
no [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) da classe base, para que os pontos de chamada obtenham a mensagem em
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

#### Abstrações de endpoint existentes {#existing-endpoint-abstractions}

Uma classe de endpoint personalizada que encapsula o axios (digamos, uma com `path`, `method` e um helper `toDynamicUrl()`) pode estender
`RestEndpoint` em vez de ser substituída. Ela mantém seus métodos compatíveis com versões anteriores e ganha
[`url()`](../api/RestEndpoint.md#url), [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit),
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) e [`parseResponse()`](../api/RestEndpoint.md#parseResponse):

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

Passe membros extras como `queryKey` como opções, em vez de usar um construtor personalizado, para que
[`extend()`](../api/RestEndpoint.md#extend) (usado por `resource()`, `hookifyResource()` e `useCancelling()`) continue
funcionando.

#### Autenticação baseada em contexto {#context-based-auth}

Quando os tokens vêm de :react[contexto do React]:vue[`inject()`] (Okta, Auth0) em vez de um armazenamento, `getHeaders()` não consegue
lê-los. Use [`hookifyResource()`](../api/hookifyResource.md) para adicionar os headers por meio de um
:react[hook]:vue[composable]. Veja o
[guia de autenticação](./auth.md) para este e outros padrões.

### 4. Defina entities e resources {#entities}

O codemod cria endpoints sem `schema`. Defina uma [Entity](../api/Entity.md) para cada tipo que a API retorna: seus
campos, os tipos deles e sua chave primária. Substitua as funções CRUD de cada módulo em um mesmo path por um
[`resource()`](../api/resource.md):

<DiffEditor caption="Um `resource()` substitui um módulo de funções CRUD, e `schema` tipa cada resposta.">

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

Experimente o resultado contra uma API de mock:

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

Paths aninhados como `/projects/:projectId/tasks/:taskId` ganham o seu próprio resource. Reserve `new ApiEndpoint()` avulso para
operações que não são CRUD, como busca, ações personalizadas e autenticação.

:::warning

Não defina classes Entity e depois deixe `schema` indefinido nos endpoints: sem `schema`, as respostas perdem seus
tipos, e a store não consegue normalizá-las quando você a adotar.

:::

#### Chaves primárias fora do padrão {#non-standard-primary-keys}

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

#### Tipagem do body {#body-typing}

Tipe o body de endpoints `POST`, `PUT` e `PATCH` avulsos com `body: {} as BodyType`. Não use
`undefined as unknown as BodyType`: o `RestEndpoint` trata [`body`](../api/RestEndpoint.md#body)`: undefined` como ausência de
argumento de body. O [`resource()`](../api/resource.md) tipa os bodies dos seus endpoints automaticamente.

```ts
const createUser = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: {} as { name: string; email: string },
  schema: User,
});
```

#### Convivendo com Zod ou Yup {#coexisting-with-zod-or-yup}

Se a base de código já valida respostas com Zod ou Yup, escolha uma abordagem por tipo:

- **Zod em `process()`** (recomendado): mantenha a validação em tempo de execução fazendo o parse em
  [`process()`](../api/RestEndpoint.md#process) e deixe a Entity cuidar da normalização:

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **Entity substitui o Zod**: mova o formato dos campos para a classe Entity e remova o schema do Zod. Os campos da Entity fornecem
  tipos, não verificações em tempo de execução, então adicione [`static validate()`](../api/Entity.md#validate) para os campos que o servidor possa
  enviar malformados.
- **Somente Zod, sem Entity**: deixe `schema` indefinido e faça o parse manualmente. Faça isso apenas em endpoints que não se beneficiam da
  normalização (tokens de autenticação, respostas pontuais).

### 5. Atualize os pontos de chamada {#call-sites}

Componentes e serviços mantêm o seu próprio carregamento e estado; muda apenas a chamada.

<DiffEditor caption="Os endpoints resolvem para o body interpretado, então `.data` desaparece, e os parâmetros viram um único objeto.">

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

Ler esses endpoints pela store, com [`useSuspense()`](/docs/api/useSuspense) e o cache normalizado, é um
passo separado que você pode dar depois; veja [dependências de dados](/docs/getting-started/data-dependency).

### 6. Migre o tratamento de erros {#error-handling}

<DiffEditor caption="`NetworkError` tem o `status` e a `Response` bruta, no lugar do `error.response` do axios.">

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

Leia a mensagem de erro de um servidor a partir do body uma única vez, no endpoint base; veja
[mensagens de erro do servidor](#server-error-messages).

### 7. Remova o axios {#remove-axios}

Busque o que ainda usa o axios:

| Padrão                                     | Encontra                       |
| ------------------------------------------ | ------------------------------ |
| `TODO\(data-client\)`                      | o que o codemod deixou         |
| `import.*from ['"]axios['"]`               | instruções de import           |
| `axios\.create`                            | criação de instância           |
| `axios\.(get\|post\|put\|patch\|delete)`   | chamadas diretas               |
| `\.interceptors\.(request\|response)\.use` | interceptors                   |
| `isAxiosError`                             | tratamento de erros            |
| `cancelToken\|CancelToken`                 | cancelamento (obsoleto)        |
| `onUploadProgress\|onDownloadProgress`     | callbacks de progresso         |

Migre cada ocorrência com a [referência](#quick-reference) abaixo. Quando não restar nenhuma, desinstale o axios e depois execute o
verificador de tipos e os testes:

```bash
npm uninstall axios
```

## Referência das opções do axios {#quick-reference}

| Axios                                    | @data-client/rest                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `baseURL`                                | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix)                                                                   |
| configuração `headers`                   | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                               |
| `interceptors.request`                   | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) / [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) |
| `interceptors.response`                  | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process)         |
| `transformRequest`                       | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                                                       |
| `transformResponse`                      | [`process()`](../api/RestEndpoint.md#process)                                                                     |
| `isAxiosError` / `error.response`        | [`NetworkError`](#error-handling) com `.status` e `.response`                                                     |
| `cancelToken` / `signal`                 | [`signal`](#cancellation)                                                                                         |
| `timeout`                                | [`AbortSignal.timeout()`](#timeout) em `getRequestInit()`                                                         |
| `responseType: 'blob'` / `'arraybuffer'` | [`content: 'blob'`](#binary-responses) / `'arrayBuffer'`                                                          |
| `params` / `paramsSerializer`            | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](#query-serialization)                |
| `auth: { username, password }`           | [`getHeaders()` com `btoa()`](#basic-auth)                                                                        |
| `validateStatus`                         | [`fetchResponse()` personalizado](#accepting-error-statuses)                                                      |
| `xsrfCookieName` / `xsrfHeaderName`      | [`getHeaders()`](#csrf-headers)                                                                                   |
| `onUploadProgress`                       | [`fetchResponse()` personalizado com XMLHttpRequest](#upload-progress)                                            |

### Cancelamento {#cancellation}

Tanto o `signal` do axios quanto o `CancelToken`, já obsoleto, correspondem a um `signal` de
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

Veja o [guia de abort](./abort.md) para mais padrões.

### Timeout {#timeout}

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

### Respostas binárias {#binary-responses}

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

[`content`](../api/RestEndpoint.md#content) também aceita `'arrayBuffer'` e `'text'`. Veja
[download de arquivo](./network-transform.md#file-download) para disparar um download no navegador.

### Serialização de query {#query-serialization}

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

O axios omite params `null` e `undefined`, mas o `searchToString()` padrão usa
[URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), que os envia como as strings
`"null"` e `"undefined"`; o `skipNulls` acima os descarta. Veja [`searchToString()`](../api/RestEndpoint.md#searchToString).

### Autenticação básica {#basic-auth}

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

### Aceitando status de erro {#accepting-error-statuses}

[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) lança [`NetworkError`](#error-handling) para qualquer status
diferente de `ok`. Sobrescreva-o para mudar o que conta como erro:

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

### Headers CSRF {#csrf-headers}

```ts title="Before"
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});
```

Leia o cookie em [`getHeaders()`](../api/RestEndpoint.md#getHeaders) para requisições que não sejam `GET`. Veja
[Integração com Django](./django.md) para a classe de endpoint completa.

### Progresso de upload {#upload-progress}

O `fetch` não consegue informar o progresso de upload, então use
[XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) dentro de
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse). O campo `onProgress` é passado como uma opção do endpoint, como
qualquer outro membro.

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

## Guias relacionados {#related-guides}

- [Autenticação](./auth.md): padrões de autenticação por token e cookie
- [Abortando o fetch](./abort.md): cancelamento e debouncing
- [Transformando dados no fetch](./network-transform.md): transformações de resposta, renomeação de campos, downloads de arquivos
- [Integração com Django](./django.md): CSRF e autenticação por cookie para o Django
