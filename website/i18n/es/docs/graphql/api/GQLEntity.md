---
title: GQLEntity
---

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import { GQLEndpoint, GQLEntity } from '@data-client/graphql';
import { getPost } from './getPost.ts';

GraphQL tiene [una forma estándar](https://graphql.org/learn/global-object-identification/) de definir el [pk](/rest/api/Entity#pk), que es con un campo `id`.

GQLEntity incluye automáticamente un campo `id`, que se usa para el [pk](/rest/api/Entity#pk).

:::info extends

`GQLEntity` extiende [Entity](/rest/api/Entity)

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

[static schema](#schema) es una definición declarativa de los campos que se deben procesar.
En este caso, `author` es otra `Entity` que se debe extraer, y `createdAt` se convertirá
de un string a un objeto [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

:::tip

Las entidades se vinculan a [GQLEndpoints](./GQLEndpoint.md) mediante el segundo argumento de `query` o `mutate`.

:::

Otras sobrescrituras de miembros estáticos permiten personalizar el ciclo de vida de los datos, como se ve a continuación.

## Ciclo de vida de los datos {#data-lifecycle}

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

## Métodos {#methods}

### pk(parent?, key?, args?): string? {#pk}

PK significa _primary key_ (clave primaria) y está pensado para proporcionar un [medio estándar de obtener
un identificador de clave](https://graphql.org/learn/global-object-identification/) para cualquier `Entity`.

GraphQL usa el campo `id` como el [identificador global de objeto estándar](https://graphql.org/learn/global-object-identification/).

```ts
pk() {
  return this.id;
}
```

### static key: string {#key}

Esto define la clave de la Entity en sí, en lugar de la de una instancia. Debe ser un valor
único a nivel global.

:::warning

Por defecto es `this.name`; sin embargo, esto puede fallar en compilaciones de producción que cambian los nombres de las clases.
Esto suele conocerse como [class name mangling](https://terser.org/docs/api-reference#mangle-options).

En esos casos puedes sobrescribir `key` o deshabilitar el mangling de clases.

:::

```ts
class User extends GQLEntity {
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### static process(input, parent, key, args): processedEntity {#process}

Se ejecuta al inicio de la normalización de esta entidad. El valor de retorno se guarda en el store.

**Por defecto** simplemente copia la respuesta (`{...input}`)

Cómo sobrescribirlo para [construir búsquedas inversas para datos relacionales](/rest/guides/relational-data#reverse-lookups)

### static mergeWithStore(existingMeta, incomingMeta, existing, incoming): mergedValue {#mergeWithStore}

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

`mergeWithStore()` se llama durante la normalización cuando una entidad procesada ya existe en el store.

Esto llama a [shouldUpdate()](#shouldupdate), [shouldReorder()](#shouldreorder) y, potencialmente, a [merge()](#merge)

### static shouldUpdate(existingMeta, incomingMeta, existing, incoming): boolean {#shouldupdate}

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

#### Evitar actualizaciones {#preventing-updates}

shouldUpdate también se puede usar para interrumpir la actualización de una entidad.

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

### static shouldReorder(existingMeta, incomingMeta, existing, incoming): boolean {#shouldreorder}

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

Un valor de retorno `true` invertirá el orden de los argumentos de la entidad entrante y la que está en el store en el merge. Con
el merge por defecto, esto hará que los campos de las entidades existentes sobrescriban a los de las entrantes,
en lugar de al revés.

#### Ejemplo {#example}

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

### static merge(existing, incoming): mergedValue {#merge}

```typescript
static merge(existing: any, incoming: any) {
  return {
    ...existing,
    ...incoming,
  };
}
```

Merge se usa para manejar los casos en que ya existe una entidad entrante. Se llama directamente
cuando se encuentra la misma entidad en una sola respuesta. Por defecto también se llama cuando [mergeWithStore()](#mergeWithStore)
determina que la entidad entrante debe fusionarse con una entidad ya persistida en el store de Reactive Data Client.

Cómo sobrescribirlo para [construir búsquedas inversas para datos relacionales](/rest/guides/relational-data#reverse-lookups)

### static mergeMetaWithStore(existingMeta, incomingMeta, existing, incoming): meta {#mergeMetaWithStore}

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

`mergeMetaWithStore()` se llama durante la normalización cuando una entidad procesada ya existe en el store.

### static queryKey(args, queryKey, getEntity, getIndex): pk? {#queryKey}

Este método permite que las `Entities` sean [Queryable](/rest/api/schema#queryable), es decir, que se pueda acceder al store sin un endpoint.

Sobrescribirlo permite personalizar o deshabilitar por completo este comportamiento.

Devolver `undefined` deshabilitará este comportamiento.

Devolver un string `pk` intentará buscar esta entidad y usarla en la respuesta.

Cuando se usa, la política de caducidad se calcula a partir de los metadatos propios de la entidad.

Por **defecto** usa el primer argumento para buscar en [pk()](#pk) y [indexes](#indexes)

### static createIfValid(processedEntity): Entity | undefined {#createIfValid}

Se llama al desnormalizar una entidad. Crea una instancia de esta clase
si se considera 'válida'.

Un retorno `undefined` resultará en un [estado de caducidad Invalid](/docs/concepts/expiry-policy#expiry-status),
como [Invalidate](/rest/api/Invalidate).

La caducidad [`Invalid`](/docs/concepts/expiry-policy#expiry-status) generalmente significa que los hooks entrarán en estado de carga e intentarán un nuevo fetch.

```ts
static createIfValid(props): AbstractInstanceType<this> | undefined {
  if (this.validate(props)) {
    return undefined as any;
  }
  return this.fromJS(props);
}
```

### static validate(processedEntity): errorMessage? {#validate}

Se ejecuta tanto en la normalización como en la desnormalización. Devolver un string indica un error (el string es el mensaje).

Durante la normalización, un fallo de validación producirá un error para ese fetch.

Durante la desnormalización, un fallo de validación marcará ese resultado como 'invalid' y, por tanto,
bloqueará mientras se obtiene un resultado.

Por **defecto** hace algunas comprobaciones básicas de existencia de campos, solo en modo de desarrollo. Sobrescríbelo para
deshabilitarlo o personalizarlo.

[Usar la validación en endpoints con campos incompletos](/rest/guides/partial-entities)

### static fromJS(props): Entity {#fromJS}

Método de fábrica que copia las props a una nueva instancia. Úsalo en lugar de `new MyEntity()`,
para asegurar que se sobrescriban las props por defecto.

## Campos {#fields}

### static schema: \{ [k: keyof this]: Schema } {#schema}

Define los miembros de [entidades relacionadas](/rest/guides/relational-data), o la
[deserialización de campos](/rest/guides/network-transform#deserializing-fields) como Date y BigNumber.

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

#### Miembros opcionales {#optional-members}

Las referencias a entidades aquí cuyos valores por defecto en la propia definición del Record se
consideran 'opcionales'

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

### static indexes?: (keyof this)[] {#indexes}

Los índices aumentan el rendimiento al hacer búsquedas basadas en esos parámetros. Agrega a la lista
los nombres de campo (como `slug`, `username`) que quieras enviar como params para buscar
más adelante.

:::note

No agregues tu clave primaria como `id` a la lista de índices, ya que ya está optimizada.

:::
