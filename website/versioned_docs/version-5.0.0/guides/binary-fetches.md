---
title: Fetching Media
id: version-5.0.0-binary-fetches
original_id: binary-fetches
---

After setting up Rest Hooks for structured data fetching, you might want to incorporate
some media fetches as well to take advantage of suspense and concurrent mode support.

[Resource](../api/Resource) and [Entity](../api/Entity) should not be used in this case, since they both represent
string -> value map structures. Instead, we'll define our own simple [Endpoint](../api/Endpoint).


```typescript
import { Endpoint } from 'rest-hooks';

export const getPhoto = new Endpoint(
  async ({ userId }: { userId: string }) => {
    const response = await fetch(`/users/${userId}/photo`);
    const photoArrayBuffer = await response.arrayBuffer();

    return photoArrayBuffer;
  }
);
```

<!--DOCUSAURUS_CODE_TABS-->
<!--useResource-->

```tsx
// photo is typed as ArrayBuffer
const photo = useResource(getPhoto, { userId });
```

<!--useCache-->
```tsx
// photo will be undefined if the fetch hasn't completed
// photo will be ArrayBuffer if the fetch has completed
const photo = useCache(getPhoto, { userId });
```

<!--JS/Node-->
```tsx
// photo is typed as ArrayBuffer
const photo = await getPhoto({ userId });
```
<!--END_DOCUSAURUS_CODE_TABS-->
