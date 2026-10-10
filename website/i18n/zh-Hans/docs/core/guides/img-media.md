---
frameworks: [react]
title: 在图片和其他媒体中使用 React 18 Suspense
sidebar_label: 图片和其他媒体
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 图片和其他媒体

在为结构化数据获取配置好 Reactive Data Client 之后，你可能还想加入
一些媒体获取，以便利用 suspense 和[并发模式支持](/docs/guides/render-as-you-fetch)。

## 存储 ArrayBuffer {#storing-arraybuffer}

这种情况下不应使用 [Resource](/rest/api/resource) 和 [Entity](/rest/api/Entity)，因为它们都表示
string -> value 的映射结构。我们会定义自己的简单 [Endpoint](/rest/api/Endpoint)。

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

## 仅图片 {#just-images}

在很多情况下，使用 suspense 挂起图片等开销较大的项的加载会很有用。
在并发模式下配合[边获取边渲染](/docs/guides/render-as-you-fetch)模式时，这一点尤为强大。

[@data-client/img](https://www.npmjs.com/package/@data-client/img) 为我们提供了会挂起的 `<Img />` 组件，以及用于预取的 `getImage` endpoint。

## 安装 {#installation}

<PkgTabs pkgs="@data-client/img" />

## 用法 {#usage}

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

#### 预取 {#prefetching}

注意，这会使请求形成级联：图片请求必须等待 user resolve 之后
才能开始。如果图片 url 可以由相同参数确定，我们就可以让该请求与 user 请求同时开始：

```tsx title="Profile.tsx"
import React, { ImgHTMLAttributes } from 'react';
import { useSuspense, useFetch } from '@data-client/react';
import { Img, getImage } from '@data-client/img';
import { UserResource } from './resources/User';

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

在并发模式下使用[边获取边渲染](../guides/render-as-you-fetch)模式时，可以用 [Controller.fetch()](../api/Controller.md#fetch) 配合 `getImage`
[Endpoint](/rest/api/Endpoint) 来预加载图片。
