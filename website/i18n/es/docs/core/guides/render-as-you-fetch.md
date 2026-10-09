---
frameworks: [react]
title: Renderizar mientras obtienes datos
---

import StackBlitz from '@site/src/components/StackBlitz';

Una característica de diseño central de Reactive Data Client es desacoplar la obtención real de los datos de su
uso. Esto significa que los hooks que quieren asegurar la disponibilidad de datos, como [useFetch()](../api/useFetch)
o [useSuspense()](../api/useSuspense), en realidad solo despachan la petición de fetch. [NetworkManager](../api/NetworkManager)
usa entonces su conocimiento global para determinar si debe hacer el fetch. Esto significa, por ejemplo, que
las peticiones duplicadas de datos se pueden deduplicar en un único fetch, con una sola promesa que resolver.

Otra implicación interesante es que los fetches iniciados de forma imperativa mediante [Controller.fetchIfStale()](../api/Controller.md#fetchIfStale) y [Controller.fetch()](../api/Controller.md#fetch)
no provocarán fetches redundantes. Esto se conoce como 'fetch as you render' y a menudo da como resultado
una mejor experiencia de usuario.

Estos son algunos escenarios donde este patrón es especialmente útil:

- Renderizado del lado del servidor
- Cargar datos en paralelo con el código
- [Concurrent Mode](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)
  - [useTransition()](https://react.dev/reference/react/useTransition)

Fetch-as-you-render se puede adoptar de forma incremental. Los componentes que usan datos pueden usar [useSuspense()](../api/useSuspense)
y tener la seguridad de que recibirán sus datos cuando estén listos. Y cuando más adelante se añadan las optimizaciones de render-as-you-fetch,
_esos componentes no necesitan cambiar_. Así el uso de datos queda _estrechamente acoplado_,
y la optimización del fetch _débilmente acoplada_.

<iframe loading="lazy" src="https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?embed=1&file=src/routing/routes.tsx&hidedevtools=1&view=preview&initialpath=%2Fuser%2F1&terminalHeight=1" width="100%" height="600"></iframe>

## Rutas que precargan {#routes-that-preload}

En la mayoría de los casos, el mejor momento para precargar datos es en la capa de enrutamiento. Hacerlo
hace muy fácil incorporar todas las capacidades anteriores.

Usa [Controller.fetchIfStale](../api/Controller#fetchIfStale) en el manejador de eventos de la ruta (antes de startTransition)

<!--<iframe loading="lazy" src="https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?embed=1&file=src/routing/routes.tsx&hideExplorer=1&hidedevtools=1&view=editor" width="100%" height="600"></iframe>-->

```ts
import { Controller } from '@data-client/react';
import { lazy, Route } from '@anansi/router';
import { getImage } from '@data-client/img';

import { lazyPage } from './lazyPage';
import { PostResource } from '@/resources/Post';
import { UserResource } from '@/resources/User';

export const routes: Route<Controller>[] = [
  {
    name: 'UserDetail',
    component: lazyPage('UserDetail'),
    resolveData: async (controller: Controller, match: { id: string }) => {
      if (match) {
        const fakeUser = UserResource.fromJS({
          id: Number.parseInt(match.id, 10),
        });
        // don't block on posts but start fetching
        controller.fetchIfStale(PostResource.getList, { userId: match.id });
        await Promise.all([
          controller.fetchIfStale(UserResource.get, match),
          controller.fetchIfStale(getImage, {
            src: fakeUser.profileImage,
          }),
          controller.fetchIfStale(getImage, {
            src: fakeUser.coverImage,
          }),
          controller.fetchIfStale(getImage, {
            src: fakeUser.coverImageFallback,
          }),
        ]);
      }
    },
  },
];
```

### Componentes que usan datos {#components-using-data}

[Página UserDetail](https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?file=src%2Fpages%2FUserDetail%2Findex.tsx)

```tsx
import { useSuspense } from '@data-client/react';
import { Img } from '@data-client/img';
import { Card, Avatar } from 'antd';

import { UserResource } from 'resources/Discuss';
import Boundary from 'Boundary';
import PostList from 'pages/Posts';

export type Props = { id: string };
const { Meta } = Card;

export default function UserDetail({ id }: Props) {
  const user = useSuspense(UserResource.get, { id });
  return (
    <>
      <Card cover={<Img src={user.coverImage} />}>
        <Meta
          avatar={<Img component={Avatar} src={user.profileImage} size={64} />}
          title={user.name}
          description={
            <>
              <div>{user.website}</div>
              <div>{user.company.catchPhrase}</div>
            </>
          }
        />
      </Card>
      <Boundary fallback={<CardLoading />}>
        <PostList userId={user.pk()} />
      </Boundary>
    </>
  );
}
export function CardLoading() {
  return <Card style={{ marginTop: 16 }} loading={true} />;
}
```
