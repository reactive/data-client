---
title: 'Fixture 与 Interceptor：用于测试和 story 的声明式数据 mock'
sidebar_label: Fixture 与 Interceptor
description: Fixture 与 Interceptor 无需对 fetch 行为打猴子补丁，即可实现通用的数据 mock。
---

import GenericsTabs from '@site/src/components/GenericsTabs';

# Fixture 与 Interceptor

Fixture 与 Interceptor 无需对 fetch 行为打猴子补丁，即可实现通用的数据 mock。
Fixture 为特定的 endpoint 参数组合定义静态响应，因此
可以用在 [mockInitialState()](./mockInitialState.md) 这样的静态场景中。
Interceptor 则是匹配某种 fetch 模式并运行的函数，因此只能用于
:react[[MockResolver](./MockResolver.md)]:vue[`MockPlugin`] 这样的动态响应场景。

## SuccessFixture {#successfixture}

表示一个成功的响应

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

表示一个失败/出错的响应

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

Interceptor 会根据其 [`testKey()`](/rest/api/RestEndpoint#testKey) 方法来匹配请求，然后
通过 `response()` 方法动态计算响应。

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

## 参数 {#arguments}

### endpoint {#endpoint}

要匹配的 endpoint。

### args {#args}

（仅限 fixture）要匹配的参数。

### response(...args) {#response}

决定这个 mock 的响应内容。如果是函数，则会运行它。

运行函数的过程被称为“坍缩”（collapsing），名称借用自[量子力学](https://www.wondriumdaily.com/copenhagen-interpretation-of-quantum-mechanics/)中的机制

`this` 可用于存储模拟的服务端数据。它通过 :react[[getInitialInterceptorData](./MockResolver.md#getinitialinterceptordata)]:vue[[getInitialInterceptorData](../guides/unit-testing-components.md#options)] 初始化。使用它时切记不要用箭头函数，因为箭头函数不允许绑定 `this`。

### fetchResponse(input, init) {#fetchResponse}

提供该方法时，会通过（调用 [.extend](/rest/api/RestEndpoint#extend)）覆盖
[fetchResponse](/rest/api/RestEndpoint#fetchResponse) 的方式构造一个供使用的 response() 方法。

只需返回预期的值，而不是真正的 HTTP [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)。

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

当你想使用自定义 [getRequestInit()](/rest/api/RestEndpoint#getRequestInit) 中生成的 body 时，这会很有用

### delay: number {#delay}

resolve promise 之前要等待的毫秒数。在模拟竞态条件时
这会很有用。

如果传入的是函数，则使用其返回值作为毫秒数。

### delayCollapse: boolean {#delayCollapse}

`true`：在 [delay](#delay) 时间之后运行 response()

`false`：立即运行 response()，然后在 [delay](#delay) 时间之后 resolve

这可以用于模拟服务器处理延迟。
