---
title: useRetrieve()
---

import GenericsTabs from '@site/src/components/GenericsTabs';

<head>
  <meta name="docsearch:pagerank" content="-5" />
</head>

:::tip

Use [useFetch()](./useFetch.md) instead

:::

<GenericsTabs>

```typescript
function useRetrieve(
  endpoint: ReadEndpoint,
  params: object | null,
): Promise<any> | undefined;
```



```typescript
function useRetrieve<
  Params extends Readonly<object>,
  S extends Schema
>(
  endpoint: ReadEndpoint<(p:Params) => Promise<any>, S>,
  params: Params | null,
): Promise<any> | undefined;
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
  useRetrieve(PostResource.detail(), { id });
  // ...
}
```

### Conditional

```tsx
function MasterPost({ id, doNotFetch }: { id: number, doNotFetch: boolean }) {
  useRetrieve(PostResource.detail(), doNotFetch ? null : { id });
  // ...
}
```

## Useful `Endpoint`s to send

[Resource](/rest/5.2/api/resource#endpoints) provides these built-in:

- detail()
- list()

Feel free to add your own [Endpoint](/rest/api/Endpoint) as well.
