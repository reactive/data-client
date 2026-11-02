---
title: useDebounce() - Retrasos declarativos de valores para React
vue_title: useDebounce() - Retrasos declarativos de valores para Vue
sidebar_label: useDebounce()
description: Retrasa la actualización de los parámetros mediante debounce. Evita solicitudes de red excesivas por cambios rápidos de parámetros, como en los typeaheads.
---

import PkgInstall from '@site/src/components/PkgInstall';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { issueFixtures } from '@site/src/fixtures/issues';

export const searchDemo = [
  // the Store's action list first, so each search lands there as it's sent
  { delay: 800, store: 'open', tab: 'actions' },
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

Retrasa la actualización de los parámetros mediante [debounce](https://css-tricks.com/debouncing-throttling-explained-examples/).

Es útil para evitar saturar la red con solicitudes cuando los parámetros pueden cambiar rápidamente (como en un campo de typeahead).

::::react

Para hacer el fetch de inmediato y abortar el fetch anterior, usa [useCancelling()](./useCancelling.md#cancel-vs-debounce).

:::tip[React 18+]

Al cargar datos nuevos, [AsyncBoundary](./AsyncBoundary.md) seguirá renderizando los datos anteriores hasta que los nuevos estén listos.
`isPending` será true mientras se cargan.

:::

::::

::::vue

:::tip

`useDebounce()` devuelve [refs](https://vuejs.org/api/reactivity-core.html#ref), por lo que el valor
con debounce se puede pasar directamente a otros composables o componentes. `isPending` es true desde el momento
en que cambia la entrada hasta que se actualiza el valor con debounce.

:::

::::

## Uso {#usage}

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

## Tipos {#types}

:::react

```typescript
function useDebounce<T>(
  value: T,
  delay: number,
  updatable?: boolean,
): [T, boolean];
```

Devuelve `[debouncedValue, isPending]`. Cuando `updatable` es `false`, el valor con debounce no se actualiza.

:::

:::vue

```typescript
function useDebounce<T>(
  value: T | Ref<T>,
  delay: number,
  updatable?: boolean | Ref<boolean>,
): [Ref<T>, Ref<boolean>];
```

`value` y `updatable` pueden ser valores simples o [refs](https://vuejs.org/api/reactivity-core.html#ref).
Devuelve una tupla de refs `[debouncedValue, isPending]`. Cuando `updatable` es `false`, el valor
con debounce deja de actualizarse e `isPending` vuelve a `false`.

:::
