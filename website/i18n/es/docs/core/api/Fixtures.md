---
title: 'Fixtures e interceptors: simulación declarativa de datos para pruebas y stories'
sidebar_label: Fixtures e interceptors
description: Los fixtures y los interceptors permiten simular datos de forma universal, sin necesidad de aplicar monkeypatching al comportamiento de fetch.
---

import GenericsTabs from '@site/src/components/GenericsTabs';

# Fixtures e interceptors

Los fixtures y los interceptors permiten simular datos de forma universal, sin necesidad de aplicar monkeypatching
al comportamiento de fetch. Los fixtures definen respuestas estáticas para combinaciones específicas de argumentos de un endpoint. Esto
permite usarlos en contextos estáticos como [mockInitialState()](./mockInitialState.md).
Los interceptors son funciones que se ejecutan y coinciden con un patrón de fetch. Esto los limita a usarse únicamente
en contextos de respuesta dinámica como :react[[MockResolver](./MockResolver.md)]:vue[`MockPlugin`].

## SuccessFixture {#successfixture}

Representa una respuesta exitosa

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

Representa una respuesta fallida o con error

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

Los interceptors coinciden con una petición según su método [`testKey()`](/rest/api/RestEndpoint#testKey) y luego
calculan la respuesta de forma dinámica con el método `response()`.

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

El endpoint con el que debe coincidir.

### args {#args}

(Solo fixtures) Los argumentos con los que debe coincidir.

### response(...args) {#response}

Determina cuál debe ser la respuesta de este mock. Si es una función, se ejecutará.

Ejecutar la función se llama 'colapsar', por el mecanismo de la [mecánica cuántica](https://www.wondriumdaily.com/copenhagen-interpretation-of-quantum-mechanics/)

`this` se puede usar para almacenar datos simulados del lado del servidor. Se inicializa con :react[[getInitialInterceptorData](./MockResolver.md#getinitialinterceptordata)]:vue[[getInitialInterceptorData](../guides/unit-testing-components.md#options)]. Es importante no usar funciones flecha al usar this, ya que no permiten el enlace de `this`.

### fetchResponse(input, init) {#fetchResponse}

Cuando se proporciona, construirá un método response() que se usará sobrescribiendo
(mediante [.extend](/rest/api/RestEndpoint#extend)) [fetchResponse](/rest/api/RestEndpoint#fetchResponse).

Simplemente devuelve el valor esperado, en lugar de una [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) HTTP real.

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

Esto puede ser útil cuando quieres usar el body generado en un [getRequestInit()](/rest/api/RestEndpoint#getRequestInit) personalizado

### delay: number {#delay}

Es el número de milisegundos que se espera antes de resolver la promesa. Puede ser útil
para simular condiciones de carrera.

Cuando se envía una función, su valor de retorno se usa como el número de milisegundos.

### delayCollapse: boolean {#delayCollapse}

`true`: Ejecuta response() después del tiempo de [delay](#delay)

`false`: Ejecuta response() de inmediato y luego lo resuelve después del tiempo de [delay](#delay)

Puede ser útil para simular demoras de procesamiento del servidor.
