---
frameworks: [react]
title: 边获取边渲染
---

import StackBlitz from '@site/src/components/StackBlitz';

Reactive Data Client 的一项核心设计是将实际的数据获取与数据的
使用解耦。这意味着像 [useFetch()](../api/useFetch)
或 [useSuspense()](../api/useSuspense) 这样希望确保数据可用的 hook，实际上只是派发获取请求。随后 [NetworkManager](../api/NetworkManager)
会利用其全局视角来决定是否真正发起获取。举例来说，这意味着
对同一数据的重复请求可以被去重为一次获取，只需 resolve 一个 promise。

另一个有趣的推论是，通过 [Controller.fetchIfStale()](../api/Controller.md#fetchIfStale) 和 [Controller.fetch()](../api/Controller.md#fetch) 以命令式方式发起的获取
不会导致多余的请求。这被称为“边渲染边获取”（fetch as you render），通常能
带来更好的用户体验。

以下是这种模式特别有用的一些场景：

- 服务端渲染
- 与代码并行加载数据
- [Concurrent Mode](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)
  - [useTransition()](https://react.dev/reference/react/useTransition)

边渲染边获取可以渐进式地采用。使用数据的组件可以调用 [useSuspense()](../api/useSuspense)，
并确信数据就绪时一定能拿到。而当之后加入边获取边渲染的优化时——*这些组件无需任何改动*。这让数据的使用 *紧密耦合*，
而获取优化 *松散耦合*。

<iframe loading="lazy" src="https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?embed=1&file=src/routing/routes.tsx&hidedevtools=1&view=preview&initialpath=%2Fuser%2F1&terminalHeight=1" width="100%" height="600"></iframe>

## 预加载的路由 {#routes-that-preload}

大多数情况下，预取数据的最佳时机是在路由层。这样做
可以相当轻松地整合上述所有能力。

在路由事件处理函数中（在 startTransition 之前）使用 [Controller.fetchIfStale](../api/Controller#fetchIfStale)

<!--<iframe loading="lazy" src="https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?embed=1&file=src/routing/routes.tsx&hideExplorer=1&hidedevtools=1&view=editor" width="100%" height="600"></iframe>-->

```ts
import { Controller } from '@data-client/react';
import { lazy, Route } from '@anansi/router';
import { getImage } from '@data-client/img';

import { lazyPage } from './lazyPage';
import { PostResource } from '@/resources/Post';
import { UserResource } from '@/resources/User';

export const routes: Route<Controller>[] = [
  {
    name: 'UserDetail',
    component: lazyPage('UserDetail'),
    resolveData: async (controller: Controller, match: { id: string }) => {
      if (match) {
        const fakeUser = UserResource.fromJS({
          id: Number.parseInt(match.id, 10),
        });
        // don't block on posts but start fetching
        controller.fetchIfStale(PostResource.getList, { userId: match.id });
        await Promise.all([
          controller.fetchIfStale(UserResource.get, match),
          controller.fetchIfStale(getImage, {
            src: fakeUser.profileImage,
          }),
          controller.fetchIfStale(getImage, {
            src: fakeUser.coverImage,
          }),
          controller.fetchIfStale(getImage, {
            src: fakeUser.coverImageFallback,
          }),
        ]);
      }
    },
  },
];
```

### 使用数据的组件 {#components-using-data}

[UserDetail 页面](https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?file=src%2Fpages%2FUserDetail%2Findex.tsx)

```tsx
import { useSuspense } from '@data-client/react';
import { Img } from '@data-client/img';
import { Card, Avatar } from 'antd';

import { UserResource } from 'resources/Discuss';
import Boundary from 'Boundary';
import PostList from 'pages/Posts';

export type Props = { id: string };
const { Meta } = Card;

export default function UserDetail({ id }: Props) {
  const user = useSuspense(UserResource.get, { id });
  return (
    <>
      <Card cover={<Img src={user.coverImage} />}>
        <Meta
          avatar={<Img component={Avatar} src={user.profileImage} size={64} />}
          title={user.name}
          description={
            <>
              <div>{user.website}</div>
              <div>{user.company.catchPhrase}</div>
            </>
          }
        />
      </Card>
      <Boundary fallback={<CardLoading />}>
        <PostList userId={user.pk()} />
      </Boundary>
    </>
  );
}
export function CardLoading() {
  return <Card style={{ marginTop: 16 }} loading={true} />;
}
```
