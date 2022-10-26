---
title: Render as you Fetch
---

A core design feature of Rest Hooks is decoupling actual data retrieval from data
usage. This means hooks that want to ensure data availability like [useRetrieve()](../api/useRetrieve)
or [useResource()](../api/useresource) actually only dispatch the request to fetch. [NetworkManager](../api/NetworkManager)
then uses its global awareness to determine whether to fetch. This means, for instance, that
duplicate requests for data can be deduped into one fetch, with one promise to resolve.

Another interesting implication is that fetches started imperatively via [useFetcher](../api/useFetcher)
won't result in redundant fetches. This is known as 'fetch then render,' and often results
in an improved user experience.

These are some scenarios where this pattern is especially useful:

- Server Side Rendering
- Loading data in parallel with code
- [Concurrent Mode](https://reactjs.org/docs/concurrent-mode-intro.html)
  - [SuspenseList](https://reactjs.org/docs/concurrent-mode-reference.html#suspenselist)
  - [useTransition()](https://reactjs.org/docs/concurrent-mode-reference.html#usetransition)

Fetch-then-render can be adopted incrementally. Components using data can [useResource()](../api/useresource)
and be assured they will get their data when it's ready. And when render-as-you-fetch optimizations
are added later - _those components don't need to change_. This makes data usage _tightly coupled_,
and fetch optimization _loosely coupled_.

## Route preload example

In most cases the best time to pre-fetch data is at the routing layer. Doing this
makes incorporating all of the above capabilities quite easy. Here we'll walk through
a [small demo](https://codesandbox.io/s/concurrent-react-example-ly1ds) that
incorporates concurrent mode with SuspenseList, and useTransition().
However, it would be quite easy to extend this to also support server side rendering and
code splitting routes with paraellel data and code loading.

[See full demo here](https://codesandbox.io/s/concurrent-react-example-ly1ds)

### Resource Definitions

```typescript
export class PostResource extends SlowFetchResource {
  readonly id: number | undefined = undefined;
  readonly userId: number | null = null;
  readonly title: string = '';
  readonly body: string = '';

  pk() {
    return this.id?.toString();
  }
  static urlRoot = 'https://jsonplaceholder.typicode.com/posts/';
}

export interface Address {
  readonly street: string;
  readonly suite: string;
  readonly city: string;
  readonly zipcode: string;
  readonly geo: {
    readonly lat: string;
    readonly lng: string;
  };
}

export class UserResource extends SlowFetchResource {
  readonly id: number | undefined = undefined;
  readonly name: string = '';
  readonly username: string = '';
  readonly email: string = '';
  readonly phone: string = '';
  readonly website: string = '';
  readonly address: Address | null = null;

  pk() {
    return this.id?.toString();
  }
  static urlRoot = 'https://jsonplaceholder.typicode.com/users/';
}
```

### Preloader

This is a preload hook for one route. It returns a function that will load
the data needed for that route.

```tsx
import { useCallback } from 'react';
import { useFetcher } from 'rest-hooks';
import { UserResource, PostResource } from 'resources';

function useFriendPreloader() {
  const fetchUser = useFetcher(UserResource.detail(), true);
  const fetchPosts = useFetcher(PostResource.list(), true);
  // ideally we could also fetch the comments for each post at this point
  // however, the API has no solution to this, so we have to have one cascade
  // waterfall here.

  // Alternative API designs include nesting, HTTP/2 server push, and an endpoint
  // to fetch comments based on a user rather than post.

  return useCallback(
    (friendId: number) => {
      fetchUser({ id: friendId });
      fetchPosts({ id: friendId });
    },
    [fetchUser, fetchPosts],
  );
}
```

### Components using data

#### FriendCard

```tsx
const FriendCard = () => {
  // useData gets the route context
  const { friendId } = useData();
  const friend = useResource(UserResource.detail(), { id: friendId });
  // render some JSX
};
```

#### Posts

Here we use [\<SuspenseList /\>](https://reactjs.org/docs/concurrent-mode-reference.html#suspenselist) and [useResource()](../api/useresource)

```tsx
const Posts = () => {
  // useData gets the route context
  const { friendId } = useData();
  const posts = useResource(PostResource.list(), { userId: friendId });

  // By using a SuspenseList here, we can guarantee that posts
  // appear in the optimal viewing order, despite separately loading comments.
  // Using "forwards" and "collapsed", we always see earlier loaded posts before later,
  // but never later loaded posts before earlier. This avoids the page "popping"
  // as it resizes with the comment section.
  // Suspsense lets us "unlock" the title and body of the first post, but avoid
  // showing other posts or having to wait for all the comments to load to display.

  // I've also chunked posts to appear two at a time inside a Suspense boundary.
  // This is mostly to explore the possibilities of Suspense - displaying data
  // exactly on our terms, rather than merely when the network returns.

  // LOOK: Uncomment / recomment the Suspense boundaries in Posts and Post to
  // see how boundaries at different layers can affect users.
  // Remove the SuspenseList and see how much jankier it looks!

  const chunkedPosts = chunk(posts, 2);

  return (
    <>
      <div className="flex flex-wrap -mx-4">
        <SuspenseList revealOrder="forwards" tail="collapsed">
          {chunkedPosts.map(([post1, post2]: any) => (
            <React.Fragment key={post1.id}>
              {post1 && (
                <div key={post1.id} className="w-1/2">
                  <Post post={post1} />
                </div>
              )}
              {post2 && (
                <div key={post2.id} className="w-1/2">
                  <Post post={post2} />
                </div>
              )}
            </React.Fragment>
          ))}
        </SuspenseList>
      </div>
    </>
  );
};
```

### Routing

To make things easier, routing libraries could adopt two properties defined for each route -
the component information (either a path or function to load it) and a hook like
this that returns a function to call to preload.

In our example we're just scrapping together a very redimentary routing layer. This is
not very extensible but demonstrates incorporating preloading with [useTransition()](https://reactjs.org/docs/concurrent-mode-reference.html#usetransition)

To see all of this in context [check out the demo](https://codesandbox.io/s/concurrent-react-example-ly1ds).

```tsx
function App() {
  // where we store the route
  const [friendId, setFriendId] = useState(1);
  const [startTransition, isPending] = useTransition(SUSPENSE_CONFIG);
  const preload = useFriendPreloader();

  // effectively route change trigger
  const changeFriend = useCallback(
    friendId => {
      // This becomes more meaningful when you start code splitting and load
      // load with suspense as well. Then you don't have to wait on the code
      // loading to start the data fetch.
      preload(friendId);
      // This delays commiting the React tree with new friendId until
      // suspense is resolved.
      startTransition(() => {
        setFriendId(friendId);
      });
    },
    [startTransition],
  );

  const context = {
    friendId: friendId,
    changeFriend: changeFriend,
    isPending,
  };

  return (
    <ErrorBoundary
      FallbackComponent={props => {
        console.error(props.error);
        return <span>Error</span>;
      }}
    >
      <DataContext.Provider value={context}>
        <Suspense fallback={null}>
          {/* Null fallback means less intermediate loading spinners */}
          <Core />
        </Suspense>
      </DataContext.Provider>
    </ErrorBoundary>
  );
}
```
