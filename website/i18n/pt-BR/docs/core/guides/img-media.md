---
frameworks: [react]
title: Suspense do React 18 com imagens e outras mídias
sidebar_label: Imagens e outras mídias
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Imagens e outras mídias

O Reactive Data Client também pode buscar mídia, então imagens e outros dados binários ganham Suspense e
[render-as-you-fetch](/docs/guides/render-as-you-fetch).

## Armazenando ArrayBuffer {#storing-arraybuffer}

Não use [Resource](/rest/api/resource) nem [Entity](/rest/api/Entity) para dados binários. Eles modelam objetos com
chaves. Defina um [Endpoint](/rest/api/Endpoint) em vez disso.

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

Imagens também podem suspender, então um boundary Suspense espera que elas carreguem. Isso funciona melhor com
[render-as-you-fetch](/docs/guides/render-as-you-fetch).

O [@data-client/img](https://www.npmjs.com/package/@data-client/img) tem um componente `<Img />` que suspende e um
endpoint `getImage` para prefetch.

## Instalação {#installation}

<PkgTabs pkgs="@data-client/img" />

## Uso {#usage}

```tsx title="Profile.tsx"
import React from 'react';
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

O exemplo acima espera o user antes de iniciar a requisição da imagem. Se você puder calcular a url da imagem a partir dos mesmos
parâmetros, inicie as duas requisições ao mesmo tempo:

```tsx title="Profile.tsx"
import React from 'react';
import { useSuspense, useFetch } from '@data-client/react';
import { Img, getImage } from '@data-client/img';
import { UserResource } from './resources/User';

export default function Profile({ username }: { username: string }) {
  const imageSrc = `/profile_images/${username}`;
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

Com [render-as-you-fetch](/docs/guides/render-as-you-fetch), chame [Controller.fetch()](../api/Controller.md#fetch) com
o `getImage` [Endpoint](/rest/api/Endpoint) para pré-carregar a imagem.
