---
title: GQLEntity
---

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import { GQLEndpoint, GQLEntity } from '@data-client/graphql';
import { getPost } from './getPost.ts';

O GraphQL tem [uma forma padrão](https://graphql.org/learn/global-object-identification/) de definir a [pk](/rest/api/Entity#pk), que é com um campo `id`.

GQLEntity já vem com um campo `id` automaticamente, que é usado como [pk](/rest/api/Entity#pk).

:::info extends

`GQLEntity` estende [Entity](/rest/api/Entity)

:::

## Uso {#usage}

<TypeScriptEditor>

```typescript title="User" collapsed
import { GQLEntity } from '@data-client/graphql';

export class User extends GQLEntity {
  username = '';
}
```

```typescript title="Article"
import { GQLEntity } from '@data-client/graphql';
import { User } from './User';

export class Article extends GQLEntity {
  title = '';
  content = '';
  author = User.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

</TypeScriptEditor>

[static schema](#schema) é uma definição declarativa dos campos a serem processados.
Neste caso, `author` é outra `Entity` a ser extraída, e `createdAt` será convertido
de uma string para um objeto [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

:::tip

Entities são associadas a [GQLEndpoints](./GQLEndpoint.md) usando o segundo argumento de `query` ou `mutate`.

:::

Outras sobrescritas de membros estáticos permitem personalizar o ciclo de vida dos dados, como visto abaixo.

## Ciclo de vida dos dados {#data-lifecycle}

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

## Métodos {#methods}

### pk(parent?, key?, args?): string? {#pk}

PK significa _primary key_ (chave primária) e tem o objetivo de fornecer um [meio padrão de obter
um identificador de chave](https://graphql.org/learn/global-object-identification/) para qualquer `Entity`.

O GraphQL usa o campo `id` como o [identificador global de objeto padrão](https://graphql.org/learn/global-object-identification/).

```ts
pk() {
  return this.id;
}
```

### Campo estático key: string {#key}

Isso define a key da própria Entity, e não de uma instância. Precisa ser um valor globalmente
único.

:::warning

O padrão é `this.name`; no entanto, isso pode quebrar em builds de produção que alteram os nomes das classes.
Isso costuma ser conhecido como [class name mangling](https://terser.org/docs/api-reference#mangle-options).

Nesses casos, você pode sobrescrever `key` ou desativar o mangling de classes.

:::

```ts
class User extends GQLEntity {
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### Método estático process(input, parent, key, args): processedEntity {#process}

Executado no início da normalização desta entity. O valor retornado é salvo no store.

**Padrão**: simplesmente copiar a resposta (`{...input}`)

Veja como sobrescrever para [construir buscas reversas para dados relacionais](/rest/guides/relational-data#reverse-lookups)

### Método estático mergeWithStore(existingMeta, incomingMeta, existing, incoming): mergedValue {#mergeWithStore}

```typescript
static mergeWithStore(
  existingMeta: {
    date: number;
    fetchedAt: number;
  },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  const shouldUpdate = this.shouldUpdate(
    existingMeta,
    incomingMeta,
    existing,
    incoming,
  );

  if (shouldUpdate) {
    // distinct types are not mergeable (like delete symbol), so just replace
    if (typeof incoming !== typeof existing) {
      return incoming;
    } else {
      return this.shouldReorder(
        existingMeta,
        incomingMeta,
        existing,
        incoming,
      )
        ? this.merge(incoming, existing)
        : this.merge(existing, incoming);
    }
  } else {
    return existing;
  }
}
```

`mergeWithStore()` é chamado durante a normalização quando uma entity processada já é encontrada no store.

Ele chama [shouldUpdate()](#shouldupdate), [shouldReorder()](#shouldreorder) e, possivelmente, [merge()](#merge)

### Método estático shouldUpdate(existingMeta, incomingMeta, existing, incoming): boolean {#shouldupdate}

```typescript
static shouldUpdate(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return existingMeta.fetchedAt <= incomingMeta.fetchedAt;
}
```

#### Impedindo atualizações {#preventing-updates}

shouldUpdate também pode ser usado para interromper antecipadamente a atualização de uma entity.

```typescript
import deepEqual from 'deep-equal';

class Article extends GQLEntity {
  title = '';
  content = '';
  published = false;

  static shouldUpdate(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return !deepEqual(incoming, existing);
  }
}
```

### Método estático shouldReorder(existingMeta, incomingMeta, existing, incoming): boolean {#shouldreorder}

```typescript
static shouldReorder(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return incomingMeta.fetchedAt < existingMeta.fetchedAt;
}
```

Um valor de retorno `true` inverterá a ordem dos argumentos da entity recebida e da entity no store no merge. Com
o merge padrão, isso fará com que os campos das entities existentes sobrescrevam os das recebidas,
em vez do contrário.

#### Exemplo {#example}

<TypeScriptEditor>

```typescript path="shouldReorder"
import { GQLEntity } from '@data-client/graphql';

export class LatestPriceEntity extends GQLEntity {
  updatedAt = 0;
  price = '0.0';
  symbol = '';

  static shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: { updatedAt: number },
    incoming: { updatedAt: number },
  ) {
    return incoming.updatedAt < existing.updatedAt;
  }
}
```

</TypeScriptEditor>

### Método estático merge(existing, incoming): mergedValue {#merge}

```typescript
static merge(existing: any, incoming: any) {
  return {
    ...existing,
    ...incoming,
  };
}
```

O merge é usado para tratar os casos em que uma entity recebida já foi encontrada. Ele é chamado diretamente
quando a mesma entity é encontrada em uma única resposta. Por padrão, também é chamado quando [mergeWithStore()](#mergeWithStore)
determina que a entity recebida deve ser mesclada com uma entity já persistida no store do Reactive Data Client.

Veja como sobrescrever para [construir buscas reversas para dados relacionais](/rest/guides/relational-data#reverse-lookups)

### Método estático mergeMetaWithStore(existingMeta, incomingMeta, existing, incoming): meta {#mergeMetaWithStore}

```typescript
static mergeMetaWithStore(
  existingMeta: {
    expiresAt: number;
    date: number;
    fetchedAt: number;
  },
  incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return this.shouldReorder(existingMeta, incomingMeta, existing, incoming)
    ? existingMeta
    : incomingMeta;
}
```

`mergeMetaWithStore()` é chamado durante a normalização quando uma entity processada já é encontrada no store.

### Método estático queryKey(args, queryKey, getEntity, getIndex): pk? {#queryKey}

Este método permite que `Entities` sejam [Queryable](/rest/api/schema#queryable), possibilitando o acesso ao store sem um endpoint.

Sobrescrevê-lo permite personalizar ou desativar completamente esse comportamento.

Retornar `undefined` desabilitará esse comportamento.

Retornar uma string `pk` tentará buscar essa entity e usá-la na resposta.

Quando usado, a política de expiração é calculada com base nos próprios metadados da entity.

Por **padrão**, usa o primeiro argumento para buscar em [pk()](#pk) e [indexes](#indexes)

### Método estático createIfValid(processedEntity): Entity | undefined {#createIfValid}

Chamado ao desnormalizar uma entity. Cria uma instância desta classe
se ela for considerada 'válida'.

Retornar `undefined` resultará em [status de expiração Invalid](/docs/concepts/expiry-policy#expiry-status),
assim como [Invalidate](/rest/api/Invalidate).

A expiração [`Invalid`](/docs/concepts/expiry-policy#expiry-status) geralmente significa que os hooks entrarão em um estado de carregamento e tentarão um novo fetch.

```ts
static createIfValid(props): AbstractInstanceType<this> | undefined {
  if (this.validate(props)) {
    return undefined as any;
  }
  return this.fromJS(props);
}
```

### Método estático validate(processedEntity): errorMessage? {#validate}

Executado tanto na normalização quanto na desnormalização. Retornar uma string indica um erro (a string é a mensagem).

Durante a normalização, uma falha de validação resultará em um erro para aquele fetch.

Durante a desnormalização, uma falha de validação marcará aquele resultado como 'inválido' e, assim,
bloqueará até que um resultado seja buscado.

Por **padrão**, faz algumas verificações básicas de existência de campos somente no modo de desenvolvimento. Sobrescreva para
desativar ou personalizar.

[Usando validação em endpoints com campos incompletos](/rest/guides/partial-entities)

### Método estático fromJS(props): Entity {#fromJS}

Método factory que copia props para uma nova instância. Use-o em vez de `new MyEntity()`,
para garantir que as props padrão sejam sobrescritas.

## Campos {#fields}

### Campo estático schema: \{ [k: keyof this]: Schema } {#schema}

Define membros de [entities relacionadas](/rest/guides/relational-data) ou a
[desserialização de campos](/rest/guides/network-transform#deserializing-fields), como Date e BigNumber.

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: getPost,
args: [{ id: '123' }],
response: {post:{
id: '5',
author: { id: '123', name: 'Jim' },
content: 'Happy day',
createdAt: '2019-01-23T06:07:48.311Z',
}},
delay: 150,
},
]}>

```ts title="User" collapsed
import { GQLEntity } from '@data-client/graphql';

export class User extends GQLEntity {
  name = '';
}
```

```ts title="Post"
import { GQLEntity } from '@data-client/graphql';
import { Temporal } from 'temporal-polyfill';
import { User } from './User';

export class Post extends GQLEntity {
  author = User.fromJS({});
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  content = '';
  title = '';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
  static key = 'Post';
}
```

```tsx title="PostPage" collapsed
import { useSuspense } from '@data-client/react';
import { GQLEndpoint } from '@data-client/graphql';
import { Post } from './Post';

const gql = new GQLEndpoint('https://fakeapi.com');
export const getPost = gql.query(
  (v: { id: string }) => `query getPost($id: ID!) {
    post(id: $id) {
      id
      author
      createdAt
      content
      title
    }
  }`,
  { post: Post },
);

function PostPage() {
  const { post } = useSuspense(getPost, { id: '123' });
  return (
    <div>
      <p>
        {post.content} - <cite>{post.author.name}</cite>
      </p>
      <time>
        {post.createdAt.toLocaleString('en-US', { dateStyle: 'medium' })}
      </time>
    </div>
  );
}
render(<PostPage />);
```

</HooksPlayground>

#### Membros opcionais {#optional-members}

As referências a entities aqui, cujos valores padrão na própria definição do Record
são considerados 'opcionais'

```typescript
class User extends GQLEntity {
  friend: User | null = null; // this field is optional
  lastUpdated = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    friend: User,
    lastUpdated: Temporal.Instant.from,
  };
}
```

### Campo estático indexes?: (keyof this)[] {#indexes}

Indexes aumentam o desempenho ao fazer buscas baseadas nesses parâmetros. Adicione à lista
os nomes de campos (como `slug`, `username`) que você deseja enviar como params para buscas
posteriores.

:::note

Não adicione sua chave primária, como `id`, à lista de indexes, pois ela já é otimizada.

:::
