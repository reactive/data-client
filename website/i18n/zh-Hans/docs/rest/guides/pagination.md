---
title: 使用 Reactive Data Client 对 REST 数据进行分页
sidebar_label: 分页
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import StackBlitz from '@site/src/components/StackBlitz';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PaginationDemo from '../../core/shared/\_pagination.mdx';
import { validatorFixtures } from '@site/src/fixtures/validators';

# Rest 分页

## 扩展列表 {#expanding-lists}

要把结果追加到列表中而不是跳转到另一页，请使用
[Resource.getList.getPage](../api/resource.md#getpage)。它需要 [paginationField](../api/resource.md#paginationfield)。

<PaginationDemo />

设置 [Resource](../api/resource.md) 的 [paginationField](../api/resource.md#paginationfield) 和
[schema](../api/resource.md#schema)：

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

### Github Issues 演示 {#github-issues-demo}

`NextPage` 会在点击时调用 [RestEndpoint.getPage](../api/RestEndpoint.md#getpage)。滚动到预览底部，
点击 _"Load more"_ 即可追加下一页 issue。

<StackBlitz app="github-app" file="src/resources/Issue.tsx,src/pages/NextPage.tsx" height={700} />

### 直接使用 RestEndpoint {#using-restendpoint-directly}

这个示例使用 [Cosmos Hub 验证者列表](https://rest.cosmos.directory/cosmoshub/cosmos/staking/v1beta1/validators)。
它只有一个 endpoint，因此使用 [RestEndpoint](../api/RestEndpoint.md) 而不是 [resource](../api/resource.md)。
借助 [Collection](../api/Collection.md) 和 [paginationField](../api/RestEndpoint.md#paginationfield)，
[RestEndpoint.getPage](../api/RestEndpoint.md#getpage) 会把下一页验证者追加到列表中。

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

### 无限滚动 {#infinite-scrolling}

无限滚动的 UI 因应用和平台（React Native 或 web）而异。这个示例使用一个 `Pagination` 组件，它
通过调用回调来获取下一页。在 web 上，请基于
[Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) 来构建它。

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

## HTTP 头中的 token {#tokens-in-http-headers}

有些 API 会在 HTTP 头而不是响应体中发送分页 token。覆盖
[getList](../api/resource.md#getlist) 的 [parseResponse()](../api/RestEndpoint.md#parseResponse)，把该头添加到
响应中。在本例中，token 位于 `link` 头中。上面示例的其余部分保持不变。

```typescript
import { resource } from '@data-client/rest';

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

### 代码组织 {#code-organization}

如果许多 endpoint 采用相同的分页方式，请把这段逻辑放进一个自定义的 Endpoint 类中。

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
