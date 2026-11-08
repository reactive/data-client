---
frameworks: [react]
title: React 18 Suspense with Images and other Media
sidebar_label: Images and other Media
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Images and other Media

Fetch media with Reactive Data Client to get Suspense and [render-as-you-fetch](/docs/guides/render-as-you-fetch)
for it too.

## Storing ArrayBuffer

Do not use [Resource](/rest/api/resource) or [Entity](/rest/api/Entity) for binary data. They model objects with
keys. Define an [Endpoint](/rest/api/Endpoint) instead.

```typescript
import { Endpoint } from '@data-client/rest';

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

```tsx nocheck
// photo is typed as ArrayBuffer
const photo = useSuspense(getPhoto, { userId });
```

</TabItem>
<TabItem value="useCache">

```tsx nocheck
// photo will be undefined if the fetch hasn't completed
// photo will be ArrayBuffer if the fetch has completed
const photo = useCache(getPhoto, { userId });
```

</TabItem>
<TabItem value="JS/Node">

```tsx nocheck
// photo is typed as ArrayBuffer
const photo = await getPhoto({ userId });
```

</TabItem>
</Tabs>

## Just Images

Images can suspend too, so a page shows when its images are ready. This works best with
[render-as-you-fetch](/docs/guides/render-as-you-fetch).

[@data-client/img](https://www.npmjs.com/package/@data-client/img) has an `<Img />` component that suspends, and a
`getImage` endpoint to prefetch.

## Installation

<PkgTabs pkgs="@data-client/img" />

## Usage

```tsx title="Profile.tsx"
import React, { ImgHTMLAttributes } from 'react';
import { useSuspense } from '@data-client/react';
import { Img } from '@data-client/img';
import { UserResource } from './resources/User';

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

The example above waits for the user before the image request starts. If you can compute the image URL from the same
parameters, start both requests at the same time:

```tsx title="Profile.tsx"
import React, { ImgHTMLAttributes } from 'react';
import { useSuspense, useFetch } from '@data-client/react';
import { Img, getImage } from '@data-client/img';
import { UserResource } from './resources/User';

export default function Profile({ username }: { username: string }) {
  const imageSrc = `/profile_images/${username}`;
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

With [render-as-you-fetch](../guides/render-as-you-fetch), call [Controller.fetch()](../api/Controller.md#fetch) with
the `getImage` [Endpoint](/rest/api/Endpoint) to preload the image.
