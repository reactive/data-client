---
title: useDebounce() - Declarative value delays for React
vue_title: useDebounce() - Declarative value delays for Vue
sidebar_label: useDebounce()
description: Delays updating the parameters by debouncing. Avoid excessive network requests due to quick parameter changes like typeaheads.
---

import PkgInstall from '@site/src/components/PkgInstall';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';

# useDebounce()

Delays updating the parameters by [debouncing](https://css-tricks.com/debouncing-throttling-explained-examples/).

Useful to avoid spamming network requests when parameters might change quickly (like a typeahead field).

:::react

::::tip[React 18+]

When loading new data, the [AsyncBoundary](./AsyncBoundary.md) will continue rendering the previous data until it is ready.
`isPending` will be true while loading.

::::

:::

:::vue

::::tip

`useDebounce()` returns [refs](https://vuejs.org/api/reactivity-core.html#ref), so the debounced
value can be passed directly to other composables or components. `isPending` is true from the moment
the input changes until the debounced value is updated.

::::

:::

## Usage

<FrameworkPlayground row>

```ts title="IssueQuery" collapsed
import { RestEndpoint, Entity, Collection } from '@data-client/rest';

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

```tsx title="SearchIssues" {8}
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
  import { useSuspense } from '@data-client/vue';
  import { issueQuery } from './IssueQuery';

  const props = defineProps<{
    query: string;
    owner: string;
    repo: string;
  }>();
  const response = await useSuspense(issueQuery, () => ({
    q: `${props.query} repo:${props.owner}/${props.repo}`,
  }));
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

## Types

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

`value` and `updatable` can be plain values or [refs](https://vuejs.org/api/reactivity-core.html#ref).
Returns a tuple of `[debouncedValue, isPending]` refs. When `updatable` is `false`, the debounced
value stops updating and `isPending` resets to `false`.

:::
