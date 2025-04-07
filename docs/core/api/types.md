---
title: TypeScript Types
---

## Manager

```typescript
interface Manager<Actions = ActionTypes> {
  middleware: Middleware<Actions>;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

```typescript
type Middleware<Actions = any> = <C extends Controller<Actions>>(
  controller: C,
) => (next: C['dispatch']) => C['dispatch'];
```

[More](./Manager) about manager.

## NetworkError

```typescript
interface NetworkError extends Error {
  status: number;
  response?: Response;
}
```

## UnknownError

This is a catch-all for errors thrown in fetch functions. It is recommended
to try to conform to the `NetworkError` interface above

```typescript
type UnknownError = Error & { status?: unknown; response?: unknown };
```

## State

```typescript
interface State<T> {
  readonly entities: {
    readonly [entityKey: string]: { readonly [pk: string]: T } | undefined;
  };
  readonly indexes: NormalizedIndex;
  readonly results: { readonly [key: string]: unknown | PK[] | PK | undefined };
  readonly meta: {
    readonly [key: string]: {
      readonly date: number;
      readonly error?: ErrorTypes;
      readonly expiresAt: number;
      readonly prevExpiresAt?: number;
      readonly invalidated?: boolean;
      readonly errorPolicy?: 'hard' | 'soft' | undefined;
    };
  };
  readonly entitiesMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number;
      };
    };
  };
  readonly optimistic: (
    | SetAction
    | OptimisticAction
  )[];
  readonly lastReset: number;
}
```
