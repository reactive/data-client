---
title: React 18 Suspense with Images and other Media
sidebar_label: Images and other Media
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Images and other Media

After setting up Reactive Data Client for structured data fetching, you might want to incorporate
some media fetches as well to take advantage of suspense and [concurrent mode support](/docs/guides/render-as-you-fetch).

## Storing ArrayBuffer

[Resource](/rest/api/createResource) and [Entity](/rest/api/Entity) should not be used in this case, since they both represent
string -> value map structures. Instead, we'll define our own simple [Endpoint](/rest/api/Endpoint).

```typescript
import { Endpoint } from '@data-client/react';

export const getPhoto = new Endpoint(async ({ userId }: { userId: string }) => {
  const response = await fetch(`/users/${userId}/photo`);
  const photoArrayBuffer = await response.arrayBuffer();

  return photoArrayBuffer;
});
```

<Tabs
defaultValue="useSuspense"
values={[
{ label: 'useSuspense', value: 'useSuspense' },
{ label: 'useCache', value: 'useCache' },
{ label: 'JS/Node', value: 'JS/Node' },
]}>
<TabItem value="useSuspense">

```tsx
// photo is typed as ArrayBuffer
const photo = useSuspense(getPhoto, { userId });
```

</TabItem>
<TabItem value="useCache">

```tsx
// photo will be undefined if the fetch hasn't completed
// photo will be ArrayBuffer if the fetch has completed
const photo = useCache(getPhoto, { userId });
```

</TabItem>
<TabItem value="JS/Node">

```tsx
// photo is typed as ArrayBuffer
const photo = await getPhoto({ userId });
```

</TabItem>
</Tabs>

## Just Images

In many cases, it would be useful to suspend loading of expensive items like
images using suspense. This becomes especially powerful [with the fetch as you render](/docs/guides/render-as-you-fetch) pattern in concurrent mode.

[@data-client/img](https://www.npmjs.com/package/@data-client/img) provides use with `<Img />` component that suspends, as well as `getImage` endpoint to prefetch.

## Installation

<PkgTabs pkgs="@data-client/img" />

## Usage

```tsx title="Profile.tsx"
import React, { ImgHTMLAttributes } from 'react';
import { useSuspense } from '@data-client/react';
import { Img } from '@data-client/img';

export default function Profile({ username }: { username: string }) {
  const user = useSuspense(UserResource.get, { username });
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

#### Prefetching

Note this will cascade the requests, waiting for user to resolve before
the image request can start. If the image url is deterministic based on the same parameters, we can start that request at the same time as the user request:

```tsx title="Profile.tsx"
import React, { ImgHTMLAttributes } from 'react';
import { useSuspense, useFetch } from '@data-client/react';
import { Img, getImage } from '@data-client/img';

export default function Profile({ username }: { username: string }) {
  const imageSrc = `/profile_images/${username}}`;
  useFetch(getImage, { src: imageSrc });
  const user = useSuspense(UserResource.get, { username });
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

When using the [fetch as you render](../guides/render-as-you-fetch) pattern in concurrent mode, [Controller.fetch()](../api/Controller.md#fetch) with the `getImage`
[Endpoint](/rest/api/Endpoint) to preload the image.
