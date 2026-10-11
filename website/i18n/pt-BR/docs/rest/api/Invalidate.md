---
title: Schema Invalidate - Invalidando entidades
sidebar_label: Invalidate
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

# Invalidate

Descreve entidades a serem marcadas como [INVALID](/docs/concepts/expiry-policy#invalid). Isso remove itens de uma
collection ou [força o suspense](/docs/concepts/expiry-policy#invalidate-entity) em endpoints nos quais a entidade é obrigatória. 

## Construtor {#constructor}

```typescript
new Invalidate(entity)
new Invalidate(union)
new Invalidate(entityMap, schemaAttribute)
```

- `entity`: Uma [Entity](./Entity.md) singular a invalidar.
- `union`: Um schema [Union](./Union.md) para invalidação polimórfica.
- `entityMap`: Um mapeamento de chaves de schema para [Entities](./Entity.md).
- `schemaAttribute`: _opcional_ (obrigatório se `entityMap` for usado) O atributo de cada entidade encontrada que define qual schema, conforme o entityMap, usar na normalização.
  Pode ser uma string ou uma função. Se for uma função, recebe os seguintes argumentos:
  - `value`: O valor de entrada da entidade.
  - `parent`: O objeto pai do array de entrada.
  - `key`: A chave sob a qual o array de entrada aparece no objeto pai.

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

### Invalidação em lote {#batch-invalidation}

Aqui adicionamos outro endpoint para excluir várias entidades de uma só vez, envolvendo
`Invalidate` em um array. O `Data Client` pode então fazer `invalidate` de cada
entidade da resposta.

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

Às vezes o nosso backend não retorna nada para 'DELETE'. Nesse
caso, podemos usar [process](./RestEndpoint.md#process) para construir
uma resposta utilizável a partir do argumento `body`.

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

Para excluir várias entidades sem um endpoint, como a partir de uma mensagem de websocket, passe o mesmo schema para
[Controller.set()](/docs/api/Controller#set-array):

```ts
ctrl.set([new Invalidate(Post)], [{ id: '5' }, { id: '13' }, { id: '7' }]);
```

Ou exclua uma única entidade:

```ts
ctrl.set(new Invalidate(Post), { id: '5' });
```

### Tipos polimórficos {#polymorphic-types}

Se o seu endpoint pode excluir mais de um tipo de entidade, você pode usar a invalidação polimórfica.

#### Com o schema Union {#with-union-schema}

A abordagem mais simples é passar diretamente um schema [Union](./Union.md) existente:

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

#### schemaAttribute string {#string-schemaattribute}

Como alternativa, defina o mapeamento polimórfico inline com um atributo string:

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

#### schemaAttribute função {#function-schemaattribute}

Os valores retornados devem corresponder a uma chave no mapa de entidades. Isso é útil para lógicas de discriminação mais complexas:

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

### Impacto no useSuspense() {#impact-on-usesuspense}

Quando entidades são invalidadas em um resultado que está sendo apresentado no :react[React]:vue[Vue], useSuspense()
as considerará inválidas

- Para Entities opcionais, elas são simplesmente removidas
- Para Entities obrigatórias, isso invalida a resposta inteira, disparando o suspense novamente.
