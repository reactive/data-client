---
title: useDebounce() - Atrasos declarativos de valores para React
vue_title: useDebounce() - Atrasos declarativos de valores para Vue
sidebar_label: useDebounce()
description: Atrasa a atualização dos parâmetros por meio de debounce. Evite requisições de rede excessivas causadas por mudanças rápidas de parâmetros, como em typeaheads.
---

import PkgInstall from '@site/src/components/PkgInstall';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';

# useDebounce()

Atrasa a atualização dos parâmetros por meio de [debounce](https://css-tricks.com/debouncing-throttling-explained-examples/).

Útil para evitar o excesso de requisições de rede quando os parâmetros podem mudar rapidamente (como em um campo de typeahead).

::::react

:::tip[React 18+]

Ao carregar novos dados, o [AsyncBoundary](./AsyncBoundary.md) continuará renderizando os dados anteriores até que os novos estejam prontos.
`isPending` será true durante o carregamento.

:::

::::

::::vue

:::tip

`useDebounce()` retorna [refs](https://vuejs.org/api/reactivity-core.html#ref), então o valor
com debounce pode ser passado diretamente para outros composables ou componentes. `isPending` é true desde o momento
em que a entrada muda até que o valor com debounce seja atualizado.

:::

::::

## Uso {#usage}

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

## Tipos {#types}

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

`value` e `updatable` podem ser valores simples ou [refs](https://vuejs.org/api/reactivity-core.html#ref).
Retorna uma tupla de refs `[debouncedValue, isPending]`. Quando `updatable` é `false`, o valor
com debounce deixa de ser atualizado e `isPending` volta para `false`.

:::
