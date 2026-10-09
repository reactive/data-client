---
frameworks: [react]
title: Usando hooks com componentes de classe
---
import PkgTabs from '@site/src/components/PkgTabs';

Hooks são ótimos, mas muitos de nós trabalhamos com bases de código ou bibliotecas existentes
baseadas em componentes de classe. Alguns podem ser fáceis de migrar, mas outros podem ser
mais difíceis. Isso deveria impedir você de adotar o Reactive Data Client? Claro que não!

Usando a biblioteca simples de interoperabilidade [hook-hoc](https://github.com/ntucker/hook-hoc),
podemos criar Higher Order Components a partir de hooks com bastante facilidade. Isso nos permite
substituir qualquer HOC existente sem esforço.

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

Aqui você pode ver que o valor de retorno da função que você passa é injetado nas props
do componente que você envolve.

## Extraindo a função {#extracting-the-function}

Você pode notar que a função que passamos para `withHook()` é uma função que chama
hooks. Isso a torna um hook por definição. Para que isso seja detectável pelas [regras dos hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
e também potencialmente reutilizável, vamos movê-la para uma função nomeada:

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

Muitas vezes você fará um pouco mais do que apenas obter os dados. Podemos
fazer todo esse trabalho extra no hook que acabamos de criar. Aqui vamos adicionar
um pouco de filtragem no cliente, além de aplicar [debounce](https://usehooks.com/useDebounce/) às próprias requisições.

Você pode combinar quaisquer hooks aqui - o céu é o limite.

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
