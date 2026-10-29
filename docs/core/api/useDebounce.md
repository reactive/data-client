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
  // the Store's action list first, so each search lands there as it's sent
  { delay: 800, store: 'open' },
  {
    delay: 300,
    click: { in: 'store', selector: 'button[aria-label="Actions"]' },
  },
  // the list fades while each word is typed; one search lands per pause:
  // 17 keystrokes, three searches
  { delay: 1200, type: 'input[aria-label="Search issues"]', text: 'suspense' },
  { wait: 2000 },
  { type: 'input[aria-label="Search issues"]', text: ' fallback' },
  { wait: 2500 },
  // Store → Code: back to the code that did it
  { store: 'close' },
];

# useDebounce()

Delays updating the parameters by [debouncing](https://css-tricks.com/debouncing-throttling-explained-examples/).

Useful to avoid spamming network requests when parameters might change quickly (like a typeahead field).

::::react

To fetch at once and abort the previous fetch, use [useCancelling()](./useCancelling.md#cancel-vs-debounce).

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
  number = 0;
  title = '';
  user = { login: '', avatar_url: '' };

  static key = 'Issue';
}

export const searchIssues = new RestEndpoint({
  urlPrefix: 'https://api.github.com',
  path: '/search/issues',
  searchParams: {} as { q: string },
  schema: { items: [Issue] },
});
```

:::react

```tsx title="IssueList" collapsed
import React from 'react';
import { useSuspense } from '@data-client/react';
import { searchIssues } from './resources/Issue';

function IssueList({ search, stale }: Props) {
  const { items } = useSuspense(searchIssues, {
    q: `${search} repo:facebook/react is:issue`,
  });
  if (!items.length) return <p className="meta">No issues match</p>;
  return (
    <div className="list" aria-busy={stale}>
      {items.map(issue => (
        <div key={issue.pk()} className="listItem">
          <Avatar src={issue.user.avatar_url} />
          <div>
            <h4>{issue.title}</h4>
            <small>
              #{issue.number} by {issue.user.login}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
// re-renders when its props change, not on every keystroke
export default React.memo(IssueList);
interface Props {
  search: string;
  /** still the last search's: the query changed since (React's isPending
   * starts only once the new search does) */
  stale: boolean;
}
```

```tsx title="SearchIssues" {7}
import React from 'react';
import { AsyncBoundary, useDebounce } from '@data-client/react';
import IssueList from './IssueList';

export default function SearchIssues() {
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, isPending] = useDebounce(query, 200);
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Issues</h1>
      </header>
      <label className="search" aria-busy={isPending}>
        <input
          ref={input}
          type="search"
          aria-label="Search issues"
          placeholder="Search issues"
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
        />
        <button
          type="button"
          className="clear"
          aria-label="Clear search"
          onClick={() => {
            setQuery('');
            input.current?.focus();
          }}
        />
      </label>
      <AsyncBoundary fallback={<Loading />} errorComponent={ErrorMessage}>
        <IssueList search={debouncedQuery} stale={query !== debouncedQuery} />
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
    search: string;
    /** still the last search's: the query changed since */
    stale: boolean;
  }>();
  const response = await useSuspense(searchIssues, () => ({
    q: `${props.search} repo:facebook/react is:issue`,
  }));
</script>

<template>
  <p v-if="!response.items.length" class="meta">No issues match</p>
  <div v-else class="list" :aria-busy="stale">
    <div
      v-for="issue in response.items"
      :key="issue.pk()"
      class="listItem"
    >
      <Avatar :src="issue.user.avatar_url" />
      <div>
        <h4>{{ issue.title }}</h4>
        <small>#{{ issue.number }} by {{ issue.user.login }}</small>
      </div>
    </div>
  </div>
</template>
```

```html title="SearchIssues.vue"
<script setup lang="ts">
  import { onErrorCaptured, ref } from 'vue';
  import { useDebounce } from '@data-client/vue';
  import IssueList from './IssueList.vue';

  const query = ref('');
  // highlight-next-line
  const [debouncedQuery, isPending] = useDebounce(query, 200);

  const input = ref<HTMLInputElement>();
  function clear() {
    query.value = '';
    input.value?.focus();
  }

  const error = ref<Error | null>(null);
  onErrorCaptured(e => {
    error.value = e;
    return false;
  });
</script>

<template>
  <header class="appHeader">
    <h1 class="appTitle">Issues</h1>
  </header>
  <label class="search" :aria-busy="isPending">
    <input
      ref="input"
      v-model="query"
      type="search"
      aria-label="Search issues"
      placeholder="Search issues"
    />
    <button
      type="button"
      class="clear"
      aria-label="Clear search"
      @click="clear"
    />
  </label>
  <ErrorMessage
    v-if="error"
    :error="error"
    :resetErrorBoundary="() => (error = null)"
  />
  <Suspense v-else>
    <IssueList :search="debouncedQuery" :stale="isPending" />
    <template #fallback><Loading /></template>
  </Suspense>
</template>
```

:::

</FrameworkPlayground>

## Types

:::react

```typescript
function useDebounce<T>(
  value: T,
  delay: number,
  updatable?: boolean,
): [T, boolean];
```

Returns `[debouncedValue, isPending]`. When `updatable` is `false`, the debounced value does not update.

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
