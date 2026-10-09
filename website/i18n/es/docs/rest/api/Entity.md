---
title: Entity - Objetos únicos declarativos para React
vue_title: Entity - Objetos únicos declarativos para Vue
sidebar_label: Entity
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# Entity

<div style={{float:'right'}}>

```ts
{
  Article: {
    '1': {
      id: '1',
      title: 'Entities define data',
    }
  }
}
```

</div>

`Entity` define un único objeto _único_.

[Entity.key](#key) + [Entity.pk()](#pk) (clave primaria) permiten un store de [tabla de búsqueda plana](https://react.dev/learn/choosing-the-state-structure#principles-for-structuring-state), lo que habilita un alto
rendimiento, consistencia de los datos y mutaciones atómicas.

Las `Entities` permiten personalizar el ciclo de vida del procesamiento de datos definiendo sus miembros estáticos, como [schema](#schema),
y sobrescribiendo sus [métodos del ciclo de vida](#lifecycle).

## Uso {#usage}

<TypeScriptEditor>

```typescript title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  username = '';

  static key = 'User';
  pk() {
    return this.id;
  }
}
```

```typescript title="Article"
import { Entity } from '@data-client/rest';
import { User } from './User';

export class Article extends Entity {
  id = '';
  title = '';
  content = '';
  author = User.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static key = 'Article';
  pk() {
    return this.id;
  }

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

</TypeScriptEditor>

[static schema](#schema) es una definición declarativa de los campos que se van a procesar.
En este caso, `author` es otra `Entity` que se extraerá, y `createdAt` se convertirá
de un string a un objeto [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

:::tip

Las Entities se vinculan a los Endpoints mediante [resource.schema](./resource.md#schema) o
[RestEndpoint.schema](./RestEndpoint.md#schema)

:::

:::tip

Si ya tienes tus clases definidas, también puedes usar [EntityMixin](./EntityMixin.md)
para crear Entities.

:::

Sobrescribir otros miembros estáticos permite personalizar el ciclo de vida de los datos, como se ve a continuación.

## Miembros {#members}

### pk(parent?, key?, args?): string | number | undefined {#pk}

<abbr title="Primary Key">pk</abbr> significa [_primary key_ (clave primaria)](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS) e identifica de forma única una instancia de `Entity`.
Por defecto, devuelve el campo `id` de la Entity.

Sobrescribe este método para usar otros campos o para otros casos, como
claves primarias de varias columnas.

#### Valor undefined {#undefined-value}

Se puede usar `undefined` como valor por defecto para indicar que la entity aún no se ha creado.
Esto es útil al inicializar un formulario de creación usando [Entity.fromJS()](#fromJS)
directamente. Si `pk()` devuelve `undefined`, se considera que no se ha persistido en el servidor
y, por tanto, no se conservará en la caché.

#### Otros usos {#other-uses}

Como `pk()` es único, ofrece una forma coherente de definir las :react[[JSX list keys](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)]:vue[[`v-for` keys](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)]

:::react

```tsx nocheck
//....
return (
  <div>
    {results.map(result => (
      <TheThing key={result.pk()} thing={result} />
    ))}
  </div>
);
```

:::

:::vue

```html nocheck
<template>
  <div>
    <TheThing
      v-for="result in results"
      :key="result.pk()"
      :thing="result"
    />
  </div>
</template>
```

:::

#### Claves primarias compuestas {#composite-primary-keys}

Cuando un solo campo no basta para identificar de forma única una entity, puedes combinar varios
campos en una clave compuesta. Esto es habitual en recursos anidados o en recursos con
identificadores de varias partes.

```typescript
export class Issue extends Entity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = '';
  title = '';

  pk() {
    // Composite key from owner, repo, and issue number
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static key = 'Issue';
}
```

Cuando los datos de la entity no incluyen directamente todas las partes de la clave, puedes extraerlas de campos
relacionados o de los argumentos del endpoint usando [Entity.process()](#process):

```typescript
export class Issue extends Entity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = ''; // Contains: https://api.github.com/repos/{owner}/{repo}
  title = '';

  pk() {
    // Use owner/repo from process() which extracts from repositoryUrl
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static key = 'Issue';

  static process(input: any, parent: any, key: string, args: any[]) {
    // Extract owner and repo from the repositoryUrl
    const match = input.repositoryUrl?.match(/repos\/([^/]+)\/([^/]+)/);
    const owner = args[0]?.owner ?? match?.[1];
    const repo = args[0]?.repo ?? match?.[2];
    return { ...input, owner, repo };
  }
}
```

#### Entities singleton {#singleton-entities}

¿Y si solo existe una instancia de una Entity en toda tu aplicación? En realidad
no necesitas distinguir entre instancias, por lo que probablemente la API no define un `id` ni un
campo similar. En estos casos puedes devolver simplemente un literal como
'the_only_one'.

```typescript
pk() {
  return 'the_only_one';
}
```

Por ejemplo, si tienes

```typescript
const get = new RestEndpoint({
  path: '/options',
  schema: OptionsEntity,
});
export const OptionsResource = {
  get,
  partialUpdate: get.extend({ method: 'PATCH' }),
};
```

### Propiedad estática key: string {#key}

Esto define la clave del tipo de Entity, en lugar de la de una instancia. Debe ser un valor
único globalmente.

:::warning

Por defecto es `this.name`; sin embargo, esto puede fallar en compilaciones de producción que cambian los nombres de las clases.
Esto se conoce a menudo como [class name mangling](https://terser.org/docs/api-reference#mangle-options).

En estos casos puedes sobrescribir `key` o desactivar el class name mangling.

:::

```ts
class User extends Entity {
  id = '';
  username = '';

  pk() {
    return this.id;
  }
  // highlight-next-line
  static key = 'User';
}
```

### Propiedad estática schema: \{ [k: keyof this]: Schema } {#schema}

Define miembros de [entities relacionadas](/rest/guides/relational-data), o la
[deserialización de campos](/rest/guides/network-transform#deserializing-fields) como Date y BigNumber.

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/posts/:id'}),
args: [{ id: '123' }],
response: {
id: '5',
author: { id: '123', name: 'Jim' },
content: 'Happy day',
createdAt: '2019-01-23T06:07:48.311Z',
},
delay: 150,
},
]}>

```ts title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';

  pk() {
    return this.id;
  }
  static key = 'User';
}
```

```ts title="Post" {17-21}
import { Entity } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';
import { User } from './User';

export class Post extends Entity {
  id = '';
  author = User.fromJS();
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  content = '';
  title = '';

  pk() {
    return this.id;
  }
  static key = 'Post';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

:::react

```tsx title="PostPage" collapsed
import { RestEndpoint } from '@data-client/rest';
import { useSuspense } from '@data-client/react';
import { Post } from './Post';

export const getPost = new RestEndpoint({
  path: '/posts/:id',
  schema: Post,
});
function PostPage() {
  const post = useSuspense(getPost, { id: '123' });
  return (
    <div>
      <p>
        {post.content} - <cite>{post.author.name}</cite>
      </p>
      <time>{post.createdAt.toLocaleString('en-US', { dateStyle: 'medium' })}</time>
    </div>
  );
}
render(<PostPage />);
```

:::

:::vue

```html title="PostPage.vue" collapsed
<script lang="ts">
  import { RestEndpoint } from '@data-client/rest';
  import { Post } from './Post';

  const getPost = new RestEndpoint({
    path: '/posts/:id',
    schema: Post,
  });
</script>

<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';

  const post = await useSuspense(getPost, { id: '123' });
</script>

<template>
  <div>
    <p>{{ post.content }} - <cite>{{ post.author.name }}</cite></p>
    <time>
      {{ post.createdAt.toLocaleString('en-US', { dateStyle: 'medium' }) }}
    </time>
  </div>
</template>
```

:::

</FrameworkPlayground>

#### Miembros opcionales {#optional-members}

Las referencias a Entities aquí cuyos valores por defecto en la propia definición del Record
se consideran 'opcionales'

```typescript
class User extends Entity {
  friend: User | null = null; // this field is optional
  lastUpdated = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    friend: User,
    lastUpdated: Temporal.Instant.from,
  };
}
```

### Propiedad estática indexes?: (keyof this)[] {#indexes}

Los índices mejoran el rendimiento al hacer búsquedas basadas en esos parámetros. Añade a la lista
los nombres de campo (como `slug`, `username`) que quieras enviar más adelante como parámetros de búsqueda.

:::note

No añadas tu clave primaria, como `id`, a la lista de índices, ya que ya está optimizada.

:::

#### useSuspense() {#usesuspense}

Con [useSuspense()](/docs/api/useSuspense), esto inferirá de forma anticipada los resultados a partir de la tabla de entities si es posible,
renderizando sin esperar a que termine el fetch. Esto suele ser útil cuando la caché de entities
ya ha sido rellenada por otra petición, como una petición de lista.

```typescript
export class User extends Entity {
  id: number | undefined = undefined;
  username = '';
  email = '';
  isAdmin = false;

  // highlight-next-line
  static indexes = ['username' as const];
}
export const UserResource = resource({
  path: '/user/:id',
  schema: User,
});
```

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { UserResource } from './resources/User';

const user = useSuspense(UserResource.get, { username: 'bob' });
```

:::

:::vue

```ts
const user = await useSuspense(UserResource.get, { username: 'bob' });
```

:::

#### useQuery() {#usequery}

Con [useQuery()](/docs/api/useQuery), esto permite acceder a resultados obtenidos dentro de otras peticiones, incluso
si no existe ningún endpoint desde el que se puedan obtener.

```typescript
class LatestPrice extends Entity {
  id = '';
  symbol = '';
  price = '0.0';

  static indexes = ['symbol' as const];
}
```

```typescript
class Asset extends Entity {
  id = '';
  price = '';

  static schema = {
    price: LatestPrice,
  };
}
const getAssets = new RestEndpoint({
  path: '/assets',
  schema: [Asset],
});
```

Algún componente de nivel superior:

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { getAssets } from './resources/Asset';

const assets = useSuspense(getAssets);
```

:::

:::vue

```ts
const assets = await useSuspense(getAssets);
```

:::

Anidado debajo:

```tsx
import { useQuery } from '@data-client/react';
import { LatestPrice } from './resources/LatestPrice';

const price = useQuery(LatestPrice, { symbol: 'BTC' });
```

### Propiedad estática maxEntityDepth?: number {#maxEntityDepth}

Limita la profundidad de anidamiento de entities durante la desnormalización para evitar desbordamientos de pila
en grafos grandes de entities bidireccionales. **Por defecto: 64**

Cuando las relaciones bidireccionales crean cadenas con muchas entities únicas
(por ejemplo, `Department → Building → Department → ...`), la desnormalización puede recursar
miles de niveles de profundidad. `maxEntityDepth` trunca la resolución a la profundidad
indicada: las entities más allá del límite se devuelven con las claves foráneas anidadas sin resolver
(solo ids) en lugar de objetos completamente desnormalizados.

```typescript
class Department extends Entity {
  id = '';
  name = '';
  buildings: Building[] = [];

  pk() {
    return this.id;
  }
  static key = 'Department';
  // highlight-next-line
  static maxEntityDepth = 16;

  static schema = {
    buildings: [Building],
  };
}
```

:::tip

Establécelo en las entities que participan en relaciones bidireccionales profundas o amplias.
Los grafos de entities normales (profundidad < 10) nunca se acercan al límite por defecto.

Para relaciones que no necesitan desnormalización anticipada, [Lazy](/rest/api/Lazy)
omite por completo la resolución y te permite resolver bajo demanda mediante [useQuery](/docs/api/useQuery).

:::

## Ciclo de vida {#lifecycle}

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

import LifecycleMethods from '../shared/\_entity_lifecycle_methods.mdx';

<LifecycleMethods entitySyntax="Entity" />
