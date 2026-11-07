---
title: Pagination of REST data with Reactive Data Client
sidebar_label: Pagination
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import StackBlitz from '@site/src/components/StackBlitz';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PaginationDemo from '../../core/shared/\_pagination.mdx';
import { validatorFixtures } from '@site/src/fixtures/validators';

# Rest Pagination

## Expanding Lists

In case you want to append results to your existing list, rather than move to another page
[Resource.getList.getPage](../api/resource.md#getpage) can be used as long as [paginationField](../api/resource.md#paginationfield) was provided.

<PaginationDemo />

Don't forget to define our [Resource's](../api/resource.md) [paginationField](../api/resource.md#paginationfield) and
correct [schema](../api/resource.md#schema)!

```ts title="Post"
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  // highlight-next-line
  paginationField: 'cursor',
}).extend('getList', {
  // highlight-next-line
  schema: { posts: new Collection([Post]), cursor: '' },
});
```

### Github Issues Demo

Our `NextPage` component has a click handler that calls [RestEndpoint.getPage](../api/RestEndpoint.md#getpage).
Scroll to the bottom of the preview to click _"Load more"_ to append the next page of issues.

<StackBlitz app="github-app" file="src/resources/Issue.tsx,src/pages/NextPage.tsx" height={700} />

### Using RestEndpoint Directly

Here we explore a real world example using [Cosmos Hub validators list](https://rest.cosmos.directory/cosmoshub/cosmos/staking/v1beta1/validators).

Since validators only have one Endpoint, we use [RestEndpoint](../api/RestEndpoint.md) instead of [resource](../api/resource.md). By using [Collections](../api/Collection.md) and [paginationField](../api/RestEndpoint.md#paginationfield), we can call [RestEndpoint.getPage](../api/RestEndpoint.md#getpage)
to append the next page of validators to our list.

<FrameworkPlayground defaultOpen="n" row fixtures={validatorFixtures}>

```ts title="Validator" {47-51} collapsed
import { Collection, Entity, RestEndpoint, schema } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

export class Validator extends Entity {
  operator_address = '';
  consensus_pubkey = { '@type': '', key: '' };
  jailed = false;
  status = 'BOND_STATUS_BONDED';
  tokens = '0';
  delegator_shares = '0';
  description = {
    moniker: '',
    identity: '',
    website: 'https://fake.com',
    security_contact: '',
    details: '',
  };
  unbonding_height = '0';
  unbonding_time = Temporal.Instant.fromEpochMilliseconds(0);
  commission = {
    commission_rates: { rate: 0, max_rate: 0, max_change_rate: 0 },
    update_time: Temporal.Instant.fromEpochMilliseconds(0),
  };
  min_self_delegation = '0';

  pk() {
    return this.operator_address;
  }

  static schema = {
    unbonding_time: Temporal.Instant.from,
    commission: {
      commission_rates: {
        rate: Number,
        max_rate: Number,
        max_change_rate: Number,
      },
      update_time: Temporal.Instant.from,
    },
  };
}

export const getValidators = new RestEndpoint({
  urlPrefix: 'https://rest.cosmos.directory',
  path: '/cosmoshub/cosmos/staking/v1beta1/validators',
  searchParams: {} as { 'pagination.limit': string },
  paginationField: 'pagination.key',
  schema: {
    validators: new Collection([Validator]),
    pagination: { next_key: '', total: '' },
  },
});
```

:::react

```tsx title="ValidatorItem" collapsed
import { type Validator } from './Validator';

export default function ValidatorItem({ validator }: Props) {
  return (
    <div className="listItem spaced">
      <div>
        <h4>{validator.description.moniker}</h4>
        <small>
          <a href={validator.description.website} target="_blank">
            {validator.description.website}
          </a>
        </small>
        <p>{validator.description.details}</p>
      </div>
    </div>
  );
}

interface Props {
  validator: Validator;
}
```

```tsx title="LoadMore" {8-11}
import { useController, useLoading } from '@data-client/react';
import { getValidators } from './Validator';

export default function LoadMore({ next_key, limit }) {
  const ctrl = useController();
  const [handleLoadMore, isPending] = useLoading(
    () =>
      ctrl.fetch(getValidators.getPage, {
        'pagination.limit': limit,
        'pagination.key': next_key,
      }),
    [next_key, limit],
  );
  if (!next_key) return null;
  return (
    <div className="loadMore">
      <button onClick={handleLoadMore} disabled={isPending}>
        {isPending ? '...' : 'Load more'}
      </button>
    </div>
  );
}
```

```tsx title="ValidatorList" collapsed
import { useSuspense } from '@data-client/react';
import ValidatorItem from './ValidatorItem';
import { getValidators } from './Validator';
import LoadMore from './LoadMore';

const PAGE_LIMIT = '3';

export default function ValidatorList() {
  const { validators, pagination } = useSuspense(getValidators, {
    'pagination.limit': PAGE_LIMIT,
  });

  return (
    <div>
      {validators.map(validator => (
        <ValidatorItem key={validator.pk()} validator={validator} />
      ))}
      <LoadMore next_key={pagination.next_key} limit={PAGE_LIMIT} />
    </div>
  );
}
render(<ValidatorList />);
```

:::

:::vue

```html title="ValidatorItem.vue" collapsed
<script setup lang="ts">
  import { type Validator } from './Validator';

  defineProps<{ validator: Validator }>();
</script>

<template>
  <div class="listItem spaced">
    <div>
      <h4>{{ validator.description.moniker }}</h4>
      <small>
        <a :href="validator.description.website" target="_blank">
          {{ validator.description.website }}
        </a>
      </small>
      <p>{{ validator.description.details }}</p>
    </div>
  </div>
</template>
```

```html title="LoadMore.vue" {7-11}
<script setup lang="ts">
  import { useController, useLoading } from '@data-client/vue';
  import { getValidators } from './Validator';

  const props = defineProps<{ next_key: string; limit: string }>();
  const ctrl = useController();
  const [handleLoadMore, isPending] = useLoading(() =>
    ctrl.fetch(getValidators.getPage, {
      'pagination.limit': props.limit,
      'pagination.key': props.next_key,
    }),
  );
</script>

<template>
  <div v-if="next_key" class="loadMore">
    <button @click="handleLoadMore" :disabled="isPending">
      {{ isPending ? '...' : 'Load more' }}
    </button>
  </div>
</template>
```

```html title="ValidatorList.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import ValidatorItem from './ValidatorItem.vue';
  import { getValidators } from './Validator';
  import LoadMore from './LoadMore.vue';

  const PAGE_LIMIT = '3';

  const data = await useSuspense(getValidators, {
    'pagination.limit': PAGE_LIMIT,
  });
</script>

<template>
  <div>
    <ValidatorItem
      v-for="validator in data.validators"
      :key="validator.pk()"
      :validator="validator"
    />
    <LoadMore :next_key="data.pagination.next_key" :limit="PAGE_LIMIT" />
  </div>
</template>
```

:::

</FrameworkPlayground>

### Page numbers in an envelope {#envelope}

Many APIs wrap each list in an envelope, like `{ "data": [...], "meta": { "page": 1, "totalPages": 4 } }`. Put the
[Collection](../api/Collection.md) where the list is, and set [paginationField](../api/RestEndpoint.md#paginationfield)
to the page parameter:

```ts title="Comment"
import { Collection, Entity, RestEndpoint } from '@data-client/rest';

export class Comment extends Entity {
  id = '';
  body = '';
}

export const getComments = new RestEndpoint({
  path: '/comments',
  searchParams: {} as { discussionId: string; page?: number },
  paginationField: 'page',
  schema: {
    data: new Collection([Comment]),
    meta: { page: 0, totalPages: 0 },
  },
});
```

:::react

```tsx title="CommentList"
import { useController, useSuspense } from '@data-client/react';
import { getComments } from './Comment';

export default function CommentList({ discussionId }: { discussionId: string }) {
  // leave `page` out of the first fetch
  const { data, meta } = useSuspense(getComments, { discussionId });
  const ctrl = useController();
  // appends the next page to data, and replaces meta with the new page's
  const loadMore = () =>
    ctrl.fetch(getComments.getPage, { discussionId, page: meta.page + 1 });
  // adds a new comment to the same list
  const create = (body: string) =>
    ctrl.fetch(getComments.push, { discussionId }, { body });
  return (
    <div>
      {data.map(comment => (
        <p key={comment.pk()}>{comment.body}</p>
      ))}
      {meta.page < meta.totalPages && (
        <button onClick={loadMore}>Load more</button>
      )}
      <button onClick={() => create('Nice post')}>Add comment</button>
    </div>
  );
}
```

:::

:::vue

```ts
const comments = await useSuspense(getComments, { discussionId });
const ctrl = useController();
// appends the next page to data, and replaces meta with the new page's
const loadMore = () =>
  ctrl.fetch(getComments.getPage, {
    discussionId,
    page: comments.value.meta.page + 1,
  });
// adds a new comment to the same list
const create = (body: string) =>
  ctrl.fetch(getComments.push, { discussionId }, { body });
```

:::

- **Leave the page out of the first fetch.** `getPage` drops the `paginationField` from its args to find the list
  to extend, so the list is keyed by `{ discussionId }`. A first fetch with `page: 1` makes a different list that
  `getPage` never extends.
- **The rest of the envelope follows the latest page.** Each `getPage` response replaces `meta`, so
  `meta.page < meta.totalPages` tells whether there is more to load.
- **Creates join the same list.** [push](../api/RestEndpoint.md#push) sends a `POST` to the same path and adds its
  response (one `Comment`, not an envelope) to the list whose args match. A separate create endpoint works too: give it
  `schema: getComments.schema.data.push` and call it with `{ discussionId }`.
- **Single items use the same envelope.** A detail endpoint returning `{ "data": {...} }` takes
  `schema: { data: Comment }`.
- Don't unwrap the envelope in [process()](../api/RestEndpoint.md#process) when you need its `meta`; give the
  schema the envelope's shape instead.

### Infinite Scrolling

Since UI behaviors vary widely, and implementations vary from platform (react-native or web),
we'll just assume a `Pagination` component is built, that uses a callback to trigger next
page fetching. On web, it is recommended to use something based on [Intersection Observers](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

:::react

```tsx
import { useSuspense, useController } from '@data-client/react';
import { PostResource } from 'resources/Post';
import Pagination from './Pagination';
import PostList from './PostList';

function NewsList() {
  const { results, cursor } = useSuspense(PostResource.getList);
  const ctrl = useController();

  return (
    <Pagination
      onPaginate={() =>
        ctrl.fetch(PostResource.getList.getPage, { cursor })
      }
    >
      <PostList posts={results} />
    </Pagination>
  );
}
```

:::

:::vue

```html title="NewsList.vue"
<script setup lang="ts">
  import { useSuspense, useController } from '@data-client/vue';
  import { PostResource } from 'resources/Post';
  import Pagination from './Pagination.vue';
  import PostList from './PostList.vue';

  const data = await useSuspense(PostResource.getList);
  const ctrl = useController();
  const onPaginate = () =>
    ctrl.fetch(PostResource.getList.getPage, { cursor: data.value.cursor });
</script>

<template>
  <Pagination @paginate="onPaginate">
    <PostList :posts="data.results" />
  </Pagination>
</template>
```

:::

## Tokens in HTTP Headers

In some cases the pagination tokens will be embeded in HTTP headers, rather than part of the payload. In this
case you'll need to customize the [parseResponse()](../api/RestEndpoint.md#parseResponse) function
for [getList](../api/resource.md#getlist) so the pagination headers are included fetch object.

We show the custom `getList` below. All other parts of the above example remain the same.

Pagination token is stored in the header `link` for this example.

```typescript
import { Collection, Resource } from '@data-client/rest';

export const ArticleResource = resource({
  path: '/articles/:id',
  schema: Article,
}).extend(Base => ({
  getList: Base.getList.extend({
    schema: { results: [Article], link: '' },
    async parseResponse(response: Response) {
      const results = await Base.getList.parseResponse(response);
      if (
        (response.headers && response.headers.has('link')) ||
        Array.isArray(results)
      ) {
        return {
          link: response.headers.get('link'),
          results,
        };
      }
      return results;
    },
  }),
}));
```

### Code organization

If much of your API share a similar pagination, you might
try a custom Endpoint class that shares this logic.

```ts title="resources/PagingEndpoint.ts"
import { Collection, RestEndpoint, type RestGenerics } from '@data-client/rest';

export class PagingEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async parseResponse(response: Response) {
    const results = await super.parseResponse(response);
    if (
      (response.headers && response.headers.has('link')) ||
      Array.isArray(results)
    ) {
      return {
        link: response.headers.get('link'),
        results,
      };
    }
    return results;
  }
}
```

```ts title="resources/MyResource.ts"
import { Collection, Entity, resource } from '@data-client/rest';

import { PagingEndpoint } from './PagingEndpoint';

export const MyResource = resource({
  path: '/stuff/:id',
  schema: MyEntity,
  Endpoint: PagingEndpoint,
});
```
