---
title: Fetching Media
id: binary-fetches
original_id: binary-fetches
---

After setting up Rest Hooks for structured data fetching, you might want to incorporate
some media fetches as well to take advantage of suspense and concurrent mode support.

[Resource](../api/Resource) and [Entity](../api/Entity) should not be used in this case, since they both represent
string -> value map structures. Instead, we'll define our own simple [FetchShape](../api/FetchShape)
with a schema set to null, but with a type including what we expect in the response.

Schemas with literal types like null simply pass through the response, but their value is
used to construct responses when the data does not exist yet (like in [useCache](../api/useCache))


```typescript
export const photoShape = {
  type: 'read' as const,
  schema: null as ArrayBuffer | null,
  getFetchKey({ userId }: { userId: string }) {
    return `/users/${userId}/photo`;
  },
  fetch: async ({ userId }: { userId: string }) => {
    const response = await fetch(`/users/${userId}/photo`);
    const photoArrayBuffer = await response.arrayBuffer();

    return photoArrayBuffer;
  },
};
```

```tsx
// photo is typed as null | ArrayBuffer, but should be an ArrayBuffer
const photo = useResource(photoShape, { userId });
```

```tsx
// photo will be null if the fetch hasn't completed
// photo will be ArrayBuffer if the fetch has completed
const photo = useCache(photoShape, { userId });
```
