# \<Img /> - Suspenseful Image
[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/coinbase/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/img.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/img)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/img?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/img)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/img.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/img)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Suspenseful image component: `<Img />`.

<div align="center">

**[📖Read The Docs](https://resthooks.io/docs/guides/img-media#just-images)**

</div>

In many cases, it would be useful to suspend loading of expensive items like
images using suspense. This becomes especially powerful [with the fetch as you render](https://resthooks.io/docs/guides/render-as-you-fetch) pattern in concurrent mode.

Here, we build an endpoint for images using [Image](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image)

Here, Rest Hooks is simply used to track resource loading - only storing the `src` in its store.

## Usage

<details open><summary><b>Profile.tsx</b></summary>

```tsx
import React, { ImgHTMLAttributes } from 'react';
import { useSuspense } from 'rest-hooks';
import { Img } from '@rest-hooks/img';

export default function Profile({ username }: { username: string }) {
  const user = useSuspense(UseResource.detail(), { username });
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
import { useSuspense, useFetch } from 'rest-hooks';
import { Img, getImage } from '@rest-hooks/img';

export default function Profile({ username }: { username: string }) {
  const imageSrc = `/profile_images/${username}}`;
  useFetch(getImage, { src: imageSrc });
  const user = useSuspense(UseResource.detail(), { username });
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


When using the [fetch as you render](https://resthooks.io/docs/guides/render-as-you-fetch) pattern in concurrent mode, [useController().fetch](https://resthooks.io/docs/api/Controller#fetch) with the `getImage`
[Endpoint](https://resthooks.io/docs/api/Endpoint) to preload the image.
