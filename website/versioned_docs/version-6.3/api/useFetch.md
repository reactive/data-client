---
title: useFetch()
---

import GenericsTabs from '@site/src/components/GenericsTabs';

<GenericsTabs>

```typescript
function useFetch(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Promise<any> | undefined;
```

```typescript
function useFetch<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): ReturnType<E>;
```

</GenericsTabs>

Great for retrieving resources optimistically before they are needed.

This can be useful for ensuring resources early in a render tree before they are needed.

- Triggers fetch:
  - On first-render
    - or parameters change
    - or required entity is deleted
    - or imperative [invalidation](./Controller.md#invalidate) triggered
  - and When not in cache or result is considered stale
  - and When no identical requests are in flight
  - and when params are not null
- [On Error (404, 500, etc)](https://www.restapitutorial.com/httpstatuscodes.html):
  - Returned promise will reject
- On fetch returns a promise else undefined.

## Example

### Simple

```tsx
function MasterPost({ id }: { id: number }) {
  useFetch(PostResource.detail(), { id });
  // ...
}
```

### Conditional

```tsx
function MasterPost({ id, doNotFetch }: { id: number; doNotFetch: boolean }) {
  useFetch(PostResource.detail(), doNotFetch ? null : { id });
  // ...
}
```

## Useful `Endpoint`s to send

[Resource](/rest/api/resource#provided-and-overridable-methods) provides these built-in:

- detail()
- list()

Feel free to add your own [Endpoint](/rest/api/Endpoint) as well.
