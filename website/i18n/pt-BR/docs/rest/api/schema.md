---
title: Pensando em Schemas
sidebar_label: Schema
description: Definições de dados declarativas em TypeScript. Aplicações com dados dinâmicos e mutáveis, sem código de gerenciamento de estado.
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import SchemaTable from '../../core/shared/\_schema_table.mdx';

Considere um post de blog típico. A resposta da API para um único post pode ser parecida com esta:

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

## Definições declarativas {#declarative-definitions}

Temos dois tipos de [entity](./Entity.md) aninhados dentro de `article`: `users` e `comments`. Usando vários [schemas](./Entity.md#schema), podemos normalizar os três tipos de entity:

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

## Normalize {#normalize}

```js
import { normalize } from '@data-client/normalizr';

const args = [{ id: '123' }];
const normalizedData = normalize(Article, originalData, args);
```

Agora, `normalizedData` criará uma única fonte de verdade serializável para todas as entities:

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

## Denormalize {#denormalize}

```js
import { denormalize } from '@data-client/normalizr';

const denormalizedData = denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);
```

Agora, `denormalizedData` instanciará as classes, garantindo que todas as instâncias do mesmo membro (como `Paul`) sejam referencialmente iguais:

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

`MemoCache` é um singleton que pode ser usado para manter a igualdade referencial entre chamadas e
também para um ganho de desempenho potencial de 2000%. Seus métodos são memoizados.

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

`memo.denormalize()` é como o [denormalize()](#denormalize) acima, mas inclui `paths` como parte do valor de retorno. `paths`
é um Array com os caminhos de todas as entities incluídas no resultado.

#### memo.query {#memoquery}

`memo.query()` permite desnormalizar um [Queryable](#queryable) apenas com base nos args, em vez de uma entrada normalizada.

```ts
const data = memo.query(
  Article,
  args,
  normalizedData,
);
```

## Queryable {#queryable}

Schemas `Queryable` permitem acessar o store sem um endpoint. Eles fazem isso usando o
método [queryKey](./Entity.md#queryKey), que produz os resultados normalmente armazenados no cache do endpoint.

Isso permite seu uso nestes casos adicionais:

- [useQuery()](/docs/api/useQuery) - Renderização em :react[React]:vue[Vue]
- [schema.Query()](./Query.md) - Como entrada para produzir uma memoização computada.
- Via [ctrl.get](/docs/api/Controller#get)/[snap.get](/docs/api/Snapshot#get)
  - [Managers](/docs/concepts/managers)
  - :react[React]:vue[Vue] com [useController()](/docs/api/useController)
  - [RestEndpoint.getOptimisticResponse](./RestEndpoint.md#getoptimisticresponse)
  - :react[[Testes unitários de hooks](/docs/guides/unit-testing-hooks) com [renderDataHook()](/docs/api/renderDataHook)]:vue[[Testes unitários de composables](/docs/guides/unit-testing-composables) com `renderDataCompose()`]
- [memo.query()](#memoquery)
- Melhorar o desempenho de [useSuspense](/docs/api/useSuspense) e [useDLE](/docs/api/useDLE) renderizando antes da resolução do endpoint

`Querables` incluem [Entity](./Entity.md), [All](./All.md), [Collection](./Collection.md), [Query](./Query.md),
[Union](./Union.md) e [Scalar](./Scalar.md). Campos [Lazy](./Lazy.md) produzem um Queryable por meio do accessor [`.query`](./Lazy.md#query).

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

## Visão geral dos schemas {#schema-overview}

<SchemaTable/>
