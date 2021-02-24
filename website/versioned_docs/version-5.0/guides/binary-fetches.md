---
title: Fetching Media
id: version-5.0-binary-fetches
original_id: binary-fetches
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

<details open><summary><b>endpoint.ts</b></summary>

```typescript
export const getImage = new Endpoint(
  async function ({ src }: { src: string }) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        resolve(src);
      };
      img.onerror = error => {
        console.warn(`Failed to load ${src}: ${error}`);
        // in case we fail to load we actually don't want to error out but
        // let the browser display the normal image fallback
        resolve(src);
      };
      img.src = src;
    });
  },
  {
    key({ src }: { src: string }) {
      return `GET ${src}`;
    },
    schema: '',
  },
);
```

</details>

<details open><summary><b>Img.tsx</b></summary>

```tsx
import React, { ImgHTMLAttributes } from 'react';
import { useResource } from 'rest-hooks';

import { getImage } from './endpoint';

export default function Img(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { src } = props;
  useResource(getImage, src ? { src } : null);
  return <img alt={props.alt} {...props} />;
}
```

</details>

<details open><summary><b>Profile.tsx</b></summary>

```tsx
import React, { ImgHTMLAttributes } from 'react';
import { useResource } from 'rest-hooks';

import { Img } from './Img';

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

Note this will cascade the requests, waiting for user to resolve before
the image request can start. If the image url is deterministic based on the same parameters,
we can start that request at the same time as the user request:

<details open><summary><b>Profile.tsx</b></summary>

```tsx
import React, { ImgHTMLAttributes } from 'react';
import { useResource, useRetrieve } from 'rest-hooks';

import { getImage } from './endpoint';
import { Img } from './Img';

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
