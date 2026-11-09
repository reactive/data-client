---
frameworks: [react]
title: Usando hooks com componentes de classe
---
import PkgTabs from '@site/src/components/PkgTabs';

Componentes de classe não podem chamar hooks. Para usar o Reactive Data Client com eles, envolva os hooks em um Higher Order Component
com o [hook-hoc](https://github.com/ntucker/hook-hoc). Ele também pode substituir os seus HOCs existentes.

## Instale o [hook-hoc](https://github.com/ntucker/hook-hoc) {#install-hook-hoc}

<PkgTabs pkgs="hook-hoc" />

## Uso com classes {#use-with-class}

```tsx
import { PureComponent } from 'react';
import withHook from 'hook-hoc';
import { useSuspense } from '@data-client/react';

import { User, UserResource } from './resources/User';

class Profile extends PureComponent<{
  id: number;
  user: User;
  friends: User[];
}> {
  //...
}

export default withHook(({ id }: { id: number }) => {
  const user = useSuspense(UserResource.get, { id });
  const friends = useSuspense(UserResource.getList, { friendid: id });
  return { user, friends };
})(Profile);
```

`withHook()` passa o valor de retorno da função ao componente envolvido como props.

## Extraindo a função {#extracting-the-function}

A função passada para `withHook()` chama hooks, então ela é um hook. Dê a ela um nome com `use` para que a regra de lint das
[regras dos hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) possa verificá-la, e para que você possa reutilizá-la:

```tsx
import { PureComponent } from 'react';
import withHook from 'hook-hoc';
import { useSuspense } from '@data-client/react';

import { User, UserResource } from './resources/User';

function useProfile({ id }: { id: number }) {
  const user = useSuspense(UserResource.get, { id });
  const friends = useSuspense(UserResource.getList, { friendid: id });
  return { user, friends };
}

class Profile extends PureComponent<{
  id: number;
  user: User;
  friends: User[];
}> {
  //...
}

export default withHook(useProfile)(Profile);
```

## Filtros, debounce e mais {#filters-debounce-and-more}

Coloque qualquer outro trabalho no mesmo hook. Este exemplo filtra no cliente e aplica
[debounce](../api/useDebounce.md) às requisições:

```tsx
import { useSuspense, useDebounce } from '@data-client/react';

import { UserResource } from './resources/User';

function useProfile({ id }: { id: number }) {
  const [debouncedId] = useDebounce(id, 150);

  const user = useSuspense(UserResource.get, { id: debouncedId });
  const friends = useSuspense(UserResource.getList, { friendid: debouncedId });
  const realFriends = friends.filter(friend => friend.isReal);

  return { user, friends: realFriends };
}

// rest of file...
```
