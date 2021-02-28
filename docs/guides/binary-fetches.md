---
title: Fetching Media
---

After setting up Rest Hooks for structured data fetching, you might want to incorporate
some media fetches as well to take advantage of suspense and [concurrent mode support](https://resthooks.io/docs/guides/render-as-you-fetch).

## Storing buffers

[Resource](../api/Resource) and [Entity](../api/Entity) should not be used in this case, since they both represent
string -> value map structures. Instead, we'll define our own simple [Endpoint](../api/Endpoint).

```typescript
import { Endpoint } from 'rest-hooks';

export const getPhoto = new Endpoint(async ({ userId }: { userId: string }) => {
  const response = await fetch(`/users/${userId}/photo`);
  const photoArrayBuffer = await response.arrayBuffer();

  return photoArrayBuffer;
});
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

## Just Images

In many cases, it would be useful to suspend loading of expensive items like
images using suspense. This becomes especially powerful [with the fetch as you render](https://resthooks.io/docs/guides/render-as-you-fetch) pattern in concurrent mode.

Here, we build an endpoint for images using [Image](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image)

Here, Rest Hooks is simply used to track resource loading - only storing the `src` in its store.

## Installation


<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add @rest-hooks/img
```
<!--npm-->
```bash
npm install  @rest-hooks/img
```
<!--END_DOCUSAURUS_CODE_TABS-->

## Usage

<details open><summary><b>Profile.tsx</b></summary>

```tsx
import React, { ImgHTMLAttributes } from 'react';
import { useResource } from 'rest-hooks';
import { Img } from '@rest-hooks/img';

export default function Profile({ username }: { username: string }) {
  const user = useResource(UseResource.detail(), { username });
  return (
    <div>
      <Img
        src={user.img}
        alt="React Logo"
        style={{ height: '32px', width: '32px' }}
      />
      <h2>{user.fullName}</h2>
    </div>
  );
}
```

</details>

#### Prefetching

Note this will cascade the requests, waiting for user to resolve before
the image request can start. If the image url is deterministic based on the same parameters, we can start that request at the same time as the user request:

<details open><summary><b>Profile.tsx</b></summary>

```tsx
import React, { ImgHTMLAttributes } from 'react';
import { useResource, useRetrieve } from 'rest-hooks';
import { Img, getImage } from '@rest-hooks/img';

export default function Profile({ username }: { username: string }) {
  const imageSrc = `/profile_images/${username}}`;
  useRetrieve(getImage, { src: imageSrc });
  const user = useResource(UseResource.detail(), { username });
  return (
    <div>
      <Img
        src={imageSrc}
        alt="React Logo"
        style={{ height: '32px', width: '32px' }}
      />
      <h2>{user.fullName}</h2>
    </div>
  );
}
```

</details>


When using the [fetch as you render](../guides/render-as-you-fetch) pattern in concurrent mode, [useFetcher](../api/useFetcher) with the `getImage`
[Endpoint](../api/Endpoint) to preload the image.
