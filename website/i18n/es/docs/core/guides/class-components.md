---
frameworks: [react]
title: Usar hooks con componentes de clase
---
import PkgTabs from '@site/src/components/PkgTabs';

Los componentes de clase no pueden llamar a hooks. Para usar Reactive Data Client con ellos, envuelve los hooks en un Higher Order Component
con [hook-hoc](https://github.com/ntucker/hook-hoc). También puede reemplazar tus HOC existentes.

## Instalar [hook-hoc](https://github.com/ntucker/hook-hoc) {#install-hook-hoc}

<PkgTabs pkgs="hook-hoc" />

## Usar con una clase {#use-with-class}

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

`withHook()` pasa el valor de retorno de la función al componente envuelto como props.

## Extraer la función {#extracting-the-function}

La función que se pasa a `withHook()` llama a hooks, así que es un hook. Dale un nombre que empiece por `use` para que la regla de lint de las
[reglas de los hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) pueda comprobarla, y para que puedas reutilizarla:

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

## Filtros, debounce y más {#filters-debounce-and-more}

Pon cualquier otro trabajo en el mismo hook. Este ejemplo filtra en el cliente y aplica
[debounce](../api/useDebounce.md) a las solicitudes:

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
