---
title: Schema Invalidate - Invalidar entities
sidebar_label: Invalidate
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

# Invalidate

Describe las entities que se marcarán como [INVALID](/docs/concepts/expiry-policy#invalid). Esto elimina elementos de una
colección, o [fuerza el suspense](/docs/concepts/expiry-policy#invalidate-entity) en los endpoints donde la entity es obligatoria. 

## Constructor {#constructor}

```typescript
new Invalidate(entity)
new Invalidate(union)
new Invalidate(entityMap, schemaAttribute)
```

- `entity`: Una única [Entity](./Entity.md) que se invalidará.
- `union`: Un schema [Union](./Union.md) para la invalidación polimórfica.
- `entityMap`: Una asociación de claves de schema a [Entities](./Entity.md).
- `schemaAttribute`: _opcional_ (obligatorio si se usa `entityMap`) El atributo de cada entity encontrada que define qué schema, según el entityMap, se usará al normalizar.
  Puede ser un string o una función. Si se le da una función, acepta los siguientes argumentos:
  - `value`: El valor de entrada de la entity.
  - `parent`: El objeto padre del array de entrada.
  - `key`: La clave con la que el array de entrada aparece en el objeto padre.

## Uso {#usage}

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
    { id: '123', name: 'Jim' },
    { id: '456', name: 'Jane' },
    { id: '555', name: 'Phone' },
  ],
delay: 150,
},
{
  endpoint: new RestEndpoint({path: '/users/:id', method: 'DELETE' }),
  response({id}) {
    return {id}
  },
  delay: 150,
}
]}>

```typescript title="api/User"
import { Entity, RestEndpoint, Collection, Invalidate } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new Collection([User]),
});
export const deleteUser = new RestEndpoint({
  path: '/users/:id',
  method: 'DELETE',
  schema: new Invalidate(User),
});
```

:::react

```tsx title="UserPage"
import { useSuspense, useController } from '@data-client/react';
import { getUsers, deleteUser } from './api/User';

function UsersPage() {
  const users = useSuspense(getUsers);
  const ctrl = useController();
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>
          {user.name}{' '}
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => ctrl.fetch(deleteUser, { id: user.id })}
          >
            ❌
          </span>
        </div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```html title="UsersPage.vue"
<script setup lang="ts">
  import { useSuspense, useController } from '@data-client/vue';
  import { getUsers, deleteUser } from './api/User';

  const users = await useSuspense(getUsers);
  const ctrl = useController();
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">
      {{ user.name }}
      <span
        style="cursor: pointer"
        @click="ctrl.fetch(deleteUser, { id: user.id })"
      >
        ❌
      </span>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Invalidación por lotes {#batch-invalidation}

Aquí agregamos otro endpoint para eliminar varias entities a la vez envolviendo
`Invalidate` en un array. `Data Client` puede entonces usar `invalidate` en cada
entity de la respuesta.

<EndpointPlayground
input="/posts"
init={
  {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(['5', '13', '7']),
  }
}
status={200}
response={[{ id: '5' }, { id: '13' }, { id: '7' }]}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  author = '';
}
```

```typescript title="Resource" {9}
import { resource, Invalidate } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/posts/:id',
}).extend('deleteMany', {
  path: '/posts',
  body: [] as string[],
  method: 'DELETE',
  schema: [new Invalidate(Post)],
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.deleteMany(['5', '13', '7']);
```

</EndpointPlayground>

A veces nuestro backend no devuelve nada para 'DELETE'. En este
caso, podemos usar [process](./RestEndpoint.md#process) para construir
una respuesta utilizable a partir del argumento `body`.

<EndpointPlayground
input="/posts"
init={
  {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(['5', '13', '7']),
  }
}
status={204}
response={undefined}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  author = '';
}
```

```typescript title="Resource" {10-13}
import { resource, Invalidate } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/posts/:id',
}).extend('deleteMany', {
  path: '/posts',
  body: [] as string[],
  method: 'DELETE',
  schema: [new Invalidate(Post)],
  process(value, body) {
    // use the body payload to inform which entities to delete
    return body.map(id => ({ id }));
  }
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.deleteMany(['5', '13', '7']);
```

</EndpointPlayground>

Para eliminar varias entities sin un endpoint, por ejemplo desde un mensaje de websocket, pasa el mismo schema a
[Controller.set()](/docs/api/Controller#set-array):

```ts
ctrl.set([new Invalidate(Post)], [{ id: '5' }, { id: '13' }, { id: '7' }]);
```

O elimina una sola entity:

```ts
ctrl.set(new Invalidate(Post), { id: '5' });
```

### Tipos polimórficos {#polymorphic-types}

Si tu endpoint puede eliminar más de un tipo de entity, puedes usar la invalidación polimórfica.

#### Con un schema Union {#with-union-schema}

El enfoque más simple es pasar directamente un schema [Union](./Union.md) existente:

```typescript
import { Entity, RestEndpoint, Union, Invalidate } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
  readonly type = 'users';
}
class Group extends Entity {
  id = '';
  groupname = '';
  readonly type = 'groups';
}

const MemberUnion = new Union(
  { users: User, groups: Group },
  'type'
);

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(MemberUnion),
});
```

#### schemaAttribute de tipo string {#string-schemaattribute}

Como alternativa, define la asociación polimórfica en línea con un atributo de tipo string:

```typescript
import { RestEndpoint, Invalidate } from '@data-client/rest';

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(
    { users: User, groups: Group },
    'type'
  ),
});
```

#### schemaAttribute de tipo función {#function-schemaattribute}

Los valores devueltos deben coincidir con una clave del mapa de entities. Esto es útil para una lógica de discriminación más compleja:

```typescript
import { RestEndpoint, Invalidate } from '@data-client/rest';

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(
    { users: User, groups: Group },
    (input, parent, key) => input.memberType === 'user' ? 'users' : 'groups'
  ),
});
```

### Impacto en useSuspense() {#impact-on-usesuspense}

Cuando se invalidan entities en un resultado que se está presentando actualmente en :react[React]:vue[Vue], useSuspense()
las considerará inválidas

- Las Entities opcionales simplemente se eliminan
- En el caso de las Entities obligatorias, se invalida la respuesta completa y se vuelve a activar el suspense.
