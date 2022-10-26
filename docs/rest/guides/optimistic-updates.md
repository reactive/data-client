---
title: Optimistic Updates
---

<head>
  <title>Optimistic Updates - High performance mutations</title>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@rest-hooks/rest';

Optimistic updates enable highly responsive and fast interfaces by avoiding network wait times.
An update is optimistic by assuming the network is successful. In the case of any errors, Rest
Hooks will then roll back any changes in a way that deals with all possible race conditions.

## Partial updates

One common use case is for quick toggles. Here we demonstrate a publish button for an
article. Note that we need to include the primary key (`id` in this case) in the response
body to ensure the normalized cache gets updated correctly.

```typescript title="api/Article.ts"
import { Entity, createResource } from '@rest-hooks/rest';

export class Article extends Entity {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }
}

const BaseArticleResource = createResource({
  path: '/articles/:id',
  schema: Article,
});
export const ArticleResource = {
  ...BaseArticleResource,
  partialUpdate: BaseArticleResource.partialUpdate.extend({
    // highlight-start
    getOptimisticResponse(snap, params, body) {
      return {
        // we absolutely need the primary key here,
        // but won't be sent in a partial update
        id: params.id,
        ...body,
      };
    },
    // highlight-end
  }),
};
```

```typescript title="PublishButton.tsx"
import { useController } from 'rest-hooks';
import { ArticleResource } from 'api/Article';

export default function PublishButton({ id }: { id: string }) {
  const controller = useController();

  return (
    <button
      onClick={() =>
        controller.fetch(
          ArticleResource.partialUpdate,
          { id },
          { published: true },
        )
      }
    >
      Publish
    </button>
  );
}
```

## Optimistic create with instant updates

Optimistic updates can also be combined with [immediate updates](/docs/guides/immediate-updates), enabling updates to
other endpoints instantly. This is most commonly seen when creating new items
while viewing a list of them.

Here we demonstrate what could be used in a list of articles with a modal
to create a new article. On submission of the form it would instantly
add to the list of articles the newly created article - without waiting on a network response.

```typescript title="api/Article.ts"
import { Entity, createResource } from '@rest-hooks/rest';
import uuid from 'uuid/v4';

export class Article extends Entity {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }
}

const BaseArticleResource = createResource({
  path: '/articles/:id',
  schema: Article,
});
export const ArticleResource = {
  ...BaseArticleResource,
  create: BaseArticleResource.create.extend({
    getRequestInit(body) {
      if (body) {
        return this.constructor.prototype.getRequestInit.call(this, {
          // highlight-next-line
          id: uuid(),
          ...body,
        });
      }
      return this.constructor.prototype.getRequestInit.call(this, body);
    },
    getOptimisticResponse(snap, params, body) {
      return body;
    },
    update(newResourcePk: string) {
      return {
        [list.key({})]: (resourcePks: string[] = []) => [
          ...resourcePks,
          newResourcePk,
        ],
      };
    },
  }),
};
```

Since the actual `id` of the article is created on the server, we will need to fill
in a temporary fake `id` here, so the `primary key` can be generated. This is needed
to properly normalize the article to be looked up in the cache.

Once the network responds, it will have a different `id`, which will replace the existing
data. This is often seamless, but care should be taken if the fake `id` is used in any
renders - like to issue subsequent requests. We recommend disabling `edit` type features
that rely on the `primary key` until the network fetch completes.

```typescript title="CreateArticle.tsx"
import { useController } from 'rest-hooks';
import { ArticleResource } from 'api/Article';

export default function CreateArticle() {
  const { fetch } = useController();
  const submitHandler = useCallback(
    data => fetch(ArticleResource.create, data),
    [create],
  );

  return <Form onSubmit={submitHandler}>{/* rest of form */}</Form>;
}
```

## Optimistic Deletes

Since deletes [automatically update the cache correctly](/docs/guides/immediate-updates#delete) upon fetch success,
making your delete endpoint do this optimistically is as easy as adding the [getOptimisticResponse](api/RestEndpoint.md#getoptimisticresponse)
function to your options.

We return an empty string because that's the response we expect from the server. Although by
default, the server response is ignored.

```typescript title="api/Article.ts"
import { Entity, createResource } from '@rest-hooks/rest';

export class Article extends Entity {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }
}

const BaseArticleResource = createResource({
  path: '/articles/:id',
  schema: Article,
});
export const ArticleResource = {
  ...BaseArticleResource,
  delete: BaseArticleResource.delete.extend({
    // highlight-start
    getOptimisticResponse(snap, params, body) {
      return params;
    },
    // highlight-end
  }),
};
```

## Optimistic Transforms

Sometimes user actions should result in data transformations that are dependent on the previous state of data.
The simplest examples of this are toggling a boolean, or incrementing a counter; but the same principal applies to
more complicated transforms. To make it more obvious we're using a simple counter here.

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/api/count'}),
args: [],
response: { count: 0, updatedAt: new Date() }
}
]}>

```ts title="api/Count.ts"
export class CountEntity extends Entity {
  count = 0;

  pk() {
    return `SINGLETON`;
  }
}
export const getCount = new RestEndpoint({
  path: '/api/count',
  schema: CountEntity,
  name: 'get',
});
export const increment = new RestEndpoint({
  path: '/api/count/increment',
  method: 'POST',
  name: 'increment',
  schema: CountEntity,
  getRequestInit() {
    // substitute for super.getRequestInit()
    return this.constructor.prototype.getRequestInit.call(this, {
      updatedAt: Date.now(),
    });
  },
  getOptimisticResponse(snap) {
    const { data } = snap.getResponse(getCount);
    if (!data) throw new AbortOptimistic();
    return {
      count: data.count + 1,
    };
  },
});
```

```tsx title="CounterPage.tsx" collapsed
import { useLoading } from '@rest-hooks/hooks';
import { getCount, increment } from './api/Count';

function CounterPage() {
  const { fetch } = useController();
  const { count } = useSuspense(getCount);
  const [clickHandler, loading, error] = useLoading(() => fetch(increment));
  return (
    <div>
      <p>
        Click the button multiple times quickly to trigger the race condition
      </p>
      <div>
        {count}
        <br />
        <button onClick={clickHandler}>+</button>
        {loading ? ' ...loading' : ''}
      </div>
    </div>
  );
}
render(<CounterPage />);
```

</HooksPlayground>

Try removing `getOptimisticResponse` from the increment [RestEndpoint](api/RestEndpoint.md). Even without optimistic updates, this race condition can be a real problem. While it is less likely with fast endpoints;
slower or less reliable internet connections means a slow response time no matter how fast the server is.

The problem is that the responses come back in a different order than they are computed. If we can determine the
correct 'total order', we would be able to solve this problem.

Without optimistic updates, this can be achieved simply by having the server return a timestamp of when it was last updated.
The client can then choose to ignore responses that are out of date by their time of resolution.

### Tracking order with updatedAt

To handle potential out of order resolutions, we can track the last update time in `updatedAt`.
Overriding our [useIncoming](api/Entity.md#useincoming), we can check which data is newer, and disregard old data
that resolves out of order.

We use [snap.fetchedAt](/docs/api/Snapshot#fetchedat) in our [getOptimisticResponse](api/RestEndpoint.md#getoptimisticresponse). This respresents the moment the fetch is triggered,
which is when the optimistic update first applies.

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/api/count'}),
args: [],
response: { count: 0, updatedAt: new Date() }
}
]}>

```ts title="api/Count.ts"
export class CountEntity extends Entity {
  count = 0;
  updatedAt = 0;

  pk() {
    return `SINGLETON`;
  }

  static useIncoming(existingMeta, incomingMeta, existing, incoming) {
    return existing.updatedAt <= incoming.updatedAt;
  }
}
export const getCount = new RestEndpoint({
  path: '/api/count',
  schema: CountEntity,
  name: 'get',
});
export const increment = new RestEndpoint({
  path: '/api/count/increment',
  method: 'POST',
  name: 'increment',
  schema: CountEntity,
  getRequestInit() {
    // substitute for super.getRequestInit()
    return this.constructor.prototype.getRequestInit.call(this, {
      updatedAt: Date.now(),
    });
  },
  getOptimisticResponse(snap) {
    const { data } = snap.getResponse(getCount);
    if (!data) throw new AbortOptimistic();
    return {
      count: data.count + 1,
      updatedAt: snap.fetchedAt,
    };
  },
});
```

```tsx title="CounterPage.tsx" collapsed
import { useLoading } from '@rest-hooks/hooks';
import { getCount, increment } from './api/Count';

function CounterPage() {
  const { fetch } = useController();
  const { count } = useSuspense(getCount);
  const [n, setN] = React.useState(count);
  const [clickHandler, loading, error] = useLoading(() => {
    setN(n => n + 1);
    return fetch(increment);
  });
  return (
    <div>
      <p>
        Click the button multiple times quickly to trigger the potential race
        condition. This time our vector clock protects us.
      </p>
      <div>
        Network: {count} Should be: {n}
        <br />
        <button onClick={clickHandler}>+</button>
        {loading ? ' ...loading' : ''}
      </div>
    </div>
  );
}
render(<CounterPage />);
```

</HooksPlayground>

<!---
### Vector Clocks

However, when doing an optimistic update, we now have two distinct nodes computed derived data. Optimistic updates
represent the client's computation and the server also computes derivations. Much like the [real world](https://en.wikipedia.org/wiki/Theory_of_relativity)
agreeing on a total order of events is no longer possible. However, using [vector clocks](https://en.wikipedia.org/wiki/Vector_clock)
allows us to maintain agreement on a *casual* order.

The key things to observe in the code example is the added field `updatedAt`, which is our vector clock, as well
as how it is used in our new [static merge()](/rest/api/Entity#merge) as well as updates to [getOptimisticResponse](/rest/api/Endpoint#getoptimisticresponse).

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
    getOptimisticResponse(snap, id) {
      const { data } = snap.getResponse(getCount, id);
      // server already has this optimistic computation then do nothing
      if (!data || snap.fetchedAt < data.updatedAt.client) throw new AbortOptimistic();
      return {
        id,
        count: data.count + 1,
        updatedAt: {
          client: snap.fetchedAt,
          server: data.updatedAt.server,
        },
      };
    },
  },
);

function CounterPage() {
  const { fetch } = useController();
  const { count } = useSuspense(getCount, 1);
  const [n, setN] = React.useState(count);
  const [clickHandler, loading, error] = useLoading(() => {
    fetch(increment, 1);
    setN(n => n+1);
  });
  return (
    <div>
      <p>
        Click the button multiple times quickly to trigger the potential race condition.
        This time our vector clock protects us.
      </p>
      <div>
        Network: {count} Should be: {n}<br/><button onClick={clickHandler}>+</button>
        {loading ? ' ...loading' : ''}
      </div>
    </div>
  );
}
render(<CounterPage />);
```

</HooksPlayground>

-->
