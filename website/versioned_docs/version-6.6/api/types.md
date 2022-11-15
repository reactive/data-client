---
title: TypeScript Types
---

## @rest-hooks/core

### Manager

```typescript
interface Manager {
  getMiddleware(): Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

[More](./Manager)

### NetworkError

```typescript
interface NetworkError extends Error {
  status: number;
  response?: Response;
}
```

### UnknownError

This is a catch-all for errors thrown in fetch functions. It is recommended
to try to conform to the `NetworkError` interface above

```typescript
type UnknownError = Error & { status?: unknown; response?: unknown };
```

## @rest-hooks/endpoint

### EndpointInterface

The bare requirements for an endpoint-type. This is useful
for typing function parameters (like hooks), as it is accepting of any correct
implementation.

```typescript
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined
> extends EndpointExtraOptions {
  (...args: Parameters<F>): InferReturn<F, S>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}
```

e.g.,

```typescript
function useCache<E extends EndpointInterface>(
  endpoint: E,
  params: Parameters<E>[0],
);
```

### EndpointInstance

An instance of the [Endpoint](/rest/api/Endpoint) class.

```typescript
interface EndpointInstance<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined
>;
```

This is useful to specify types explicitly, instead of implicitly in construction.
Being explicit reduces TypeScript computational overhead when inferring types, which
is sometimes necessary to avoid tripping the recursion depth limit. This is one of the reasons why
there is an [eslint rule to explicitly specify return types of methods/functions](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-function-return-type.md).

```typescript
const userDetail: EndpointInstance<FetchFunction<{
  id: string;
}>> = new Endpoint(({ id }) => fetch(`/users/${id}`));

class User extends Entity {
  static detail<T extends User>(
    this: T,
  ): EndpointInstance<
    FetchFunction<{
      id: string;
    }>,
    T,
    undefined
  > {
    return new Endpoint(({ id }) => fetch(`/users/${id}`), { schema: this });
  }

  /** Expected Body payload is a subset of the properties of User
  *  Expected Response is all the properties of User
  */
  static update<T extends User>(
    this: T,
  ): EndpointInstance<
    FetchFunction<
      {
        id: string;
      },
      Partial<T>,
      // return value is plain object - this is an easy way to extract public members from this class' interface
      Omit<T, never>
    >,
    T,
    true
  > {
    return new Endpoint(({ id }) => fetch(`/users/${id}`, { method: 'PUT' }), {
      schema: this,
    });
  }
}
```

### FetchFunction

Represents a function that does actual fetch. Convenient type to specify
only part of the function's type.

```typescript
export type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;
```

Providing a function type that returns a Promise also works.

## @rest-hooks/rest

```typescript
export interface RestGenerics {
  readonly path: string;
  readonly schema?: Schema | undefined;
  readonly method?: string;
  readonly body?: any;
}

export type GetEndpoint<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
> = RestTypeNoBody<UrlParams, S, undefined>;

export type MutateEndpoint<
  UrlParams = any,
  Body extends BodyInit | Record<string, any> = any,
  S extends Schema | undefined = Schema | undefined,
> = RestTypeWithBody<UrlParams, S, true, Body>;
```

