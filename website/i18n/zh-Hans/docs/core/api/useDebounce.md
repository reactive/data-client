---
title: useDebounce() - React 的声明式值延迟
vue_title: useDebounce() - Vue 的声明式值延迟
sidebar_label: useDebounce()
description: 通过防抖延迟参数的更新。避免因参数快速变化（例如输入联想）而产生过多的网络请求。
---

import PkgInstall from '@site/src/components/PkgInstall';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';

# useDebounce()

通过[防抖](https://css-tricks.com/debouncing-throttling-explained-examples/)延迟参数的更新。

当参数可能快速变化时（例如输入联想字段），可用于避免频繁发送网络请求。

::::react

:::tip[React 18+]

加载新数据时，[AsyncBoundary](./AsyncBoundary.md) 会继续渲染之前的数据，直到新数据就绪。
加载期间 `isPending` 为 true。

:::

::::

::::vue

:::tip

`useDebounce()` 返回 [ref](https://vuejs.org/api/reactivity-core.html#ref)，因此防抖后的
值可以直接传给其他 composable 或组件。从输入发生变化的那一刻起
直到防抖后的值更新为止，`isPending` 都为 true。

:::

::::

## 用法 {#usage}

<FrameworkPlayground row>

```ts title="IssueQuery" collapsed
import { RestEndpoint, Entity, Collection } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

export class Issue extends Entity {
  number = 0;
  repository_url = '';
  labels_url = '';
  html_url = '';
  body = '';
  title = '';
  state: 'open' | 'closed' = 'open';
  locked = false;
  comments = 0;
  created_at = Temporal.Instant.fromEpochMilliseconds(0);
  updated_at = Temporal.Instant.fromEpochMilliseconds(0);
  closed_at: Temporal.Instant | null = null;
  authorAssociation = 'NONE';
  pullRequest: Record<string, any> | null = null;
  declare draft?: boolean;

  static schema = {
    created_at: Temporal.Instant.from,
    updated_at: Temporal.Instant.from,
    closed_at: Temporal.Instant.from,
  };

  pk() {
    return [this.repository_url, this.number].join(',');
  }
}

export const issueQuery = new RestEndpoint({
  urlPrefix: 'https://api.github.com',
  path: '/search/issues',
  searchParams: {} as { q: string },
  paginationField: 'page',
  schema: {
    incomplete_results: false,
    items: new Collection([Issue]),
    total_count: 0,
  },
});
```

:::react

```tsx title="IssueList" collapsed
import React from 'react';
import { useSuspense } from '@data-client/react';
import { issueQuery } from './IssueQuery';

function IssueList({ query, owner, repo }) {
  const q = `${query} repo:${owner}/${repo}`;
  const response = useSuspense(issueQuery, { q });
  return (
    <>
      <small style={{ display: 'block' }}>
        {response.total_count} results
      </small>
      {response.items.slice(0, 5).map(issue => (
        <div key={issue.pk()}>
          <a href={issue.html_url} target="_blank">
            {issue.title}
          </a>
        </div>
      ))}
    </>
  );
}
export default React.memo(IssueList) as typeof IssueList;
```

```tsx title="SearchIssues" {9}
import React from 'react';
import { AsyncBoundary } from '@data-client/react';
import { useDebounce } from '@data-client/react';
import IssueList from './IssueList';

export default function SearchIssues() {
  const [query, setQuery] = React.useState('');
  const handleChange = e => setQuery(e.currentTarget.value);
  const [debouncedQuery, isPending] = useDebounce(query, 200);
  return (
    <>
      <TextInput
        spellCheck="false"
        placeholder="Search react issues"
        value={query}
        onChange={handleChange}
        loading={isPending}
        autoFocus
        size="large"
      >
        <SearchIcon />
      </TextInput>
      <AsyncBoundary fallback={<Loading />}>
        <IssueList query={debouncedQuery} owner="facebook" repo="react" />
      </AsyncBoundary>
    </>
  );
}
render(<SearchIssues />);
```

:::

:::vue

```html title="IssueList.vue" collapsed
<script setup lang="ts">
  import { computed } from 'vue';
  import { useSuspense } from '@data-client/vue';
  import { issueQuery } from './IssueQuery';

  const props = defineProps<{
    query: string;
    owner: string;
    repo: string;
  }>();
  const response = await useSuspense(issueQuery, computed(() => ({
    q: `${props.query} repo:${props.owner}/${props.repo}`,
  })));
</script>

<template>
  <small style="display: block">{{ response.total_count }} results</small>
  <div v-for="issue in response.items.slice(0, 5)" :key="issue.pk()">
    <a :href="issue.html_url" target="_blank">{{ issue.title }}</a>
  </div>
</template>
```

```html title="SearchIssues.vue"
<script setup lang="ts">
  import { ref } from 'vue';
  import { useDebounce } from '@data-client/vue';
  import IssueList from './IssueList.vue';

  const query = ref('');
  // highlight-next-line
  const [debouncedQuery, isPending] = useDebounce(query, 200);
</script>

<template>
  <TextInput
    spellcheck="false"
    placeholder="Search react issues"
    v-model="query"
    :loading="isPending"
    autofocus
    size="large"
  >
    <SearchIcon />
  </TextInput>
  <Suspense>
    <IssueList :query="debouncedQuery" owner="facebook" repo="react" />
    <template #fallback><Loading /></template>
  </Suspense>
</template>
```

:::

</FrameworkPlayground>

## 类型 {#types}

:::react

```typescript
function useDebounce<T>(value: T, delay: number, updatable?: boolean): T;
```

:::

:::vue

```typescript
function useDebounce<T>(
  value: T | Ref<T>,
  delay: number,
  updatable?: boolean | Ref<boolean>,
): [Ref<T>, Ref<boolean>];
```

`value` 和 `updatable` 可以是普通值，也可以是 [ref](https://vuejs.org/api/reactivity-core.html#ref)。
返回由 ref 组成的元组 `[debouncedValue, isPending]`。当 `updatable` 为 `false` 时，防抖后的
值会停止更新，`isPending` 也会重置为 `false`。

:::
