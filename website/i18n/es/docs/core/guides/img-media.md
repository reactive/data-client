---
frameworks: [react]
title: React 18 Suspense con imágenes y otros medios
sidebar_label: Imágenes y otros medios
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Imágenes y otros medios

Reactive Data Client también puede obtener medios, de modo que las imágenes y otros datos binarios disfrutan de Suspense y de
[render-as-you-fetch](/docs/guides/render-as-you-fetch).

## Almacenar un ArrayBuffer {#storing-arraybuffer}

No uses [Resource](/rest/api/resource) ni [Entity](/rest/api/Entity) para datos binarios. Modelan objetos con
claves. Define un [Endpoint](/rest/api/Endpoint) en su lugar.

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

## Solo imágenes {#just-images}

Las imágenes también pueden suspender, de modo que un límite de Suspense espera a que se carguen. Funciona mejor con
[render-as-you-fetch](/docs/guides/render-as-you-fetch).

[@data-client/img](https://www.npmjs.com/package/@data-client/img) tiene un componente `<Img />` que suspende y un
endpoint `getImage` para precargar.

## Instalación {#installation}

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

#### Precarga {#prefetching}

El ejemplo anterior espera al usuario antes de iniciar la petición de la imagen. Si puedes calcular la URL de la imagen a partir de los mismos
parámetros, inicia ambas peticiones al mismo tiempo:

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

Con [render-as-you-fetch](/docs/guides/render-as-you-fetch), llama a [Controller.fetch()](../api/Controller.md#fetch) con
el [Endpoint](/rest/api/Endpoint) `getImage` para precargar la imagen.
