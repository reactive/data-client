---
title: Rendering Asynchronous Data in React
sidebar_label: Render Data
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import { postFixtures } from '@site/src/fixtures/posts';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import UseLive from '../shared/\_useLive.mdx';

# Rendering Asynchronous Data

Make your components reusable by binding the data where you **use** it with the one-line [useSuspense()](../api/useSuspense.md),
which guarantees data like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

<HooksPlayground defaultOpen="n" row fixtures={postFixtures}>

```ts title="Resources" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  userId = 0;
  title = '';
  body = '';

  pk() {
    return this.id?.toString();
  }
  static key = 'Post';
}
export const PostResource = createResource({
  path: '/posts/:id',
  schema: Post,
});

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

  pk() {
    return `${this.id}`;
  }
  static key = 'User';
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});
```

```tsx title="PostDetail" {5-6} collapsed
import { useSuspense } from '@data-client/react';
import { UserResource, PostResource } from './Resources';

export default function PostDetail({ setRoute, id }) {
  const post = useSuspense(PostResource.get, { id });
  const author = useSuspense(UserResource.get, { id: post.userId });
  return (
    <div>
      <header>
        <div className="listItem spaced">
          <div className="author">
            <Avatar src={author.profileImage} />
            <small>{author.name}</small>
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

```tsx title="PostItem" {5} collapsed
import { useSuspense } from '@data-client/react';
import { UserResource, type Post } from './Resources';

export default function PostItem({ post, setRoute }: Props) {
  const author = useSuspense(UserResource.get, { id: post.userId });
  return (
    <div className="listItem spaced">
      <Avatar src={author.profileImage} />
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
        <small>by {author.name}</small>
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
import PostList from './PostList';
import PostDetail from './PostDetail';

function Navigation() {
  const [route, setRoute] = React.useState('list');
  if (route.startsWith('detail'))
    return <PostDetail setRoute={setRoute} id={route.split('/')[1]} />;

  return <PostList setRoute={setRoute} />;
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

You might have noticed the return type shows the value is always there. [useSuspense()](../api/useSuspense.md) operates very much
like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). This enables
us to make error/loading disjoint from data usage.

### Async Boundaries {#boundaries}

Instead we place [&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) to handling loading and error conditions at or above navigational boundaries like **pages,
routes, or [modals](https://www.appcues.com/blog/modal-dialog-windows)**.

<Tabs
defaultValue="web"
groupId="platform"
values={[
{ label: 'React Router', value: 'web' },
{ label: 'NextJS', value: 'nextjs' },
{ label: 'Expo', value: 'expo' },
]}>

<TabItem value="web">

```tsx {9,11} title="Dashboard.tsx"
import { AsyncBoundary } from '@data-client/react';
import { Outlet } from 'react-router';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <section>
        <AsyncBoundary>
          <Outlet />
        </AsyncBoundary>
      </section>
    </div>
  );
}
```

</TabItem>
<TabItem value="nextjs">

```tsx {12} title="app/dashboard/layout.tsx"
import { AsyncBoundary } from '@data-client/react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1>Dashboard</h1>
      <section>
        <AsyncBoundary>{children}</AsyncBoundary>
      </section>
    </div>
  );
}
```

</TabItem>
<TabItem value="expo">

```tsx {15,17} title="app/dashboard/_layout.tsx"
import { AsyncBoundary } from '@data-client/react';
import { Slot } from 'expo-router';

export default function DashboardLayout() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/my-logo.png')}
          style={styles.logo}
        />
      }
    >
      <AsyncBoundary>
        <Slot />
      </AsyncBoundary>
    </ParallaxScrollView>
  );
}
```

</TabItem>

</Tabs>

React 18's [useTransition](https://react.dev/reference/react/useTransition) and [Server Side Rendering](../guides/ssr.md)
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
import { Entity, createResource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  avatar = '';
  fullName = '';
  bio = '';

  pk() {
    return this.id?.toString();
  }
  static key = 'Profile';
}

export const ProfileResource = createResource({
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
  if (loading || !data) return <>loading...</>;
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
orchestrate loading and error code. Additionally, React 18 features like [useTransition](https://react.dev/reference/react/useTransition),
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
