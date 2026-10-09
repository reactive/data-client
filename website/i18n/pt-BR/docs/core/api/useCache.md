---
title: useCache() - Acesso ao store de dados normalizados no React
vue_title: useCache() - Acesso ao store de dados normalizados no Vue
sidebar_label: useCache()
description: Renderização de dados sem o fetch. Acesse a resposta de qualquer Endpoint.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import VueArgs from '../shared/\_vueArgs.mdx';
import { RestEndpoint } from '@data-client/rest';

# useCache()

Renderização de dados sem o fetch.

Acessa a resposta de qualquer [Endpoint](/rest/api/Endpoint). Se a resposta não existir, retorna
`undefined`. Isso pode ser usado para verificar a existência de um `Endpoint's`, como para autenticação.

`useCache()` reage às [mutações](../getting-started/mutations.md) de dados; renderizando novamente apenas quando necessário.

## Uso {#usage}

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/user'}),
args: [],
response: { id: '777', name: 'Albatras', isAdmin: true },
delay: 500,
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
}).extend('current', {
  path: '/user',
  schema: User,
});
```

:::react

```tsx title="Unauthed" collapsed
import { useController, useLoading } from '@data-client/react';
import { UserResource } from './UserResource';

export default function Unauthed() {
  const ctrl = useController();
  const [handleLogin, loading] = useLoading(
    (e: any) => ctrl.fetch(UserResource.current),
    [],
  );
  return (
    <div>
      <p>Not authorized</p>
      {loading ? (
        'logging in...'
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

```tsx title="Authorized" collapsed
import { useController } from '@data-client/react';
import { User, UserResource } from './UserResource';

export default function Authorized({ user }: { user: User }) {
  const ctrl = useController();
  const handleLogout = (e: any) => ctrl.invalidate(UserResource.current);

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

```tsx title="Entry"
import { useCache } from '@data-client/react';
import { UserResource } from './UserResource';
import Unauthed from './Unauthed';
import Authorized from './Authorized';

function AuthorizedPage() {
  // currentUser as User | undefined
  const currentUser = useCache(UserResource.current);
  // user is not logged in
  if (!currentUser) return <Unauthed />;
  // currentUser as User (typeguarded)
  return <Authorized user={currentUser} />;
}
render(<AuthorizedPage />);
```

:::

:::vue

```html title="Unauthed.vue" collapsed
<script setup lang="ts">
  import { useController, useLoading } from '@data-client/vue';
  import { UserResource } from './UserResource';

  const ctrl = useController();
  const [handleLogin, loading] = useLoading(() =>
    ctrl.fetch(UserResource.current),
  );
</script>

<template>
  <div>
    <p>Not authorized</p>
    <template v-if="loading">logging in...</template>
    <button v-else @click="handleLogin">Login</button>
  </div>
</template>
```

```html title="Authorized.vue" collapsed
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { UserResource, type User } from './UserResource';

  defineProps<{ user: User }>();
  const ctrl = useController();
  const handleLogout = () => ctrl.invalidate(UserResource.current);
</script>

<template>
  <div>
    <p>Welcome, {{ user.name }}!</p>
    <button @click="handleLogout">Logout</button>
  </div>
</template>
```

```html title="AuthorizedPage.vue"
<script setup lang="ts">
  import { useCache } from '@data-client/vue';
  import { UserResource } from './UserResource';
  import Unauthed from './Unauthed.vue';
  import Authorized from './Authorized.vue';

  // currentUser as ComputedRef<User | undefined>
  const currentUser = useCache(UserResource.current);
</script>

<template>
  <!-- currentUser is unwrapped in the template -->
  <Authorized v-if="currentUser" :user="currentUser" />
  <!-- user is not logged in -->
  <Unauthed v-else />
</template>
```

:::

</FrameworkPlayground>

Veja [truthiness narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing) para
mais informações sobre o tratamento de tipos

## Comportamento {#behavior}

:::vue

`useCache()` retorna um [ComputedRef](https://vuejs.org/api/reactivity-core.html#computed). A tabela
abaixo descreve seu `.value`.

:::

| Status de expiração | Retorna      | Condições                                                                                                                                                              |
| ------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid             | `undefined`  | não está no store, [exclusão](/rest/api/resource#delete), [invalidação](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Stale               | desnormalizado | (primeira renderização, mudança de argumentos) & [expiração &lt; agora](../concepts/expiry-policy.md)                                                                  |
| Valid               | desnormalizado | conclusão do fetch                                                                                                                                                     |
|                     | `undefined`  | `null` usado como segundo argumento                                                                                                                                    |

<ConditionalDependencies hook="useCache" />

## Tipos {#types}

:::react

<GenericsTabs>

```typescript
function useCache(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Denormalize<typeof endpoint.schema> | null;
```

```typescript
function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined>,
    'key' | 'schema' | 'invalidIfStale'
  >,
  Args extends readonly [...Parameters<E['key']>] | readonly [null],
>(endpoint: E, ...args: Args): DenormalizeNullable<E['schema']>;
```

</GenericsTabs>

:::

:::vue

```typescript
function useCache(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint.key>> | [null]
): ComputedRef<DenormalizeNullable<typeof endpoint.schema>>;
```

<VueArgs />

O resultado é atualizado quando os argumentos mudam.

:::

:::react

## Exemplos {#examples}

### Login/logout na navbar do Github {#github-navbar-loginlogout}

O usuário atual só existe quando estamos autenticados. Assim, podemos usar `useCache(UserResource.current)`
para determinar se devemos mostrar os botões de navegação de login ou de logout.

<StackBlitz app="github-app" file="src/resources/User.ts,src/navigation/NavBar.tsx" view="editor" />

### Autorização de comentários no Github {#github-comment-authorization}

Aqui só mostramos o formulário de comentário se o usuário estiver autenticado.

<StackBlitz app="github-app" file="src/resources/User.ts,src/pages/IssueDetail/CreateComment.tsx" view="editor" />

:::
