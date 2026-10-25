---
title: TypeScript 类型
---

## Manager {#manager}

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

关于 Manager 的[更多内容](./Manager)。

## NetworkError {#networkerror}

```typescript
interface NetworkError extends Error {
  status: number;
  response?: Response;
}
```

## UnknownError {#unknownerror}

这是 fetch 函数中抛出的各类错误的兜底类型。建议
尽量遵循上面的 `NetworkError` 接口

```typescript
type UnknownError = Error & { status?: unknown; response?: unknown };
```

## State {#state}

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
