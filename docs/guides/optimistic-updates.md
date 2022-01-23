---
title: Optimistic Updates
---

import HooksPlayground from '@site/src/components/HooksPlayground';

Optimistic updates enable highly responsive and fast interfaces by avoiding network wait times.
An update is optimistic by assuming the network is successful. In the case of any errors, Rest
Hooks will then roll back any changes in a way that deals with all possible race conditions.

## Partial updates

One common use case is for quick toggles. Here we demonstrate a publish button for an
article. Note that we need to include the primary key (`id` in this case) in the response
body to ensure the normalized cache gets updated correctly.

### ArticleResource.ts

```typescript
import { MutateEndpoint, SchemaDetail, AbstractInstanceType } from 'rest-hooks';
import { Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }

  static partialUpdate<T extends typeof Resource>(
    this: T,
  ): MutateEndpoint<
    (p: Readonly<object>, b: Partial<AbstractInstanceType<T>>) => Promise<any>,
    SchemaDetail<Readonly<AbstractInstanceType<T>>>
  > {
    return super.partialUpdate().extend({
      optimisticUpdater: (snap, params, body) => ({
        // we absolutely need the primary key here,
        // but won't be sent in a partial update
        id: params.id,
        ...body,
      }),
    });
  }
}
```

### PublishButton.tsx

```typescript
import { useController } from 'rest-hooks';
import ArticleResource from 'ArticleResource';

export default function PublishButton({ id }: { id: string }) {
  const { fetch } = useController();

  return (
    <button
      onClick={() =>
        fetch(ArticleResource.partialUpdate(), { id }, { published: true })
      }
    >
      Publish
    </button>
  );
}
```

## Optimistic create with instant updates

Optimistic updates can also be combined with [immediate updates](./immediate-updates), enabling updates to
other endpoints instantly. This is most commonly seen when creating new items
while viewing a list of them.

Here we demonstrate what could be used in a list of articles with a modal
to create a new article. On submission of the form it would instantly
add to the list of articles the newly created article - without waiting on a network response.

### ArticleResource.ts

```typescript
import { MutateEndpoint, AbstractInstanceType } from 'rest-hooks';
import { SchemaDetail, Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }

  static create<T extends typeof Resource>(
    this: T,
  ): MutateEndpoint<
    (p: Readonly<object>, b: Partial<AbstractInstanceType<T>>) => Promise<any>,
    SchemaDetail<Readonly<AbstractInstanceType<T>>>
  > {
    return super.create().extend({
      optimisticUpdater: (snap, params, body) => body,
    });
  }
}

export const appendUpdater = (
  newArticleID: string,
  articleIDs: string[] | undefined,
) => [...(articleIDs || []), newArticleID];
```

### CreateArticle.tsx

Since the actual `id` of the article is created on the server, we will need to fill
in a temporary fake `id` here, so the `primary key` can be generated. This is needed
to properly normalize the article to be looked up in the cache.

Once the network responds, it will have a different `id`, which will replace the existing
data. This is often seamless, but care should be taken if the fake `id` is used in any
renders - like to issue subsequent requests. We recommend disabling `edit` type features
that rely on the `primary key` until the network fetch completes.

```typescript
import { useController } from 'rest-hooks';
import uuid from 'uuid/v4';
import ArticleResource from 'ArticleResource';

export default function CreateArticle() {
  const { fetch } = useController();
  const submitHandler = useCallback(
    data =>
      // note the fake id we create.
      fetch(ArticleResource.create(), {}, { id: uuid(), ...data }, [
        [ArticleResource.list(), {}, appendUpdater],
      ]),
    [create],
  );

  return <Form onSubmit={submitHandler}>{/* rest of form */}</Form>;
}
```

## Optimistic Deletes

Since deletes [automatically update the cache correctly](./immediate-updates#delete) upon fetch success,
making your delete endpoint do this optimistically is as easy as adding the [optimisticUpdater](../api/Endpoint#optimisticupdater)
function to your options.

We return an empty string because that's the response we expect from the server. Although by
default, the server response is ignored.

```ts
import { Resource, SimpleResource } from '@rest-hooks/rest';
import { MutateEndpoint } from 'rest-hooks';

export default class ArticleResource extends Resource {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }

  static delete<T extends typeof Resource>(
    this: T,
  ): MutateEndpoint<(p: Readonly<object>) => Promise<any>, schemas.Delete<T>> {
    return super.delete().extend({
      optimisticUpdater: (snap, params, body) => params,
    });
  }
}
```

## Optimistic Transforms

Sometimes user actions should result in data transformations that are dependent on the previous state of data.
The simplest examples of this are toggling a boolean, or incrementing a counter; but the same principal applies to
more complicated transforms. To make it more obvious we're using a simple counter here.

<HooksPlayground>

```ts
class CountEntity extends Entity {
  readonly id = 0;
  readonly count = 0;

  pk() {
    return `${this.id}`;
  }
}
const simulatedServerStateCount = 0;
const getCount = new Endpoint(
  (id: number) => Promise.resolve({ id, count: simulatedServerStateCount }),
  {
    name: 'get',
    schema: CountEntity,
  },
);
const increment = new Endpoint(
  (id: number) =>
    new Promise(resolve => {
      const serverState = { id, count: ++simulatedServerStateCount };
      // resolve from 500ms -> 5 seconds. Represents network variance.
      // making state computed before hand allows demonstrating out of order race conditions
      setTimeout(() => resolve(serverState), 500 + Math.random() * 4500);
    }),
  {
    name: 'increment',
    schema: CountEntity,
    sideEffect: true,
    optimisticUpdater(snap, id) {
      const { data } = snap.getResponse(increment, id);
      if (!data) throw new AbortOptimistic();
      return {
        id,
        count: data.count + 1,
      };
    },
  },
);

function CounterPage() {
  const { fetch } = useController();
  const { count } = useSuspense(getCount, 1);
  const [clickHandler, loading, error] = useLoading(() => fetch(increment, 1));
  return (
    <div>
      <p>
        Click the button multiple times quickly to trigger the race condition
      </p>
      <div>
        {count} <button onClick={clickHandler}>+</button>
        {loading ? ' ...loading' : ''}
      </div>
    </div>
  );
}
render(<CounterPage />);
```

</HooksPlayground>

Try removing `optimisticUpdater` from the increment [Endpoint](../api/Endpoint.md). Even without optimistic updates, this race condition can be a real problem. While it is less likely with fast endpoints;
slower or less reliable internet connections means a slow response time no matter how fast the server is.

The problem is that the responses come back in a different order than they are computed. If we can determine the
correct 'total order', we would be able to solve this problem.

Without optimistic updates, this can be achieved simply by having the server return a timestamp of when it was last updated.
The client can then choose to ignore responses that are out of date by their time of resolution.

### Vector Clocks

However, when doing an optimistic update, we now have two distinct nodes computed derived data. Optimistic updates
represent the client's computation and the server also computes derivations. Much like the [real world](https://en.wikipedia.org/wiki/Theory_of_relativity)
agreeing on a total order of events is no longer possible. However, using [vector clocks](https://en.wikipedia.org/wiki/Vector_clock)
allows us to maintain agreement on a *casual* order.

The key things to observe in the code example is the added field `updatedAt`, which is our vector clock, as well
as how it is used in our new [static merge()](../api/Entity#merge) as well as updates to [optimisticUpdater](../api/Endpoint.md#optimisticupdater).

<HooksPlayground>

```ts
class CountEntity extends Entity {
  readonly id = 0;
  readonly count = 0;
  readonly updatedAt = { client: 0, server: 0 };

  pk() {
    return `${this.id}`;
  }

  static merge(existing, incoming) {
    if (
      existing.updatedAt.client < incoming.updatedAt.client ||
      existing.updatedAt.server < incoming.updatedAt.server
    ) {
      return {
        ...existing,
        ...incoming,
        updatedAt: {
          client: Math.max(
            existing.updatedAt.client,
            incoming.updatedAt.client,
          ),
          server: Math.max(
            existing.updatedAt.server,
            incoming.updatedAt.server,
          ),
        },
      };
    }
    return existing;
  }
}
const simulatedServerStateCount = 0;
const getCount = new Endpoint(
  (id: number) =>
    Promise.resolve({
      id,
      count: simulatedServerStateCount,
      updatedAt: { client: 0, server: Date.now() },
    }),
  {
    name: 'get',
    schema: CountEntity,
  },
);
const increment = new Endpoint(
  (id: number) =>
    new Promise(resolve => {
      const serverState = {
        id,
        count: ++simulatedServerStateCount,
        updatedAt: { client: Date.now(), server: Date.now() + 200 },
      };
      // resolve from 500ms -> 5 seconds. Represents network variance.
      // making state computed before hand allows demonstrating out of order race conditions
      setTimeout(() => resolve(serverState), 500 + Math.random() * 4500);
    }),
  {
    name: 'increment',
    schema: CountEntity,
    sideEffect: true,
    optimisticUpdater(snap, id) {
      const { data } = snap.getResponse(increment, id);
      // server already has this optimistic computation then do nothing
      if (!data || snap.date <= data.updatedAt.client) throw new AbortOptimistic();
      return {
        id,
        count: data.count + 1,
        updatedAt: {
          client: snap.date,
          server: data.updatedAt.server,
        },
      };
    },
  },
);

function CounterPage() {
  const { fetch } = useController();
  const { count } = useSuspense(getCount, 1);
  const [clickHandler, loading, error] = useLoading(() => fetch(increment, 1));
  return (
    <div>
      <p>
        Click the button multiple times quickly to trigger the potential race condition.
        This time our vector clock protects us.
      </p>
      <div>
        {count} <button onClick={clickHandler}>+</button>
        {loading ? ' ...loading' : ''}
      </div>
    </div>
  );
}
render(<CounterPage />);
```

</HooksPlayground>
