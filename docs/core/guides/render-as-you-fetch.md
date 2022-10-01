---
title: Render as you Fetch
---

A core design feature of Rest Hooks is decoupling actual data retrieval from data
usage. This means hooks that want to ensure data availability like [useFetch()](../api/useFetch)
or [useSuspense()](../api/useSuspense) actually only dispatch the request to fetch. [NetworkManager](../api/NetworkManager)
then uses its global awareness to determine whether to fetch. This means, for instance, that
duplicate requests for data can be deduped into one fetch, with one promise to resolve.

Another interesting implication is that fetches started imperatively via [Controller.fetch()](../api/Controller.md#fetch)
won't result in redundant fetches. This is known as 'fetch as you render,' and often results
in an improved user experience.

These are some scenarios where this pattern is especially useful:

- Server Side Rendering
- Loading data in parallel with code
- [Concurrent Mode](https://reactjs.org/docs/concurrent-mode-intro.html)
  - [useTransition()](https://reactjs.org/docs/concurrent-mode-reference.html#usetransition)

Fetch-as-you-render can be adopted incrementally. Components using data can [useSuspense()](../api/useSuspense)
and be assured they will get their data when it's ready. And when render-as-you-fetch optimizations
are added later - _those components don't need to change_. This makes data usage _tightly coupled_,
and fetch optimization _loosely coupled_.

<iframe src="https://stackblitz.com/github/ntucker/anansi/tree/ec2bfc36a17a8d40404717f5d7f02d7089916a5b/examples/concurrent?embed=1&file=src/routing/routes.tsx&hidedevtools=1&view=preview&initialpath=%2Fuser%2F1" width="100%" height="600"></iframe>

## Routes that preload

In most cases the best time to pre-fetch data is at the routing layer. Doing this
makes incorporating all of the above capabilities quite easy.

Use [Controller.fetch](../api/Controller#fetch) in the route event handler (before startTransition)

<!--<iframe src="https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?embed=1&file=src/routing/routes.tsx&hideExplorer=1&hidedevtools=1&view=editor" width="100%" height="600"></iframe>-->

```ts
import { Controller } from '@rest-hooks/core';
import { lazy, Route } from '@anansi/router';
import { getImage } from '@rest-hooks/img';

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
        controller.fetch(PostResource.getList, { userId: match.id });
        await Promise.all([
          controller.fetch(UserResource.get, match),
          controller.fetch(getImage, {
            src: fakeUser.profileImage,
          }),
          controller.fetch(getImage, {
            src: fakeUser.coverImage,
          }),
          controller.fetch(getImage, {
            src: fakeUser.coverImageFallback,
          }),
        ]);
      }
    },
  },

]
```



### Components using data

[UserDetail page](https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?file=src%2Fpages%2FUserDetail%2Findex.tsx)

```tsx
import { useSuspense } from 'rest-hooks';
import { Img } from '@rest-hooks/img';
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
