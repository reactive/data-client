---
title: Lazy Schema - Desnormalización diferida de relaciones
sidebar_label: Lazy
---

# Lazy

`Lazy` envuelve un schema para omitir la desnormalización anticipada de los campos de relación. Durante la desnormalización de la entidad padre, el campo conserva su valor normalizado sin procesar (claves primarias/IDs). Después, la relación puede resolverse bajo demanda mediante [useQuery](/docs/api/useQuery) usando el accessor `.query`.

Esto es útil para:
- **Grafos bidireccionales grandes** que desbordarían la pila de llamadas durante la desnormalización recursiva
- **Optimización del rendimiento** al diferir la resolución de relaciones que no siempre se necesitan
- **Aislamiento de la memoización** — los cambios en las entidades lazy no invalidan la forma desnormalizada del padre

## Constructor {#constructor}

```typescript
new Lazy(innerSchema)
```

- `innerSchema`: Cualquier [Schema](/rest/api/schema) — una [Entity](./Entity.md), una notación abreviada de array como `[MyEntity]`, una [Collection](./Collection.md), etc.

## Uso {#usage}

### Relación de array (la más común) {#array-relationship-most-common}

```typescript
import { Entity, Lazy } from '@data-client/rest';

class Building extends Entity {
  id = '';
  name = '';
}

class Department extends Entity {
  id = '';
  name = '';
  buildings: string[] = [];

  static schema = {
    buildings: new Lazy([Building]),
  };
}
```

Cuando se desnormaliza un `Department`, `dept.buildings` contendrá claves primarias sin procesar (p. ej., `['bldg-1', 'bldg-2']`) en lugar de instancias de `Building` resueltas.

Para resolver los edificios, usa [useQuery](/docs/api/useQuery) con el accessor `.query`:

:::react

```tsx
import { useQuery } from '@data-client/react';
import { Department } from './Department';

function DepartmentBuildings({ dept }: { dept: Department }) {
  // dept.buildings contains raw IDs: ['bldg-1', 'bldg-2']
  const buildings = useQuery(Department.schema.buildings.query, dept.buildings);
  // buildings: Building[] | undefined

  if (!buildings) return null;
  return (
    <ul>
      {buildings.map(b => <li key={b.id}>{b.name}</li>)}
    </ul>
  );
}
```

:::

:::vue

```html title="DepartmentBuildings.vue"
<script setup lang="ts">
  import { useQuery } from '@data-client/vue';
  import { Department } from './Department';

  const props = defineProps<{ dept: Department }>();

  // dept.buildings contains raw IDs: ['bldg-1', 'bldg-2']
  const buildings = useQuery(
    Department.schema.buildings.query,
    () => props.dept.buildings,
  );
  // buildings: ComputedRef<Building[] | undefined>
</script>

<template>
  <ul v-if="buildings">
    <li v-for="b in buildings" :key="b.id">{{ b.name }}</li>
  </ul>
</template>
```

:::

### Relación con una sola entidad {#single-entity-relationship}

```typescript
class Department extends Entity {
  id = '';
  name = '';
  mainBuilding = '';

  static schema = {
    mainBuilding: new Lazy(Building),
  };
}
```

:::react

```tsx nocheck
// dept.mainBuilding is a raw PK string: 'bldg-1'
const building = useQuery(
  Department.schema.mainBuilding.query,
  { id: dept.mainBuilding },
);
```

:::

:::vue

```ts
// dept.mainBuilding is a raw PK string: 'bldg-1'
const building = useQuery(
  Department.schema.mainBuilding.query,
  () => ({ id: props.dept.mainBuilding }),
);
```

:::

Cuando el schema interno es una [Entity](./Entity.md) (o cualquier schema con `queryKey`), `LazyQuery` delega en su `queryKey`, por lo que pasas los mismos argumentos que usarías para consultar esa entidad directamente.

### Relación con una Collection {#collection-relationship}

```typescript
class Department extends Entity {
  id = '';
  static schema = {
    buildings: new Lazy(buildingsCollection),
  };
}
```

```tsx nocheck
const buildings = useQuery(
  Department.schema.buildings.query,
  ...collectionArgs,
);
```

## `.query` {#query}

Devuelve una instancia de `LazyQuery` adecuada para [useQuery](/docs/api/useQuery). El `LazyQuery`:

- **`queryKey(args)`** — Si el schema interno tiene un `queryKey` (Entity, Collection, etc.), delega en él. En caso contrario, devuelve `args[0]` directamente (para schemas de array/objeto en los que pasas el valor normalizado sin procesar).
- **`denormalize(input, delegate)`** — Delega en el schema interno y resuelve los IDs en instancias completas de la entidad.

El getter `.query` siempre devuelve la misma instancia (en caché).

## Cómo funciona {#how-it-works}

### Normalización {#normalization}

`Lazy.normalize` delega en el schema interno. Las entidades se almacenan en las tablas de entidades normalizadas como siempre: `Lazy` no tiene ningún efecto en la normalización.

### Desnormalización (ruta del padre) {#denormalization-parent-path}

`Lazy.denormalize` es una **no-op**: devuelve la entrada sin cambios. Cuando `EntityMixin.denormalize` itera sobre los campos del schema y encuentra un campo `Lazy`, el despacho de `unvisit` llama a `Lazy.denormalize`, que simplemente deja pasar las PKs sin procesar. No se visita ninguna entidad anidada ni se registran dependencias en la caché.

### Desnormalización (ruta de useQuery) {#denormalization-usequery-path}

Al usar `useQuery(lazyField.query, ...)`, `LazyQuery.denormalize` delega en el schema interno mediante `unvisit`, y resuelve los IDs en instancias completas de la entidad a través del proceso normal de desnormalización. Esto se ejecuta en su propio ámbito de `MemoCache.query()`, con seguimiento de dependencias y GC independientes.

## Características de rendimiento {#performance-characteristics}

- **Desnormalización del padre**: Menos saltos de dependencias (las entidades lazy se excluyen de las dependencias). Aciertos de caché más rápidos. Sin invalidación cuando cambian las entidades lazy.
- **Acceso con useQuery**: Ámbito de memoización propio con sus propios `paths` y `countRef`. Los cambios en las entidades lazy solo vuelven a renderizar los componentes que llamaron a `useQuery`, no al padre.
- **Sin sobrecarga de Proxy/getter**: Los IDs sin procesar son valores simples. La resolución completa solo ocurre mediante `useQuery`, con la ruta normal de desnormalización.
