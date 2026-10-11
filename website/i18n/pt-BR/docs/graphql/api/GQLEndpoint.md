---
title: GQLEndpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import mutationDemo from '@site/src/components/Demo/code/profile-edit';
import CodeEditor from '@site/src/components/Demo/CodeEditor';

`GQLEndpoints` são para protocolos baseados em [GraphQL](https://graphql.org/).

:::info extends

`GQLEndpoint` estende [Endpoint](/rest/api/Endpoint)

:::

## Uso {#usage}

<CodeEditor codes={[mutationDemo[1]]} defaultValue="graphql" />

## query(gql, schema) {#query}

```ts
import { GQLEndpoint } from '@data-client/graphql';
import User from 'schema/User';

const gql = new GQLEndpoint('/');

export const getUser = gql.query(
  (v: { name: string }) => `query getUser($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }`,
  { user: User },
);

getUser({ name: 'bob' });
```

## mutate(gql, schema) {#mutate}

```ts
import { GQLEndpoint } from '@data-client/graphql';
import User from 'schema/User';

const gql = new GQLEndpoint('/');

export const updateUser = gql.mutate(
  (v: Partial<User>) => `query updateUser($user: User!) {
    user(name: $user) {
      id
      name
      email
    }
  }`,
  { user: User },
);

updateUser({ id: '5', name: 'bob', email: 'bob@bob.com' });
```

## Ciclo de vida do fetch {#fetch-lifecycle}

O GQLEndpoint acrescenta ao Endpoint personalizações para um método de fetch fornecido.

1. _Preparar o fetch_
   1. url
   1. [getRequestInit()](#getRequestInit)
      - [getQuery()](#getQuery)
      - [getHeaders()](#getHeaders)
1. _Executar o fetch_
   1. [fetchResponse()](#fetchResponse)
   1. [parseResponse()](#parseResponse)
   1. [process()](#process)

```ts title="fetch implementation for GQLEndpoint"
async function fetch(variables) {
  return this.fetchResponse(
    this.url,
    this.getRequestInit(variables),
  ).then(res => this.process(res, variables));
}
```

## Preparar o fetch {#prepare-fetch}

Os membros também funcionam como opções (segundo argumento do construtor). Embora nenhum seja obrigatório, os primeiros
têm valores padrão.

### url: string {#path}

O GraphQL usa uma única url para todas as operações.

### getRequestInit(body): RequestInit {#getRequestInit}

Prepara o [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) usado no fetch.
Ele é enviado para [fetchResponse](#fetchResponse)

### getQuery(variables): string {#getQuery}

Prepara a query, que será enviada como parte do corpo da requisição.

### getHeaders(headers: HeadersInit): HeadersInit {#getHeaders}

Chamado por [getRequestInit](#getRequestInit) para determinar os [Headers HTTP](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers)

Isso costuma ser útil para [autenticação](../auth)

:::warning

Não use hooks aqui.

:::

## Tratar o fetch {#handle-fetch}

### fetchResponse(input, init): Promise {#fetchResponse}

Executa a chamada de [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

### parseResponse(response): Promise {#parseResponse}

Recebe a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) e faz o parse via .text() ou .json()

### process(value, ...args): any {#process}

Aplica quaisquer transformações ao resultado do parse. O padrão é a função identidade.

## Ciclos de vida do Endpoint {#endpoint-life-cycles}

### schema: Schema {#schema}

Definição declarativa de como [processar as respostas](/docs/concepts/normalization)

- [onde](/docs/concepts/normalization) esperar [Entities](./GQLEntity.md)
- Funções para desserializar campos

Não informar esta opção significa que nenhuma entity será extraída.

```tsx
import { GQLEntity, GQLEndpoint } from '@data-client/graphql';
const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');

class User extends GQLEntity {
  username = '';
}

export const getUser = gql.query(
  (v: { name: string }) => `query GetUser($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }`,
  { user: User },
);
```

### dataExpiryLength?: number {#dataexpirylength}

Tempo de vida personalizado, no cache, dos dados do recurso buscado. Substitui o valor definido no NetworkManager.

[Saiba mais sobre o tempo de expiração](/docs/concepts/expiry-policy#expiry-time)

### errorExpiryLength?: number {#errorexpirylength}

Tempo de vida personalizado dos erros de dados do recurso buscado. Substitui o valor definido no NetworkManager.

### errorPolicy?: (error: any) => 'soft' | undefined {#errorpolicy}

'soft' usará dados desatualizados (se existirem) em caso de erro; undefined, ou não informar a opção, resultará
em erro.

[Saiba mais sobre errorPolicy](/docs/concepts/error-policy)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

### invalidIfStale: boolean {#invalidifstale}

Indica que dados desatualizados devem ser considerados inutilizáveis e, portanto, não ser retornados do cache. Isso significa
que useSuspense() vai suspender quando os dados estiverem desatualizados, mesmo que já existam no cache.

### pollFrequency: number {#pollfrequency}

Frequência, em milissegundos, do polling. Requer o uso de [useSubscription()](/docs/api/useSubscription) ou
[useLive()](/docs/api/useLive) para ter efeito.

### getOptimisticResponse: (snap, ...args) => fakePayload {#getoptimisticresponse}

Quando informado, qualquer fetch com este endpoint se comportará como se o valor de retorno `fakePayload`
desta função fosse uma resposta de rede bem-sucedida. Quando o fetch real for concluído (com falha
ou com sucesso), a atualização otimista será substituída pela resposta real da rede.

## extend(options): Endpoint {#extend}

Pode ser usado para personalizar ainda mais a definição do endpoint

```typescript
const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');

const authGQL = gql.extend({
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  },
});
```
