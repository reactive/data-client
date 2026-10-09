---
frameworks: [react]
title: React 18 Suspense con imágenes y otros medios
sidebar_label: Imágenes y otros medios
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Imágenes y otros medios

Después de configurar Reactive Data Client para obtener datos estructurados, quizás quieras incorporar
también algunas cargas de medios para aprovechar suspense y el [soporte del modo concurrente](/docs/guides/render-as-you-fetch).

## Almacenar un ArrayBuffer {#storing-arraybuffer}

[Resource](/rest/api/resource) y [Entity](/rest/api/Entity) no deben usarse en este caso, ya que ambos representan
estructuras de mapa string -> valor. En su lugar, definiremos nuestro propio [Endpoint](/rest/api/Endpoint) simple.

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

En muchos casos sería útil suspender la carga de elementos costosos como
las imágenes usando suspense. Esto resulta especialmente potente con el patrón [fetch as you render](/docs/guides/render-as-you-fetch) en modo concurrente.

[@data-client/img](https://www.npmjs.com/package/@data-client/img) ofrece un componente `<Img />` que suspende, así como un endpoint `getImage` para precargar.

## Instalación {#installation}

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

#### Precarga {#prefetching}

Ten en cuenta que esto encadenará las peticiones: hay que esperar a que se resuelva el usuario antes de que
pueda comenzar la petición de la imagen. Si la URL de la imagen es determinista a partir de los mismos parámetros, podemos iniciar esa petición al mismo tiempo que la del usuario:

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

Al usar el patrón [fetch as you render](../guides/render-as-you-fetch) en modo concurrente, usa [Controller.fetch()](../api/Controller.md#fetch) con el [Endpoint](/rest/api/Endpoint) `getImage`
para precargar la imagen.
