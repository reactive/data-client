---
title: useQuery() - Acesso ao store de dados normalizados no React
vue_title: useQuery() - Acesso ao store de dados normalizados no Vue
sidebar_label: useQuery()
description: Renderização de dados sem o fetch. Acesse o valor memoizado de qualquer Schema no store.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { RestEndpoint } from '@data-client/rest';
import VoteDemo from '../shared/\_VoteDemo.mdx';
import VueArgs from '../shared/\_vueArgs.mdx';

# useQuery()

Renderização de dados sem o fetch.

Acesse o valor no store de qualquer [Schema Queryable](/rest/api/schema#queryable), como [Entity](/rest/api/Entity), [All](/rest/api/All), [Collection](/rest/api/Collection), [Query](/rest/api/Query),
[Union](/rest/api/Union) e [Scalar](/rest/api/Scalar). Campos [Lazy](/rest/api/Lazy) também funcionam por meio do accessor [`.query`](/rest/api/Lazy#query).
Se o valor não existir, retorna `undefined`.

`useQuery()` é reativo às [mutações](../getting-started/mutations.md) de dados, renderizando novamente apenas quando necessário. Retorna `undefined`
quando os dados são [Inválidos](../concepts/expiry-policy#invalid).

:::tip

[Queries](/rest/api/Query) são ótimas companheiras para renderizar com eficiência cálculos agregados, como os que usam [groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy#browser_compatibility),
[map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), [reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) e [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

:::

## Uso {#usage}

<VoteDemo defaultTab="TotalVotes" />

Veja [truthiness narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing) para
mais informações sobre o tratamento de tipos

## Tipos {#types}

:::react

<GenericsTabs>

```typescript
function useQuery(
  schema: Queryable,
  ...args: SchemaArgs<typeof schema>
): DenormalizeNullable<typeof endpoint.schema> | undefined;
```

```typescript
function useQuery<S extends Queryable>(
  schema: S,
  ...args: SchemaArgs<S>
): DenormalizeNullable<S> | undefined;
```

</GenericsTabs>

:::

:::vue

```typescript
function useQuery<S extends Queryable>(
  schema: S,
  ...args: MaybeRefsOrGetters<SchemaArgs<S>>
): ComputedRef<DenormalizeNullable<S> | undefined>;
```

<VueArgs />

O resultado é atualizado quando os argumentos mudam.

:::

### Queryable {#queryable}

Schemas [Queryable](/rest/api/schema#queryable) exigem um método `queryKey()` que retorne algo. Isso inclui
[Entity](/rest/api/Entity), [All](/rest/api/All), [Collection](/rest/api/Collection), [Query](/rest/api/Query),
[Union](/rest/api/Union) e [Scalar](/rest/api/Scalar). Campos [Lazy](/rest/api/Lazy) produzem um Queryable por meio do accessor [`.query`](/rest/api/Lazy#query).

```ts
interface Queryable {
  queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    getEntity: GetEntity,
    getIndex: GetIndex,
    // Must be non-void
  ): {};
}
```

## Exemplos {#examples}

<!-- TODO: Add examples for each Queryable schema type and the different args that can be sent (like index, vs pk; union needing 'type') -->

### Ordenação e filtragem {#sorting--filtering}

[Query](/rest/api/Query) fornece acesso programático ao store do Reactive Data Client.

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
{ id: '777', name: 'Albatras', isAdmin: true },
],
delay: 150,
},
]} row>

```ts title="UserResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;

  static key = 'User';
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
});
```

:::react

```tsx title="UsersPage" {22}
import { All, Query } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { UserResource, User } from './UserResource';

interface Args {
  asc: boolean;
  isAdmin?: boolean;
}
const sortedUsers = new Query(
  new All(User),
  (entries, { asc, isAdmin }: Args = { asc: false }) => {
    let sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    if (isAdmin !== undefined)
      sorted = sorted.filter(user => user.isAdmin === isAdmin);
    if (asc) return sorted;
    return sorted.reverse();
  },
);

function UsersPage() {
  useFetch(UserResource.getList);
  const users = useQuery(sortedUsers, { asc: true });
  if (!users) return <div>No users in cache yet</div>;
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```html title="UsersPage.vue" {22}
<script setup lang="ts">
  import { Query, All } from '@data-client/rest';
  import { useQuery, useFetch } from '@data-client/vue';
  import { UserResource, User } from './UserResource';

  interface Args {
    asc: boolean;
    isAdmin?: boolean;
  }
  const sortedUsers = new Query(
    new All(User),
    (entries, { asc, isAdmin }: Args = { asc: false }) => {
      let sorted = [...entries].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      if (isAdmin !== undefined)
        sorted = sorted.filter(user => user.isAdmin === isAdmin);
      if (asc) return sorted;
      return sorted.reverse();
    },
  );

  useFetch(UserResource.getList);
  const users = useQuery(sortedUsers, { asc: true });
</script>

<template>
  <div v-if="!users">No users in cache yet</div>
  <div v-else>
    <div v-for="user in users" :key="user.pk()">{{ user.name }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>

:::react

### Total de Todos restantes {#remaining-todo-total}

[Queries](/rest/api/Query) também podem ser usadas para calcular agregados

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoStats.tsx" height="420" />

:::

### Relacionamentos Lazy {#lazy-relationships}

Campos [Lazy](/rest/api/Lazy) mantêm os IDs brutos durante a desnormalização do pai. Use [`.query`](/rest/api/Lazy#query) com `useQuery` para resolvê-los sob demanda,
isolando as renderizações apenas aos componentes que precisam dos dados relacionados.

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/departments'}),
args: [],
response: [
{ id: '1', name: 'Engineering', buildings: [
{ id: 'b1', name: 'HQ' },
{ id: 'b2', name: 'Annex' },
]},
{ id: '2', name: 'Design', buildings: [
{ id: 'b1', name: 'HQ' },
{ id: 'b3', name: 'Studio' },
]},
],
delay: 150,
},
]} row>

```ts title="Resources" collapsed
import { Entity, Lazy, resource } from '@data-client/rest';

export class Building extends Entity {
  id = '';
  name = '';

  static key = 'Building';
}

export class Department extends Entity {
  id = '';
  name = '';
  buildings: string[] = [];

  static schema = {
    buildings: new Lazy([Building]),
  };
  static key = 'Department';
}

export const DepartmentResource = resource({
  path: '/departments/:id',
  schema: Department,
});
```

:::react

```tsx title="DepartmentsPage" {8}
import { All } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { DepartmentResource, Department } from './Resources';

function BuildingList({ dept }: { dept: Department }) {
  const buildings = useQuery(
    Department.schema.buildings.query,
    dept.buildings,
  );
  if (!buildings) return null;
  return <span>{buildings.map(b => b.name).join(', ')}</span>;
}

function DepartmentsPage() {
  useFetch(DepartmentResource.getList);
  const departments = useQuery(new All(Department));
  if (!departments) return <div>Loading...</div>;
  return (
    <div>
      {departments.map(dept => (
        <div key={dept.pk()}>
          <strong>{dept.name}</strong>: <BuildingList dept={dept} />
        </div>
      ))}
    </div>
  );
}
render(<DepartmentsPage />);
```

:::

:::vue

```html title="BuildingList.vue" {8-11}
<script setup lang="ts">
  import { computed } from 'vue';
  import { useQuery } from '@data-client/vue';
  import { Department } from './Resources';

  const props = defineProps<{ dept: Department }>();

  const buildings = useQuery(
    Department.schema.buildings.query,
    computed(() => props.dept.buildings),
  );
</script>

<template>
  <span v-if="buildings">{{ buildings.map(b => b.name).join(', ') }}</span>
</template>
```

```html title="DepartmentsPage.vue"
<script setup lang="ts">
  import { All } from '@data-client/rest';
  import { useQuery, useFetch } from '@data-client/vue';
  import { DepartmentResource, Department } from './Resources';
  import BuildingList from './BuildingList.vue';

  useFetch(DepartmentResource.getList);
  const departments = useQuery(new All(Department));
</script>

<template>
  <div v-if="!departments">Loading...</div>
  <div v-else>
    <div v-for="dept in departments" :key="dept.pk()">
      <strong>{{ dept.name }}</strong>: <BuildingList :dept="dept" />
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

:::react

### Fallbacks de dados {#data-fallbacks}

Neste caso, `Ticker` é atualizado constantemente por um stream de websocket. No entanto, não existe um fetch em massa/de lista
para `Ticker`, o que o torna ineficiente para obter os preços em uma visualização de lista.

Então, neste caso, podemos buscar uma lista de `Stats` como fallback, já que ela também tem dados de preço.

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/resources/fallbackQueries.ts,src/pages/Home/AssetPrice.tsx" />

:::
