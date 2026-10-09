---
title: Pensar en schemas
sidebar_label: Schema
description: Definiciones de datos declarativas en TypeScript. Aplicaciones de datos dinámicos y mutables sin código de manejo de estado.
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import SchemaTable from '../../core/shared/\_schema_table.mdx';

Considera una entrada de blog típica. La respuesta de la API para una sola entrada podría verse así:

```json
{
  "id": "123",
  "author": {
    "id": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": [
    {
      "id": "324",
      "createdAt": "2013-05-29T00:00:00-04:00",
      "commenter": {
        "id": "2",
        "name": "Nicole"
      }
    },
    {
      "id": "544",
      "createdAt": "2013-05-30T00:00:00-04:00",
      "commenter": {
        "id": "1",
        "name": "Paul"
      }
    }
  ]
}
```

## Definiciones declarativas {#declarative-definitions}

Tenemos dos tipos de [entity](./Entity.md) anidados dentro de nuestro `article`: `users` y `comments`. Usando varios [schema](./Entity.md#schema), podemos normalizar los tres tipos de entidad:

<LanguageTabs>

```typescript
import { schema, Entity } from '@data-client/endpoint';
import { Temporal } from 'temporal-polyfill';

class User extends Entity {
  id = '';
  name = '';
}

class Comment extends Entity {
  id = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  commenter = User.fromJS();

  static schema = {
    commenter: User,
    createdAt: Temporal.Instant.from,
  };
}

class Article extends Entity {
  id = '';
  title = '';
  author = User.fromJS();
  comments: Comment[] = [];

  static schema = {
    author: User,
    comments: [Comment],
  };
}
```

```javascript
import { schema, Entity } from '@data-client/endpoint';
import { Temporal } from 'temporal-polyfill';

class User extends Entity { }

class Comment extends Entity {
  static schema = {
    commenter: User,
    createdAt: Temporal.Instant.from,
  };
}

class Article extends Entity {
  static schema = {
    author: User,
    comments: [Comment],
  };
}
```

</LanguageTabs>

## Normalizar {#normalize}

```js
import { normalize } from '@data-client/normalizr';

const args = [{ id: '123' }];
const normalizedData = normalize(Article, originalData, args);
```

Ahora, `normalizedData` creará una única fuente de verdad serializable para todas las entidades:

```js
{
  result: "123",
  entities: {
    articles: {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: [ "324", "544" ]
      }
    },
    users: {
      "1": { "id": "1", "name": "Paul" },
      "2": { "id": "2", "name": "Nicole" }
    },
    comments: {
      "324": {
        id: "324",
        createdAt: "2013-05-29T00:00:00-04:00",
        commenter: "2"
      },
      "544": {
        id: "544",
        createdAt: "2013-05-30T00:00:00-04:00",
        commenter: "1"
      }
    }
  },
  // contents excluded for brevity
  indexes,
  entitiesMeta,
}
```

## Desnormalizar {#denormalize}

```js
import { denormalize } from '@data-client/normalizr';

const denormalizedData = denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);
```

Ahora, `denormalizedData` instanciará las clases y garantizará que todas las instancias del mismo miembro (como `Paul`) sean referencialmente iguales:

```js
Article {
  id: '123',
  title: 'My awesome blog post',
  author: User { id: '1', name: 'Paul' },
  comments: [
    Comment {
      id: '324',
      createdAt: Instant [Temporal.Instant] {},
      commenter: [User { id: '2', name: 'Nicole' }]
    },
    Comment {
      id: '544',
      createdAt: Instant [Temporal.Instant] {},
      commenter: [User { id: '1', name: 'Paul' }]
    }
  ]
}
```

### MemoCache {#memocache}

`MemoCache` es un singleton que se puede usar para mantener la igualdad referencial entre llamadas, además de
mejorar potencialmente el rendimiento en un 2000%. Sus métodos están memoizados.

#### memo.denormalize {#memodenormalize}

```js
import { MemoCache } from '@data-client/normalizr';

// you can construct a new memo anytime you want to reset the cache
const memo = new MemoCache();

const { data, paths } = memo.denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);
const { data: data2 } = memo.denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);

// referential equality maintained between calls
assert(data === data2);
```

`memo.denormalize()` es igual que [denormalize()](#denormalize) de arriba, pero incluye `paths` como parte del valor de retorno. `paths`
es un Array con las rutas de todas las entidades incluidas en el resultado.

#### memo.query {#memoquery}

`memo.query()` permite desnormalizar un [Queryable](#queryable) a partir de los args únicamente, en lugar de una entrada normalizada.

```ts
const data = memo.query(
  Article,
  args,
  normalizedData,
);
```

## Queryable {#queryable}

Los schemas `Queryable` permiten acceder al store sin un endpoint. Lo logran mediante el
método [queryKey](./Entity.md#queryKey), que produce los resultados que normalmente se almacenan en la caché del endpoint.

Esto permite usarlos en estos casos adicionales:

- [useQuery()](/docs/api/useQuery) - Renderizado en :react[React]:vue[Vue]
- [schema.Query()](./Query.md) - Como entrada para producir una memoización calculada.
- Con [ctrl.get](/docs/api/Controller#get)/[snap.get](/docs/api/Snapshot#get)
  - [Managers](/docs/concepts/managers)
  - :react[React]:vue[Vue] con [useController()](/docs/api/useController)
  - [RestEndpoint.getOptimisticResponse](./RestEndpoint.md#getoptimisticresponse)
  - :react[[Pruebas unitarias de hooks](/docs/guides/unit-testing-hooks) con [renderDataHook()](/docs/api/renderDataHook)]:vue[[Pruebas unitarias de composables](/docs/guides/unit-testing-composables) con `renderDataCompose()`]
- [memo.query()](#memoquery)
- Mejorar el rendimiento de [useSuspense](/docs/api/useSuspense) y [useDLE](/docs/api/useDLE) al renderizar antes de que el endpoint se resuelva

Los `Querables` incluyen [Entity](./Entity.md), [All](./All.md), [Collection](./Collection.md), [Query](./Query.md),
[Union](./Union.md) y [Scalar](./Scalar.md). Los campos [Lazy](./Lazy.md) producen un Queryable mediante su accessor [`.query`](./Lazy.md#query).

```ts
interface Queryable {
  queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    getEntity: GetEntity,
    getIndex: GetIndex,
    // `{}` means non-void
  ): {};
}
```

## Resumen de schemas {#schema-overview}

<SchemaTable/>
