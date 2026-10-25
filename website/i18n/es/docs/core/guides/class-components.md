---
frameworks: [react]
title: Usar hooks con componentes de clase
---
import PkgTabs from '@site/src/components/PkgTabs';

Los hooks son geniales, pero muchos trabajamos con código existente o bibliotecas
basadas en componentes de clase. Algunos podrían migrarse con facilidad, pero otros podrían ser
más difíciles. ¿Debería esto impedirte adoptar Reactive Data Client? ¡Por supuesto que no!

Con la sencilla biblioteca de interoperabilidad [hook-hoc](https://github.com/ntucker/hook-hoc)
podemos crear Higher Order Components a partir de hooks con mucha facilidad. Esto nos permite
reemplazar cualquier HOC existente sin esfuerzo.

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

Como puedes ver, el valor de retorno de la función que pasas se inyecta en las props
del componente que envuelves.

## Extraer la función {#extracting-the-function}

Quizás notes que la función que pasamos a `withHook()` es una función que llama a
hooks. Eso la convierte en un hook por definición. Para que las [reglas de los hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
puedan detectarla y, además, para poder reutilizarla, la movemos a una función con nombre:

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

A menudo harás algo más que simplemente obtener los datos. Podemos
hacer todo ese trabajo adicional en el hook que acabamos de crear. Aquí agregaremos
filtrado del lado del cliente y también aplicaremos [debounce](https://usehooks.com/useDebounce/) a las propias solicitudes.

Puedes combinar cualquier hook aquí: el cielo es el límite.

```tsx
import { useSuspense, useDebounce } from '@data-client/react';

import { UserResource } from './resources/User';

function useProfile({ id }: { id: number }) {
  const debouncedId = useDebounce(id, 150);

  const user = useSuspense(UserResource.get, { id });
  const friends = useSuspense(UserResource.getList, { friendid: id });
  const realFriends = friends.filter(friend => friend.isReal);

  return { user, friends: realFriends };
}

// rest of file...
```
