---
title: Rendering Asynchronous Data
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

Make your components reusable by binding the data where you need it with the one-line [useSuspense()](../api/useSuspense.md),
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
    return `https://i.pravatar.cc/256?img=${this.id + 4}`;
  }

  pk() {
    return `${this.id}`;
  }
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});
```

```tsx title="PostDetail" {4-5} collapsed
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

```tsx title="PostItem" {4} collapsed
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

```tsx title="PostList" {5}
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

No more prop drilling, or cumbersome external state management. Reactive Data Client guarantees global referential equality,
data safety and performance.

Co-location also allows [Server Side Rendering](../guides/ssr.md) to incrementally stream HTML, greatly reducing [TTFB](https://web.dev/ttfb/).
[Reactive Data Client SSR](../guides/ssr.md) automatically hydrates its store, allowing immediate interactive mutations with **zero** client-side
fetches on first load.

<ConditionalDependencies />

## Loading and Error {#async-fallbacks}

You might have noticed the return type shows the value is always there. [useSuspense()](../api/useSuspense.md) operates very much
like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). This enables
us to make error/loading disjoint from data usage.

### Async Boundaries {#boundaries}

Instead we place [&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) at or above navigational boundaries like pages,
routes or modals.

```tsx {6,12,23-25}
import React, { Suspense } from 'react';
import { AsyncBoundary } from '@data-client/react';

export default function TodoPage({ id }: { id: number }) {
  return (
    <AsyncBoundary>
      <section>
        <TodoDetail id={1} />
        <TodoDetail id={5} />
        <TodoDetail id={10} />
      </section>
    </AsyncBoundary>
  );
}
```

[useTransition](https://react.dev/reference/react/useTransition) powered routers or navigation
means React never has to show a loading fallback. Of course, these are only possible in React 18 or above,
so for 16 and 17 this will merely centralize the fallback, eliminating 100s of loading spinners.

In either case, a signficiant amount of component complexity is removed by centralizing fallback conditionals.

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

This downside of [useDLE](../api/useDLE.md) vs [useSuspense](../api/useSuspense.md) is more loading and error handling code and potentially
a much worse user experience.

## Subscriptions

When data is likely to change due to external factor; [useSubscription()](../api/useSubscription.md)
ensures continual updates while a component is mounted. [useLive()](../api/useLive.md) calls both
[useSubscription()](../api/useSubscription.md) and [useSuspense()](../api/useSuspense.md), making it quite
easy to use fresh data.

<HooksPlayground defaultOpen="n" row>

```typescript title="ExchangeRates" {18} collapsed
export class ExchangeRates extends Entity {
  currency = 'USD';
  rates: Record<string, number> = {};

  pk() {
    return this.currency;
  }

  static schema = {
    rates: new schema.Values(FloatSerializer),
  };
}
export const getExchangeRates = new RestEndpoint({
  urlPrefix: 'https://www.coinbase.com/api/v2',
  path: '/exchange-rates',
  searchParams: {} as { currency: string },
  schema: { data: ExchangeRates },
  pollFrequency: 15000,
});
```

```tsx title="AssetPrice" {6}
import { useLive } from '@data-client/react';
import { getExchangeRates } from './ExchangeRates';

function AssetPrice({ symbol }: { symbol: string }) {
  const currency = 'USD';
  const { data: price } = useLive(getExchangeRates, { currency });
  const value = 1 / price.rates[symbol];
  return (
    <span>
      {symbol}{' '}
      <Formatted value={value} formatter="currency" />
    </span>
  );
}
render(<AssetPrice symbol="BTC" />);
```

</HooksPlayground>

Subscriptions are orchestrated by [Managers](../api/Manager.md). Out of the box,
polling based subscriptions can be used by adding [pollFrequency](/rest/api/Endpoint#pollfrequency-number) to an endpoint.
For pushed based networking protocols like websockets, see the [example websocket stream manager](../api/Manager.md#middleware-data-stream).

```typescript
export const getExchangeRates = new RestEndpoint({
  urlPrefix: 'https://www.coinbase.com/api/v2',
  path: '/exchange-rates',
  searchParams: {} as { currency: string },
  schema: { data: ExchangeRates },
  // highlight-next-line
  pollFrequency: 15000,
});
```
