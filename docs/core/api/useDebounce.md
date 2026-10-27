---
title: useDebounce() - Declarative value delays for React
vue_title: useDebounce() - Declarative value delays for Vue
sidebar_label: useDebounce()
description: Delays updating the parameters by debouncing. Avoid excessive network requests due to quick parameter changes like typeaheads.
---

import PkgInstall from '@site/src/components/PkgInstall';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { issueFixtures } from '@site/src/fixtures/issues';

export const searchDemo = [
  // the list fades while each word is typed; one search lands per pause
  { delay: 1200, type: 'input[aria-label="Search issues"]', text: 'suspense' },
  { wait: 2000 },
  { type: 'input[aria-label="Search issues"]', text: ' fallback' },
  { wait: 2000 },
  // 17 keystrokes, three searches in the store
  { store: 'open' },
];

# useDebounce()

Delays updating the parameters by [debouncing](https://css-tricks.com/debouncing-throttling-explained-examples/).

Useful to avoid spamming network requests when parameters might change quickly (like a typeahead field).

::::react

:::tip[React 18+]

When loading new data, the [AsyncBoundary](./AsyncBoundary.md) will continue rendering the previous data until it is ready.
`isPending` will be true while loading.

:::

::::

::::vue

:::tip

`useDebounce()` returns [refs](https://vuejs.org/api/reactivity-core.html#ref), so the debounced
value can be passed directly to other composables or components. `isPending` is true from the moment
the input changes until the debounced value is updated.

:::

::::

## Usage

<FrameworkPlayground
row
fixtures={issueFixtures}
defaultTab="SearchIssues"
autoRun={searchDemo}
>

```ts title="resources/Issue" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class Issue extends Entity {
  id = 0;
  title = '';
  author = '';
  comments = 0;

  static key = 'Issue';
}

export const searchIssues = new RestEndpoint({
  path: '/issues',
  searchParams: {} as { q: string },
  schema: [Issue],
});
```

:::react

```tsx title="IssueList" collapsed
import { useSuspense } from '@data-client/react';
import { searchIssues } from './resources/Issue';

export default function IssueList({ q, stale }: Props) {
  const issues = useSuspense(searchIssues, { q });
  if (!issues.length) return <p className="meta">No issues match</p>;
  return (
    <div className="list" aria-busy={stale}>
      {issues.map(issue => (
        <div key={issue.pk()} className="listItem">
          <Avatar name={issue.author} />
          <div>
            <h4>{issue.title}</h4>
            <small>
              #{issue.id} by {issue.author} · {issue.comments} comments
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
interface Props {
  q: string;
  /** still the last search's: the query changed since */
  stale: boolean;
}
```

```tsx title="SearchIssues" {7}
import React from 'react';
import { AsyncBoundary, useDebounce } from '@data-client/react';
import IssueList from './IssueList';

export default function SearchIssues() {
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, isPending] = useDebounce(query, 300);
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Issues</h1>
      </header>
      <TextInput
        aria-label="Search issues"
        placeholder="Search issues"
        spellCheck="false"
        value={query}
        onChange={e => setQuery(e.currentTarget.value)}
        loading={isPending}
        size="large"
      >
        <SearchIcon />
      </TextInput>
      <AsyncBoundary fallback={<Loading />}>
        <IssueList q={debouncedQuery} stale={query !== debouncedQuery} />
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
  import { searchIssues } from './resources/Issue';

  const props = defineProps<{
    q: string;
    /** still the last search's: the query changed since */
    stale: boolean;
  }>();
  const issues = await useSuspense(searchIssues, () => ({ q: props.q }));
</script>

<template>
  <p v-if="!issues.length" class="meta">No issues match</p>
  <div v-else class="list" :aria-busy="stale">
    <div v-for="issue in issues" :key="issue.pk()" class="listItem">
      <Avatar :name="issue.author" />
      <div>
        <h4>{{ issue.title }}</h4>
        <small>
          #{{ issue.id }} by {{ issue.author }} · {{ issue.comments }} comments
        </small>
      </div>
    </div>
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
  const [debouncedQuery, isPending] = useDebounce(query, 300);
</script>

<template>
  <header class="appHeader">
    <h1 class="appTitle">Issues</h1>
  </header>
  <TextInput
    aria-label="Search issues"
    placeholder="Search issues"
    spellcheck="false"
    v-model="query"
    :loading="isPending"
    size="large"
  >
    <SearchIcon />
  </TextInput>
  <Suspense>
    <IssueList :q="debouncedQuery" :stale="isPending" />
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
