---
frameworks: [react]
title: Suspense do React 18 com imagens e outras mídias
sidebar_label: Imagens e outras mídias
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Imagens e outras mídias

Depois de configurar o Reactive Data Client para buscar dados estruturados, você pode querer incorporar
também algumas buscas de mídia para aproveitar o suspense e o [suporte ao modo concorrente](/docs/guides/render-as-you-fetch).

## Armazenando ArrayBuffer {#storing-arraybuffer}

[Resource](/rest/api/resource) e [Entity](/rest/api/Entity) não devem ser usados neste caso, pois ambos representam
estruturas de mapa string -> valor. Em vez disso, definiremos nosso próprio [Endpoint](/rest/api/Endpoint) simples.

```typescript
import { Endpoint } from '@data-client/rest';

export const getPhoto = new Endpoint(async ({ userId }: { userId: string }) => {
  const response = await fetch(`/users/${userId}/photo`);
  const photoArrayBuffer = await response.arrayBuffer();

  return photoArrayBuffer;
});
```

<Tabs
defaultValue="useSuspense"
values={[
{ label: 'useSuspense', value: 'useSuspense' },
{ label: 'useCache', value: 'useCache' },
{ label: 'JS/Node', value: 'JS/Node' },
]}>
<TabItem value="useSuspense">

```tsx nocheck
// photo is typed as ArrayBuffer
const photo = useSuspense(getPhoto, { userId });
```

</TabItem>
<TabItem value="useCache">

```tsx nocheck
// photo will be undefined if the fetch hasn't completed
// photo will be ArrayBuffer if the fetch has completed
const photo = useCache(getPhoto, { userId });
```

</TabItem>
<TabItem value="JS/Node">

```tsx nocheck
// photo is typed as ArrayBuffer
const photo = await getPhoto({ userId });
```

</TabItem>
</Tabs>

## Apenas imagens {#just-images}

Em muitos casos, seria útil suspender o carregamento de itens custosos, como
imagens, usando suspense. Isso se torna especialmente poderoso com o padrão [fetch as you render](/docs/guides/render-as-you-fetch) no modo concorrente.

O [@data-client/img](https://www.npmjs.com/package/@data-client/img) fornece um componente `<Img />` que suspende, assim como o endpoint `getImage` para prefetch.

## Instalação {#installation}

<PkgTabs pkgs="@data-client/img" />

## Uso {#usage}

```tsx title="Profile.tsx"
import React, { ImgHTMLAttributes } from 'react';
import { useSuspense } from '@data-client/react';
import { Img } from '@data-client/img';
import { UserResource } from './resources/User';

export default function Profile({ username }: { username: string }) {
  const user = useSuspense(UserResource.get, { username });
  return (
    <div>
      <Img
        src={user.img}
        alt="React Logo"
        style={{ height: '32px', width: '32px' }}
      />
      <h2>{user.fullName}</h2>
    </div>
  );
}
```

#### Prefetch {#prefetching}

Observe que isso fará as requisições em cascata, esperando o user ser resolvido antes
que a requisição da imagem possa começar. Se a url da imagem for determinística com base nos mesmos parâmetros, podemos iniciar essa requisição ao mesmo tempo que a requisição do user:

```tsx title="Profile.tsx"
import React, { ImgHTMLAttributes } from 'react';
import { useSuspense, useFetch } from '@data-client/react';
import { Img, getImage } from '@data-client/img';
import { UserResource } from './resources/User';

export default function Profile({ username }: { username: string }) {
  const imageSrc = `/profile_images/${username}}`;
  useFetch(getImage, { src: imageSrc });
  const user = useSuspense(UserResource.get, { username });
  return (
    <div>
      <Img
        src={imageSrc}
        alt="React Logo"
        style={{ height: '32px', width: '32px' }}
      />
      <h2>{user.fullName}</h2>
    </div>
  );
}
```

Ao usar o padrão [fetch as you render](../guides/render-as-you-fetch) no modo concorrente, use [Controller.fetch()](../api/Controller.md#fetch) com o `getImage`
[Endpoint](/rest/api/Endpoint) para pré-carregar a imagem.
