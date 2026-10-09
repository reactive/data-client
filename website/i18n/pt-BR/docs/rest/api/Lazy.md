---
title: Lazy Schema - Desnormalização adiada de relacionamentos
sidebar_label: Lazy
---

# Lazy

`Lazy` envolve um schema para evitar a desnormalização antecipada de campos de relacionamento. Durante a desnormalização da entity pai, o campo mantém seu valor normalizado bruto (chaves primárias/IDs). O relacionamento pode então ser resolvido sob demanda via [useQuery](/docs/api/useQuery), usando o acessor `.query`.

Isso é útil para:
- **Grafos bidirecionais grandes** que estourariam a call stack durante a desnormalização recursiva
- **Otimização de desempenho**, adiando a resolução de relacionamentos que nem sempre são necessários
- **Isolamento de memoização** — mudanças em entities lazy não invalidam a forma desnormalizada do pai

## Construtor {#constructor}

```typescript
new Lazy(innerSchema)
```

- `innerSchema`: Qualquer [Schema](/rest/api/schema) — uma [Entity](./Entity.md), uma forma abreviada de array como `[MyEntity]`, uma [Collection](./Collection.md), etc.

## Uso {#usage}

### Relacionamento de array (mais comum) {#array-relationship-most-common}

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

Quando um `Department` é desnormalizado, `dept.buildings` conterá chaves primárias brutas (por exemplo, `['bldg-1', 'bldg-2']`) em vez de instâncias de `Building` resolvidas.

Para resolver os buildings, use [useQuery](/docs/api/useQuery) com o acessor `.query`:

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

### Relacionamento com uma única entity {#single-entity-relationship}

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

Quando o schema interno é uma [Entity](./Entity.md) (ou qualquer schema com `queryKey`), `LazyQuery` delega para o `queryKey` dele — então você passa os mesmos args que usaria para consultar essa entity diretamente.

### Relacionamento com Collection {#collection-relationship}

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

Retorna uma instância de `LazyQuery` adequada para o [useQuery](/docs/api/useQuery). O `LazyQuery`:

- **`queryKey(args)`** — Se o schema interno tem um `queryKey` (Entity, Collection, etc.), delega para ele. Caso contrário, retorna `args[0]` diretamente (para schemas de array/objeto, nos quais você passa o valor normalizado bruto).
- **`denormalize(input, delegate)`** — Delega para o schema interno, resolvendo IDs em instâncias completas de entity.

O getter `.query` sempre retorna a mesma instância (em cache).

## Como funciona {#how-it-works}

### Normalização {#normalization}

`Lazy.normalize` delega para o schema interno. As entities são armazenadas nas tabelas de entities normalizadas como de costume — `Lazy` não tem efeito na normalização.

### Desnormalização (caminho do pai) {#denormalization-parent-path}

`Lazy.denormalize` é uma **operação nula** — retorna a entrada inalterada. Quando `EntityMixin.denormalize` itera sobre os campos do schema e encontra um campo `Lazy`, o dispatch de `unvisit` chama `Lazy.denormalize`, que simplesmente repassa as PKs brutas. Nenhuma entity aninhada é visitada e nenhuma dependência é registrada no cache.

### Desnormalização (caminho do useQuery) {#denormalization-usequery-path}

Ao usar `useQuery(lazyField.query, ...)`, `LazyQuery.denormalize` delega para o schema interno via `unvisit`, resolvendo IDs em instâncias completas de entity por meio do pipeline normal de desnormalização. Isso roda em seu próprio escopo de `MemoCache.query()`, com rastreamento de dependências e GC independentes.

## Características de desempenho {#performance-characteristics}

- **Desnormalização do pai**: Menos saltos de dependência (entities lazy são excluídas das deps). Hits de cache mais rápidos. Sem invalidação quando entities lazy mudam.
- **Acesso via useQuery**: Escopo de memo próprio, com `paths` e `countRef` próprios. Mudanças em entities lazy só re-renderizam os componentes que chamaram `useQuery`, não o pai.
- **Sem overhead de Proxy/getter**: IDs brutos são valores simples. A resolução completa só acontece por meio de `useQuery`, usando o caminho normal de desnormalização.
