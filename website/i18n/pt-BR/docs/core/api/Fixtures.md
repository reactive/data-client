---
title: 'Fixtures e Interceptors: simulação declarativa de dados para testes e stories'
sidebar_label: Fixtures e Interceptors
description: Fixtures e Interceptors permitem simular dados de forma universal, sem a necessidade de aplicar monkeypatch ao comportamento do fetch.
---

import GenericsTabs from '@site/src/components/GenericsTabs';

# Fixtures e Interceptors

Fixtures e Interceptors permitem simular dados de forma universal, sem a necessidade de aplicar monkeypatch
ao comportamento do fetch. Fixtures definem respostas estáticas para combinações específicas de argumentos do endpoint. Isso
permite usá-los em contextos estáticos como [mockInitialState()](./mockInitialState.md).
Interceptors são funções executadas que correspondem a um padrão de fetch. Isso os restringe a serem usados apenas
em contextos de resposta dinâmica como :react[[MockResolver](./MockResolver.md)]:vue[`MockPlugin`].

## SuccessFixture {#successfixture}

Representa uma resposta bem-sucedida

<GenericsTabs>

```ts
export interface SuccessFixture {
  endpoint;
  args;
  response;
  error?;
  delay?;
}
```

```ts
export interface SuccessFixture<
  E extends EndpointInterface = EndpointInterface,
> {
  readonly endpoint: E;
  readonly args: Readonly<Parameters<E>>;
  readonly response:
    | ResolveType<E>
    | ((...args: Parameters<E>) => ResolveType<E>);
  readonly error?: false;
  /** Number of milliseconds to wait before resolving */
  readonly delay?: number;
}
```

</GenericsTabs>

```ts
const countFixture = {
  endpoint: new RestEndpoint({ path: '/api/count' }),
  args: [],
  response: { count: 0 },
};
```

## ErrorFixtures {#errorfixtures}

Representa uma resposta com falha/erro

<GenericsTabs>

```ts
export interface ErrorFixture {
  endpoint;
  args;
  response;
  error;
  delay?;
}
```

```ts
export interface ErrorFixture<E extends EndpointInterface = EndpointInterface> {
  readonly endpoint: E;
  readonly args: Readonly<Parameters<E>>;
  readonly response: any;
  readonly error: true;
  /** Number of milliseconds to wait before resolving */
  readonly delay?: number;
}
```

</GenericsTabs>

```ts
const countErrorFixture = {
  endpoint: new RestEndpoint({ path: '/api/count' }),
  args: [],
  response: { message: 'Not found', status: 404 },
  error: true,
};
```

## Interceptor {#interceptor}

Interceptors correspondem a uma requisição com base no seu método [`testKey()`](/rest/api/RestEndpoint#testKey) e, em seguida,
calculam a resposta dinamicamente usando o método `response()`.

<GenericsTabs>

```ts
interface ResponseInterceptor {
  endpoint;
  response(...args);
  delay?;
  delayCollapse?;
}

interface FetchInterceptor {
  endpoint;
  fetchResponse(input, init);
  delay?;
  delayCollapse?;
}

type Interceptor = ResponseInterceptor | FetchInterceptor;
```


```ts
interface ResponseInterceptor<
  T = any,
  E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
  } = EndpointInterface & { testKey(key: string): boolean },
> {
  readonly endpoint: E;
  response(this: T, ...args: Parameters<E>): ResolveType<E>;
  /** Number of milliseconds (or function that returns) to wait before resolving */
  readonly delay?: number | ((...args: Parameters<E>) => number);
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}

interface FetchInterceptor<
  T = any,
  E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
  } = EndpointInterface & {
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
  },
> {
  readonly endpoint: E;
  fetchResponse(this: T, input: RequestInfo, init: RequestInit): ResolveType<E>;
  /** Number of milliseconds (or function that returns) to wait before resolving */
  readonly delay?: number | ((...args: Parameters<E>) => number);
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}

type Interceptor<T, E> = ResponseInterceptor<T, E> | FetchInterceptor<T, E>;
```

</GenericsTabs>

```ts
const incrementInterceptor = {
  endpoint: new RestEndpoint({
    path: '/api/count/increment',
    method: 'POST',
    body: undefined,
  }),
  response() {
    return {
      count: (this.count = this.count + 1),
    };
  },
  delay: () => 500 + Math.random() * 4500,
};
```

## Argumentos {#arguments}

### endpoint {#endpoint}

O endpoint a ser correspondido.

### args {#args}

(Somente Fixtures) Os args a serem correspondidos.

### response(...args) {#response}

Determina qual deve ser a resposta deste mock. Se for uma função, ela será executada.

A execução da função é chamada de 'colapso' (collapsing), em referência ao mecanismo da [Mecânica Quântica](https://www.wondriumdaily.com/copenhagen-interpretation-of-quantum-mechanics/)

`this` pode ser usado para armazenar dados simulados do lado do servidor. Ele é inicializado usando :react[[getInitialInterceptorData](./MockResolver.md#getinitialinterceptordata)]:vue[[getInitialInterceptorData](../guides/unit-testing-components.md#options)]. É importante não usar arrow functions ao usar this, pois elas não permitem o vínculo de `this`.

### fetchResponse(input, init) {#fetchResponse}

Quando fornecido, constrói um método response() a ser usado, com base na sobrescrita
(chamando [.extend](/rest/api/RestEndpoint#extend)) de [fetchResponse](/rest/api/RestEndpoint#fetchResponse).

Basta retornar o valor esperado, em vez de uma [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) HTTP real.

```ts
const incrementInterceptor = {
  endpoint: new RestEndpoint({
    path: '/api/count/increment',
    method: 'POST',
    body: undefined,
  }),
  fetchResponse(input, init) {
    return {
      count: (this.count = this.count + 1),
      updatedAt: JSON.parse(init.body).updatedAt,
    };
  },
};
```

Isso pode ser útil quando você quer usar o body gerado em um [getRequestInit()](/rest/api/RestEndpoint#getRequestInit) personalizado

### delay: number {#delay}

É o número de milissegundos a aguardar antes de resolver a promise. Pode ser útil
ao simular condições de corrida.

Quando uma função é enviada, seu valor de retorno é usado como o número de milissegundos.

### delayCollapse: boolean {#delayCollapse}

`true`: Executa response() após o tempo de [delay](#delay)

`false`: Executa response() imediatamente e a resolve após o tempo de [delay](#delay)

Isso pode ser útil para simular atrasos de processamento no servidor.
