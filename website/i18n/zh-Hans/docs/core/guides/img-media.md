---
frameworks: [react]
title: 在图片和其他媒体中使用 React 18 Suspense
sidebar_label: 图片和其他媒体
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 图片和其他媒体

Reactive Data Client 也可以获取媒体，让图片和其他二进制数据也能使用 Suspense 和
[边获取边渲染](/docs/guides/render-as-you-fetch)。

## 存储 ArrayBuffer {#storing-arraybuffer}

不要将 [Resource](/rest/api/resource) 或 [Entity](/rest/api/Entity) 用于二进制数据。它们建模的是带有
键的对象。请改为定义一个 [Endpoint](/rest/api/Endpoint)。

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

图片同样可以挂起，这样 Suspense 边界会等待它们加载完成。配合
[边获取边渲染](/docs/guides/render-as-you-fetch)使用效果最佳。

[@data-client/img](https://www.npmjs.com/package/@data-client/img) 提供了会挂起的 `<Img />` 组件，以及用于
预取的 `getImage` endpoint。

## 安装 {#installation}

<PkgTabs pkgs="@data-client/img" />

## 用法 {#usage}

```tsx title="Profile.tsx"
import React from 'react';
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

上面的示例会等到 user 返回后才开始图片请求。如果你能用相同的参数算出图片 URL，
就可以让两个请求同时开始：

```tsx title="Profile.tsx"
import React from 'react';
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

使用[边获取边渲染](/docs/guides/render-as-you-fetch)时，用 `getImage`
[Endpoint](/rest/api/Endpoint) 调用 [Controller.fetch()](../api/Controller.md#fetch) 来预加载图片。
