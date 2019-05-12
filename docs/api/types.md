---
title: TypeScript Types
---

## RequestShape

```typescript
/** Defines the shape of a network request */
export interface RequestShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(url: string, body: Body): Promise<any>;
  getUrl(params: Params): string;
  readonly schema: S;
  readonly options?: RequestOptions;
}

/** Purges a value from the server */
export interface DeleteShape<
  S extends schemas.Entity,
  Params extends Readonly<object> = Readonly<object>
> extends RequestShape<S, Params, any> {
  readonly type: 'delete';
  readonly schema: S;
}

/** To change values on the server */
export interface MutateShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> extends RequestShape<S, Params, Body> {
  readonly type: 'mutate';
}

/** For retrieval requests */
export interface ReadShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> extends RequestShape<S, Params, Body> {
  readonly type: 'read';
}
```

```typescript

export type State<T> = State<T>;
export type Schema<T = any> = Schema<T>;
export type SchemaArray<T> = SchemaArray<T>;
export type SchemaBase<T> = SchemaBase<T>;
export type SchemaOf<T> = SchemaOf<T>;
export type AbstractInstanceType<T> = AbstractInstanceType<T>;
export type RequestOptions = RequestOptions;
export type Method = Method;

export type NetworkError = NetworkError;
export type Request = RequestType;
export type FetchAction = FetchAction;
export type ReceiveAction = ReceiveAction;
```
