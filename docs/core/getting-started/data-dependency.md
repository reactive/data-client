---
title: Rendering Asynchronous Data in React
sidebar_label: Render Data
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import { postFixtures } from '@site/src/fixtures/posts';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import UseLive from '../shared/\_useLive.mdx';
import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';

# Rendering Asynchronous Data

Make your components reusable by binding the data where you **use** it with the one-line [useSuspense()](../api/useSuspense.md),
which guarantees data like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

<HooksPlayground defaultOpen="n" row fixtures={postFixtures}>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = 0;
  name = '';
  username = '';
  email = '';
  phone = '';
  website = '';

  get profileImage() {
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }

  static key = 'User';
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});

export class Post extends Entity {
  id = 0;
  author = User.fromJS();
  title = '';
  body = '';

  static key = 'Post';

  static schema = {
    author: User,
  };
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  paginationField: 'page',
});
```

```tsx title="PostDetail" {5} collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostDetail({ setRoute, id }) {
  const post = useSuspense(PostResource.get, { id });
  return (
    <div>
      <header>
        <div className="listItem spaced">
          <div className="author">
            <Avatar src={post.author.profileImage} />
            <small>{post.author.name}</small>
          </div>
          <h4>{post.title}</h4>
        </div>
      </header>
      <p>{post.body}</p>
      <a
        href="#"
        onClick={e => {
          e.preventDefault();
          setRoute('list');
        }}
      >
        « Back
      </a>
    </div>
  );
}
```

```tsx title="PostItem" collapsed
import { type Post } from './Resources';

export default function PostItem({ post, setRoute }: Props) {
  return (
    <div className="listItem spaced">
      <Avatar src={post.author.profileImage} />
      <div>
        <h4>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              setRoute(`detail/${post.id}`);
            }}
          >
            {post.title}
          </a>
        </h4>
        <small>by {post.author.name}</small>
      </div>
    </div>
  );
}

interface Props {
  post: Post;
  setRoute: Function;
}
```

```tsx title="PostList" {6}
import { useSuspense } from '@data-client/react';
import PostItem from './PostItem';
import { PostResource } from './Resources';

export default function PostList({ setRoute }) {
  const posts = useSuspense(PostResource.getList);
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} setRoute={setRoute} />
      ))}
    </div>
  );
}
```

```tsx title="Navigation" collapsed
import { useController, useLoading } from '@data-client/react';
import { PostResource } from './Resources';
import PostList from './PostList';
import PostDetail from './PostDetail';

function Navigation() {
  const [route, setRoute] = React.useState('list');
  if (route.startsWith('detail'))
    return <PostDetail setRoute={setRoute} id={route.split('/')[1]} />;

  return (
    <>
      <PostList setRoute={setRoute} />
      <LoadMore />
    </>
  );
}

function LoadMore() {
  const ctrl = useController();
  const posts = useQuery(PostResource.getList.schema);
  const [nextPage, isPending] = useLoading(() =>
    ctrl.fetch(PostResource.getList.getPage, { page: 2 }),
  );
  if (!posts || posts.length % 3 !== 0) return null;
  return (
    <center>
      <button onClick={nextPage}>{isPending ? '...' : 'Load more'}</button>
    </center>
  );
}
render(<Navigation />);
```

</HooksPlayground>

<a href="https://react.dev/learn/passing-data-deeply-with-context" target="_blank">
<ThemedImage
alt="Endpoints used in many contexts"
sources={{
    light: useBaseUrl('/img/passing_data_context_far.webp'),
    dark: useBaseUrl('/img/passing_data_context_far.webp'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>
</a>

Do not [prop drill](https://react.dev/learn/passing-data-deeply-with-context#the-problem-with-passing-props). Instead, [useSuspense()](../api/useSuspense.md) in the components that render the data from it. This is
known as _data co-location_.

Instead of writing complex update functions or invalidations cascades, Reactive Data Client automatically updates
bound components immediately upon [data change](./mutations.md). This is known as _reactive programming_.

## Loading and Error {#async-fallbacks}

You might have noticed the return type shows the value is always there. [useSuspense()](../api/useSuspense.md) operates very much like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). This enables
us to make error/loading disjoint from data usage.

### Async Boundaries {#boundaries}

Instead we place [&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) to handling loading and error conditions at or above navigational boundaries like **pages,
routes, or [modals](https://www.appcues.com/blog/modal-dialog-windows)**.

<AsyncBoundaryExamples />

React 18+'s [useTransition](https://react.dev/reference/react/useTransition) and [Server Side Rendering](../guides/ssr.md)
powered routers or navigation means never seeing a loading fallback again. In React 16 and 17 fallbacks can be centralized
to eliminate redundant loading indicators while keeping components reusable.

[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) also allows [Server Side Rendering](../guides/ssr.md) to incrementally stream HTML,
greatly reducing [TTFB](https://web.dev/ttfb/). [Reactive Data Client SSR's](../guides/ssr.md) automatic store hydration
means immediate user interactivity with **zero** client-side fetches on first load.

AsyncBoundary's [error fallback](../api/AsyncBoundary.md#errorcomponent) and [loading fallback](../api/AsyncBoundary.md#fallback) can both
be customized.

### Stateful

You may find cases where it's still useful to use a stateful approach to fallbacks when using React 16 and 17.
For these cases, or compatibility with some component libraries, [useDLE()](../api/useDLE.md) - [D]ata [L]oading [E]rror - is provided.

<HooksPlayground fixtures={listFixtures} row>

```typescript title="ProfileResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  avatar = '';
  fullName = '';
  bio = '';

  static key = 'Profile';
}

export const ProfileResource = resource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileList"
import { useDLE } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileList(): JSX.Element {
  const { data, loading, error } = useDLE(ProfileResource.getList);
  if (error) return <div>Error {`${error.status}`}</div>;
  if (loading || !data) return <Loading />;
  return (
    <div>
      {data.map(profile => (
        <div className="listItem" key={profile.pk()}>
          <Avatar src={profile.avatar} />
          <div>
            <h4>{profile.fullName}</h4>
            <p>{profile.bio}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
render(<ProfileList />);
```

</HooksPlayground>

Since [useDLE](../api/useDLE.md) does not [useSuspense](../api/useSuspense.md), you won't be able to easily centrally
orchestrate loading and error code. Additionally, React 18+ features like [useTransition](https://react.dev/reference/react/useTransition),
and [incrementally streaming SSR](../guides/ssr.md) won't work with components that use it.

## Conditional

<ConditionalDependencies />

## Subscriptions

When data is likely to change due to external factor; [useSubscription()](../api/useSubscription.md)
ensures continual updates while a component is mounted. [useLive()](../api/useLive.md) calls both
[useSubscription()](../api/useSubscription.md) and [useSuspense()](../api/useSuspense.md), making it quite
easy to use fresh data.

<UseLive />

Subscriptions are orchestrated by [Managers](../api/Manager.md). Out of the box,
polling based subscriptions can be used by adding [pollFrequency](/rest/api/Endpoint#pollfrequency) to an Endpoint or Resource.
For pushed based networking protocols like SSE and websockets, see the [example stream manager](../concepts/managers.md#data-stream).

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // highlight-next-line
  pollFrequency: 2000,
});
```
