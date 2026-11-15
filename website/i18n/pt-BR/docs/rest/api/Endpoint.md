---
title: Endpoint - Definições de API fortemente tipadas
sidebar_label: Endpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import HooksPlayground from '@site/src/components/HooksPlayground';

# Endpoint

`Endpoint` serve para qualquer função assíncrona (uma que retorna uma Promise).

`Endpoints` definem uma interface padrão fortemente tipada com metadados e ciclos de vida relevantes,
úteis para o Reactive Data Client e outros stores.

Pacote: [@data-client/endpoint](https://www.npmjs.com/package/@data-client/endpoint)

:::tip

Endpoint é uma classe independente de protocolo. Experimente usar os padrões específicos de cada protocolo:
[REST](./RestEndpoint.md), [GraphQL](/graphql/api/GQLEndpoint)
ou [getImage](/docs/guides/img-media#just-images).

:::

<details>
<summary><b>Interface</b></summary>

<Tabs
defaultValue="Interface"
values={[
{ label: 'Interface', value: 'Interface' },
{ label: 'Class', value: 'Class' },
{ label: 'EndpointExtraOptions', value: 'EndpointExtraOptions' },
]}>
<TabItem value="Interface">

```typescript
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): InferReturn<F, S>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}
```

</TabItem>
<TabItem value="Class">

```typescript
class Endpoint<F extends (...args: any) => Promise<any>>
  implements EndpointInterface
{
  constructor(fetchFunction: F, options: EndpointOptions);

  key(...args: Parameters<F>): string;

  readonly sideEffect?: true;

  readonly schema?: Schema;

  fetch: F;

  extend(options: EndpointOptions): Endpoint;
}

export interface EndpointOptions extends EndpointExtraOptions {
  key?: (params: any) => string;
  sideEffect?: true | undefined;
  schema?: Schema;
}
```

</TabItem>
<TabItem value="EndpointExtraOptions">

```typescript
export interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
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
  /** User-land extra data to send */
  readonly extra?: any;
}
```

</TabItem>
</Tabs>

</details>

## Uso {#usage}

`Endpoint` torna funções assíncronas existentes utilizáveis em qualquer contexto do Reactive Data Client, com verificação completa do TypeScript.

<HooksPlayground defaultOpen="n">

```ts title="interface" collapsed
export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}
```

```ts title="api" {12}
import { Endpoint } from '@data-client/rest';
import { Todo } from './interface';

const getTodoOriginal = (id: number): Promise<Todo> =>
  Promise.resolve({
    id,
    title: 'delectus aut autem ' + id,
    completed: false,
    userId: 1,
  });

export const getTodo = new Endpoint(getTodoOriginal);
```

```tsx title="React"
import { useSuspense } from '@data-client/react';
import { getTodo } from './api';

function TodoDetail() {
  const todo = useSuspense(getTodo, 1);
  return <div>{todo.title}</div>;
}
render(<TodoDetail />);
```

</HooksPlayground>

### Compartilhamento de configuração {#configuration-sharing}

Use [Endpoint.extend()](#extend) em vez de `{...getTodo}` (spread)

```ts
const getTodoNormalized = getTodo.extend({ schema: Todo });
const getTodoUpdatingEveryFiveSeconds = getTodo.extend({ pollFrequency: 5000 });
```

### Cancelamento e outros valores que não são chaves {#members-not-args}

Os argumentos são a [key](#key): eles dizem quais dados o store guarda. Mantenha fora deles os valores que não
escolhem os dados, como um [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
ou um cliente de SDK. Como argumentos, toda chamada de hook precisaria de um, e chamadas com e
sem ele recebem keys diferentes, então não compartilham dados. Faça de tal valor um membro e
leia-o de `this` na função de fetch. O [signal](#signal) já está tipado; declare qualquer outro
membro nas opções.

```ts title="getPosts"
import { Endpoint } from '@data-client/endpoint';
import { client } from './client';
import { Post } from './Post';

export const getPosts = new Endpoint(
  // a `function` (not an arrow function) gets the endpoint as `this`
  function ({ page }: { page: number }) {
    return client.getPosts({ page, signal: this.signal });
  },
  { name: 'getPosts', schema: [Post] },
);
```

Defina o membro para uma chamada com [extend()](#extend), para que as outras chamadas mantenham o seu.

```ts
// ctrl is the Controller, from useController() or a router loader
const abort = new AbortController();
ctrl.fetch(getPosts.extend({ signal: abort.signal }), { page: 2 });
```

:::react

O [useCancelling()](/docs/api/useCancelling) faz isso por você e aborta quando os params mudam:

```tsx title="PostList"
import { useCancelling, useSuspense } from '@data-client/react';
import { getPosts } from './getPosts';
import PostItems from './PostItems';

export default function PostList({ page }: { page: number }) {
  const posts = useSuspense(useCancelling(getPosts, { page }), { page });
  return <PostItems posts={posts} />;
}
```

:::

Limites:

- A requisição só para se a função de fetch repassar o signal e o SDK o entregar ao
  `fetch()`.
- Leituras (sem `sideEffect`) com os mesmos params compartilham uma única requisição. Um signal só cancela uma requisição
  que a sua própria chamada iniciou, e isso a cancela para todas as chamadas que a compartilham.
- O Data Client ignora uma rejeição chamada `AbortError`, que é o que o `fetch()` lança. Se o seu SDK
  envolve o abort em outro erro, relance um chamado `AbortError`; caso contrário, ele é armazenado como um
  fetch com falha, e renderizações com esses params o lançam até que ele [expire](#errorexpirylength).
- Abortar uma mutação desfaz sua atualização otimista, mas o servidor pode já tê-la aplicado.

## Ciclo de vida {#lifecycle}

### Sucesso {#success}

import SuccessLifecycle from '../diagrams/\_endpoint_success_lifecycle.mdx';

<SuccessLifecycle/>

### Erro {#error}

import ErrorLifecycle from '../diagrams/\_endpoint_error_lifecycle.mdx';

<ErrorLifecycle/>

## Membros do Endpoint {#endpoint-members}

Os membros também funcionam como opções (segundo argumento do construtor). Embora nenhum seja obrigatório, os primeiros
têm valores padrão.

### key: (params) => string {#key}

Serializa os parâmetros. É usado para construir uma chave de busca em stores globais.

Padrão:

```typescript
`${this.name} ${JSON.stringify(params)}`;
```

Passe valores que não escolhem os dados, como um `AbortSignal`, como [membros](#members-not-args) em vez de
params.

:::warning[Sobrescritas]

Ao sobrescrever `key`, não se esqueça de incluir também um [testKey](#testKey) atualizado se
você pretende usar esse método.

:::

### testKey(key): boolean {#testKey}

Retorna `true` se a [key](#key) (de fetch) fornecida corresponder a este endpoint.

Isso é usado em interceptors de mock com o [&lt;MockResolver /&gt;](/docs/api/MockResolver)

### name: string {#name}

Usado em [key](#key) para distinguir endpoints. Deve ser globalmente único.

O padrão é `this.fetch.name`

:::warning

Isso pode quebrar em builds de produção que alteram nomes de funções.
Isso costuma ser conhecido como [function name mangling](https://terser.org/docs/api-reference#mangle-options).

Nesses casos, você pode sobrescrever `name` ou desativar o mangling de funções.

:::

### signal?: AbortSignal {#signal}

Cancela o fetch. Leia-o como `this.signal` na função de fetch e repasse-o, como
`fetch(url, { signal: this.signal })`. Defina-o para uma chamada com [extend()](#extend):react[, ou
aborte a cada mudança de params com [useCancelling()](/docs/api/useCancelling)]. Veja
[cancelamento](#members-not-args).

### sideEffect: boolean {#sideeffect}

Usado para indicar que o endpoint pode ter efeitos colaterais (não idempotente). Isso o impede
de ser usado com [useSuspense()](/docs/api/useSuspense) ou [useFetch()](/docs/api/useFetch), pois eles podem chamar o
endpoint um número imprevisível de vezes.

### schema: Schema {#schema}

Definição declarativa de como [processar as respostas](./schema)

- [onde](./schema) esperar [Entities](./Entity.md)
- Funções para [desserializar campos](/rest/guides/network-transform#deserializing-fields)

Não informar esta opção significa que nenhuma entity será extraída.

```tsx
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const getUser = new Endpoint(
    ({ id }) => fetch(`/users/${id}`),
    { schema: User }
);
```

import EndpointLifecycle from './_EndpointLifecycle.mdx';

<EndpointLifecycle />

### extend(options): Endpoint {#extend}

Pode ser usado para personalizar ainda mais a definição do endpoint

```typescript
const getUser = new Endpoint(({ id }) => fetch(`/users/${id}`));


const getUserNormalized = getUser.extend({ schema: User });
```

Além dos membros, `fetch` pode ser enviado para substituir a função de fetch.

## Exemplos {#examples}

<Tabs
defaultValue="Basic"
values={[
{ label: 'Basic', value: 'Basic' },
{ label: 'With Schema', value: 'With Schema' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Basic">

```typescript
import { Endpoint } from '@data-client/endpoint';

const UserDetail = new Endpoint(
  ({ id }) => fetch(`/users/${id}`).then(res => res.json())
);
```

</TabItem>
<TabItem value="With Schema">

```typescript
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const UserDetail = new Endpoint(
  ({ id }) => fetch(`/users/${id}`).then(res => res.json()),
  { schema: User }
);
```

</TabItem>
<TabItem value="List">

```typescript
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const UserList = new Endpoint(
  () => fetch(`/users/`).then(res => res.json()),
  { schema: [User] }
);
```

</TabItem>
</Tabs>

<Tabs
defaultValue="React"
values={[
{ label: 'React', value: 'React' },
{ label: 'JS/Node Schema', value: 'JS/Node' },
]}>
<TabItem value="React">

```tsx
import { useSuspense, useController } from '@data-client/react';
import { UserDetail } from './api/User';
import UserForm from './UserForm';

function UserProfile({ id }: { id: string }) {
  const user = useSuspense(UserDetail, { id });
  const ctrl = useController();

  return <UserForm user={user} onSubmit={() => ctrl.fetch(UserDetail)} />;
}
```

</TabItem>
<TabItem value="JS/Node">

```typescript
const user = await UserDetail({ id: '5' });
console.log(user);
```

</TabItem>
</Tabs>

### Adicionais {#additional}

- [Paginação](../guides/pagination.md)
- [Mock de endpoints não finalizados](../guides/mocking-unfinished.md)
- [Atualizações otimistas](../guides/optimistic-updates.md)

## Motivação {#motivation}

Existe uma distinção entre

- O que é uma API de rede
  - Como fazer uma requisição, quais campos esperar na resposta, etc.
- Como ela é usada
  - Vincular dados, polling, disparar fetch imperativo, etc.

Por isso, há muitos benefícios em criar uma separação clara de responsabilidades entre
esses dois conceitos.

Com os `TypeScript Standard Endpoints`, definimos um padrão para declarar em
TypeScript a definição de uma API de rede.

- Permite que autores de APIs publiquem pacotes npm contendo as interfaces de suas APIs
- As definições podem ser consumidas por qualquer biblioteca compatível, facilitando o consumo entre bibliotecas como Vue, React e Angular
- Escrever pipelines de geração de código fica muito mais fácil, pois a saída é mínima
- Desenvolvedores de produto podem usar as definições em diversos contextos nos quais os comportamentos variam
- Desenvolvedores de produto podem compartilhar código facilmente entre plataformas com necessidades de comportamento distintas, como React Native e React Web

### O que há em um Endpoint {#whats-in-an-endpoint}

- Uma função que resolve os resultados
- Uma função para armazenar esses resultados de forma única
- Opcional: informações sobre como armazenar os dados em um cache normalizado
- Opcional: se a requisição pode ter efeitos colaterais - para evitar chamadas repetidas
