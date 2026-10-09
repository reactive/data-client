---
title: useQuery() - Acceso al store de datos normalizados en React
vue_title: useQuery() - Acceso al store de datos normalizados en Vue
sidebar_label: useQuery()
description: Renderizado de datos sin el fetch. Accede al valor memoizado de cualquier Schema en el store.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { RestEndpoint } from '@data-client/rest';
import VoteDemo from '../shared/\_VoteDemo.mdx';
import VueArgs from '../shared/\_vueArgs.mdx';

# useQuery()

Renderizado de datos sin el fetch.

Accede al valor en el store de cualquier [Queryable Schema](/rest/api/schema#queryable); como [Entity](/rest/api/Entity), [All](/rest/api/All), [Collection](/rest/api/Collection), [Query](/rest/api/Query),
[Union](/rest/api/Union) y [Scalar](/rest/api/Scalar). Los campos [Lazy](/rest/api/Lazy) también funcionan mediante su accesor [`.query`](/rest/api/Lazy#query).
Si el valor no existe, devuelve `undefined`.

`useQuery()` reacciona a las [mutaciones](../getting-started/mutations.md) de datos; vuelve a renderizar solo cuando es necesario. Devuelve `undefined`
cuando los datos son [Invalid](../concepts/expiry-policy#invalid).

:::tip

Las [Queries](/rest/api/Query) son un gran complemento para renderizar de forma eficiente cálculos agregados, como los que usan [groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy#browser_compatibility),
[map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), [reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) y [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

:::

## Uso {#usage}

<VoteDemo defaultTab="TotalVotes" />

Consulta [truthiness narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing) para
más información sobre el manejo de tipos

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

El resultado se actualiza cuando cambian los argumentos.

:::

### Queryable {#queryable}

Los schemas [Queryable](/rest/api/schema#queryable) requieren un método `queryKey()` que devuelva algo. Entre ellos están
[Entity](/rest/api/Entity), [All](/rest/api/All), [Collection](/rest/api/Collection), [Query](/rest/api/Query),
[Union](/rest/api/Union) y [Scalar](/rest/api/Scalar). Los campos [Lazy](/rest/api/Lazy) producen un Queryable mediante su accesor [`.query`](/rest/api/Lazy#query).

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

## Ejemplos {#examples}

<!-- TODO: Add examples for each Queryable schema type and the different args that can be sent (like index, vs pk; union needing 'type') -->

### Ordenación y filtrado {#sorting--filtering}

[Query](/rest/api/Query) proporciona acceso programático al store de Reactive Data Client.

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

### Total de tareas pendientes {#remaining-todo-total}

Las [Queries](/rest/api/Query) también se pueden usar para calcular agregados

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoStats.tsx" height="420" />

:::

### Relaciones Lazy {#lazy-relationships}

Los campos [Lazy](/rest/api/Lazy) conservan los IDs sin resolver durante la desnormalización del padre. Usa [`.query`](/rest/api/Lazy#query) con `useQuery` para resolverlos bajo demanda,
limitando los re-renderizados únicamente a los componentes que necesitan los datos relacionados.

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

### Datos de respaldo {#data-fallbacks}

En este caso, `Ticker` se actualiza constantemente desde un flujo de websocket. Sin embargo, no existe un fetch
masivo/de lista para `Ticker`, lo que hace ineficiente obtener los precios en una vista de lista.

Así que, en este caso, podemos obtener una lista de `Stats` como respaldo, ya que también contiene datos de precios.

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/resources/fallbackQueries.ts,src/pages/Home/AssetPrice.tsx" />

:::
