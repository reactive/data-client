---
title: GQLEndpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import mutationDemo from '@site/src/components/Demo/code/profile-edit';
import CodeEditor from '@site/src/components/Demo/CodeEditor';

Los `GQLEndpoints` son para protocolos basados en [GraphQL](https://graphql.org/).

:::info extends

`GQLEndpoint` extiende [Endpoint](/rest/api/Endpoint)

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

## Ciclo de vida del fetch {#fetch-lifecycle}

GQLEndpoint amplía Endpoint al ofrecer personalizaciones para un método fetch proporcionado.

1. _Preparar el fetch_
   1. url
   1. [getRequestInit()](#getRequestInit)
      - [getQuery()](#getQuery)
      - [getHeaders()](#getHeaders)
1. _Ejecutar el fetch_
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

## Preparar el fetch {#prepare-fetch}

Los miembros funcionan también como opciones (segundo argumento del constructor). Aunque ninguno es obligatorio, los primeros
tienen valores por defecto.

### url: string {#path}

GraphQL usa una sola url para todas las operaciones.

### getRequestInit(body): RequestInit {#getRequestInit}

Prepara el [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) que se usa en el fetch.
Se envía a [fetchResponse](#fetchResponse)

### getQuery(variables): string {#getQuery}

Prepara la consulta (query), que se envía como parte del cuerpo de la petición.

### getHeaders(headers: HeadersInit): HeadersInit {#getHeaders}

Lo llama [getRequestInit](#getRequestInit) para determinar los [encabezados HTTP](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers)

Esto suele ser útil para la [autenticación](../auth)

:::warning

No uses hooks aquí.

:::

## Manejar el fetch {#handle-fetch}

### fetchResponse(input, init): Promise {#fetchResponse}

Realiza la llamada [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

### parseResponse(response): Promise {#parseResponse}

Toma la [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) y la interpreta con .text() o .json()

### process(value, ...args): any {#process}

Aplica cualquier transformación al resultado ya interpretado. Por defecto es la función identidad.

## Ciclos de vida del Endpoint {#endpoint-life-cycles}

### schema: Schema {#schema}

Definición declarativa de cómo [procesar las respuestas](/docs/concepts/normalization)

- [dónde](/docs/concepts/normalization) esperar [Entities](./GQLEntity.md)
- Funciones para deserializar campos

No proporcionar esta opción significa que no se extraerá ninguna entidad.

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

Tiempo de vida personalizado en la caché de los datos del recurso obtenido. Sobrescribirá el valor establecido en NetworkManager.

[Más información sobre el tiempo de caducidad](/docs/concepts/expiry-policy#expiry-time)

### errorExpiryLength?: number {#errorexpirylength}

Tiempo de vida personalizado de los errores de datos del recurso obtenido. Sobrescribirá el valor establecido en NetworkManager.

### errorPolicy?: (error: any) => 'soft' | undefined {#errorpolicy}

'soft' usará datos obsoletos (si existen) en caso de error; undefined o no proporcionar la opción resultará
en un error.

[Más información sobre errorPolicy](/docs/concepts/error-policy)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

### invalidIfStale: boolean {#invalidifstale}

Indica que los datos obsoletos deben considerarse inutilizables y, por tanto, no devolverse desde la caché. Esto significa
que useSuspense() se suspenderá cuando los datos estén obsoletos, aunque ya existan en la caché.

### pollFrequency: number {#pollfrequency}

Frecuencia de sondeo (polling) en milisegundos. Requiere usar [useSubscription()](/docs/api/useSubscription) o
[useLive()](/docs/api/useLive) para tener efecto.

### getOptimisticResponse: (snap, ...args) => fakePayload {#getoptimisticresponse}

Cuando se proporciona, cualquier fetch con este endpoint se comportará como si el valor de retorno `fakePayload`
de esta función fuera una respuesta de red exitosa. Cuando el fetch real se completa (sea cual sea
su resultado, éxito o fallo), la actualización optimista se reemplaza por la respuesta de red real.

## extend(options): Endpoint {#extend}

Se puede usar para personalizar aún más la definición del endpoint

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
