---
frameworks: [react]
title: Render as you Fetch
---

import StackBlitz from '@site/src/components/StackBlitz';

Uma característica central do design do Reactive Data Client é desacoplar a obtenção real dos dados do
uso dos dados. Isso significa que hooks que querem garantir a disponibilidade dos dados, como [useFetch()](../api/useFetch)
ou [useSuspense()](../api/useSuspense), na verdade apenas despacham a requisição de fetch. O [NetworkManager](../api/NetworkManager)
então usa sua visão global para determinar se deve fazer o fetch. Isso significa, por exemplo, que
requisições duplicadas de dados podem ser deduplicadas em um único fetch, com uma única promise a resolver.

Outra implicação interessante é que fetches iniciados de forma imperativa via [Controller.fetchIfStale()](../api/Controller.md#fetchIfStale) e [Controller.fetch()](../api/Controller.md#fetch)
não resultarão em fetches redundantes. Isso é conhecido como 'fetch as you render' e frequentemente resulta
em uma experiência de usuário melhor.

Estes são alguns cenários em que esse padrão é especialmente útil:

- Server Side Rendering
- Carregar dados em paralelo com o código
- [Modo concorrente](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)
  - [useTransition()](https://react.dev/reference/react/useTransition)

O fetch-as-you-render pode ser adotado de forma incremental. Componentes que usam dados podem usar [useSuspense()](../api/useSuspense)
e ter certeza de que receberão seus dados quando estiverem prontos. E quando otimizações de render-as-you-fetch
forem adicionadas depois - _esses componentes não precisam mudar_. Isso torna o uso dos dados _fortemente acoplado_
ao componente, e a otimização do fetch _fracamente acoplada_.

<iframe loading="lazy" src="https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?embed=1&file=src/routing/routes.tsx&hidedevtools=1&view=preview&initialpath=%2Fuser%2F1&terminalHeight=1" width="100%" height="600"></iframe>

## Rotas que fazem preload {#routes-that-preload}

Na maioria dos casos, o melhor momento para fazer o prefetch dos dados é na camada de roteamento. Fazer isso
torna bastante fácil incorporar todas as capacidades acima.

Use [Controller.fetchIfStale](../api/Controller#fetchIfStale) no handler de eventos da rota (antes de startTransition)

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

### Componentes que usam dados {#components-using-data}

[UserDetail page](https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent?file=src%2Fpages%2FUserDetail%2Findex.tsx)

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
