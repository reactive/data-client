---
title: Transformar datos al hacer fetch
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

Todas las peticiones de red pasan por el método `fetch()`, así que cualquier transformación necesaria se puede
hacer simplemente sobrescribiéndolo con una llamada a super.

:::tip

Nota: si conservas el control sobre el diseño de la API, en general es preferible
actualizar los datos enviados por la red. Mantener el cliente lo más `thin` (delgado) posible
ayuda tanto al rendimiento como a la complejidad.

Dicho esto, en muchos casos quieres consumir APIs sobre las que no tienes control,
ya sean APIs públicas o por la estructura interna de la organización.

:::

## De snake a camel {#snakes-to-camels}

Es habitual que las APIs se diseñen con claves en `snake_case`, pero muchos en TypeScript/JavaScript
prefieren `camelCase`. Este fragmento nos permite hacer la transformación necesaria.

```typescript title="CamelResource.ts"
import { camelCase, snakeCase } from 'lodash';
import { RestEndpoint, RestGenerics  } from '@data-client/rest';

function deeplyApplyKeyTransform(obj: any, transform: (key: string) => string) {
  const ret: Record<string, any> = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(key => {
    if (obj[key] != null && typeof obj[key] === 'object') {
      ret[transform(key)] = deeplyApplyKeyTransform(obj[key], transform);
    } else {
      ret[transform(key)] = obj[key];
    }
  });
  return ret;
}

class CamelEndpoint<O Extends RestGenerics = any> extends RestEndpoint<O> {
  getRequestInit(body) {
    // we'll need to do the inverse operation when sending data back to the server
    if (body) {
      return super.getRequestInit(deeplyApplyKeyTransform(body, snakeCase));
    }
    return super.getRequestInit(body);
  }
  process(value) {
    return deeplyApplyKeyTransform(value, camelCase);
  }
}
```

## Deserializar campos {#deserializing-fields}

En muchos casos, los datos enviados mediante JSON se serializan como cadenas, ya que JSON
solo tiene unos pocos tipos primitivos. Ejemplos comunes son [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
para las fechas o incluso cadenas para decimales que requieren alta precisión ([los floats pueden perder precisión](https://floating-point-gui.de/)).
Mantener los datos en su forma serializada suele estar bien, sobre todo si solo se usan
para mostrarse. Sin embargo, esto puede ser problemático cuando se calculan datos derivados, como sumar tiempo a una fecha
o multiplicar dos números.

En este caso, simplemente usa el [static schema](../api/Entity.md#schema) con [Temporal.Instant](https://tc39.es/proposal-temporal/) y [BigNumber](https://github.com/MikeMcl/bignumber.js)

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/price/:exchangePair'}),
args: [{ exchangePair: 'btc-usd' }],
response: {
exchangePair: 'btc-usd',
price: '32982389239823983298329832.238923982389328932893298',
updatedAt: '2026-01-01T12:00:00.000Z',
},
delay: 150,
},
]}>

```tsx title="api/Price"
import { Entity, RestEndpoint } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';
import BigNumber from 'bignumber.js';

export class ExchangePrice extends Entity {
  exchangePair = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);
  price = new BigNumber(0);
  pk() {
    return this.exchangePair;
  }
  static key = 'ExchangePrice';

  static schema = {
    updatedAt: Temporal.Instant.from,
    price: BigNumber,
  };
}
export const getPrice = new RestEndpoint({
  path: '/price/:exchangePair',
  schema: ExchangePrice,
});
```

:::react

```tsx title="PricePage"
import { useSuspense } from '@data-client/react';
import { getPrice } from './api/Price';

function PricePage() {
  const currentPrice = useSuspense(getPrice, {
    exchangePair: 'btc-usd',
  });
  return (
    <div>
      ${currentPrice.price.toFormat(2)} as of{' '}
      <time>
        {currentPrice.updatedAt.toLocaleString('en-US', { dateStyle: 'medium' })}
      </time>
    </div>
  );
}
render(<PricePage />);
```

:::

:::vue

```html title="PricePage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getPrice } from './api/Price';

  const currentPrice = await useSuspense(getPrice, {
    exchangePair: 'btc-usd',
  });
</script>

<template>
  <div>
    ${{ currentPrice.price.toFormat(2) }} as of
    <time>
      {{ currentPrice.updatedAt.toLocaleString('en-US', { dateStyle: 'medium' }) }}
    </time>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Deserializar Date {#deserializing-date}

Si quieres usar el [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) heredado,
puedes convertir el constructor en un [schema](../api/schema.md) de función.

```ts
export class ExchangePrice extends Entity {
  exchangePair = '';
  updatedAt = new Date(0);
  price = new BigNumber(0);
  pk() {
    return this.exchangePair;
  }
  static key = 'ExchangePrice';

  static schema = {
    // highlight-next-line
    updatedAt: iso => new Date(iso),
    price: BigNumber,
  };
}
```

## El caso del `Id` que falta {#case-of-the-missing-id}

Ahora quieres integrarte con un nuevo y estupendo sitio de streaming llamado `mystreamsite.tv`. Tiene
una API sencilla para recuperar información sobre los streams actuales. Puedes obtener un stream con el
patrón de URL `https://mystreamsite.tv/[username]/`. Sin embargo, por alguna razón, ¡no
devuelven el nombre de usuario en el cuerpo de la respuesta! Quieres poder referirte a él, y es
el único identificador que define de forma única a la clase.

Podemos simplemente extraer el nombre de usuario de la propia URL de la petición y añadirlo a la
respuesta.

```json title="GET https://mystreamsite.tv/ntucker/"
{
  "title": "When I'm Grandmaster, I will play faster.",
  "game": "Starcraft II",
  "current_viewers": 1337,
  "live": true
}
```

```typescript title="api/Stream.ts"
const USERNAME_MATCHER = /.*\/([^\/]+)\/?/;

class Stream extends Entity {
  username = '';
  title = '';
  game = '';
  currentViewers = 0;
  live = false;

  pk() {
    return this.username;
  }
  static key = 'Stream';
}

const getStream = new RestEndpoint({
  urlPrefix: 'https://mystreamsite.tv',
  path: '/:username',
  schema: Stream,
  // highlight-start
  process(value, { username }) {
    value.username = username;
    return value;
  },
  // highlight-end
});
```

### Precios de ticker {#ticker-prices}

Este es un ejemplo del mundo real de una API en la que los datos del ticker no incluyen su clave primaria `product_id`.

Usamos [RestEndpoint.process()](../api/RestEndpoint.md#process) para añadir el miembro `product_id` a partir de su argumento.

<FrameworkPlayground row>

```typescript title="Ticker" {29-32}
import { Entity, RestEndpoint } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

export class Ticker extends Entity {
  product_id = '';
  trade_id = 0;
  price = 0;
  size = '0';
  time = Temporal.Instant.fromEpochMilliseconds(0);
  bid = '0';
  ask = '0';
  volume = '';

  pk(): string {
    return this.product_id;
  }
  static key = 'Ticker';

  static schema = {
    price: Number,
    time: Temporal.Instant.from,
  };
}

export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  process(value, { productId }) {
    value.product_id = productId;
    return value;
  },
  pollFrequency: 2000,
});
```

:::react

```tsx title="AssetPrice" {6} collapsed
import { useLive } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getTicker } from './Ticker';

function AssetPrice({ productId }: Props) {
  const ticker = useLive(getTicker, { productId });
  return (
    <center>
      {productId}{' '}
      <NumberFlow
        value={ticker.price}
        format={{ style: 'currency', currency: 'USD' }}
      />
    </center>
  );
}
interface Props {
  productId: string;
}
render(<AssetPrice productId="BTC-USD" />);
```

:::

:::vue

```html title="AssetPrice.vue" {8} collapsed
<script setup lang="ts">
  import { useLive } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import { getTicker } from './Ticker';

  const props = defineProps<{ productId: string }>();

  const ticker = await useLive(getTicker, () => ({
    productId: props.productId,
  }));
</script>

<template>
  <div style="text-align: center">
    {{ productId }}
    <NumberFlow
      :value="ticker.price"
      :format="{ style: 'currency', currency: 'USD' }"
    />
  </div>
</template>
```

:::

</FrameworkPlayground>

## Uso de cabeceras HTTP {#using-http-headers}

Las [cabeceras](https://developer.mozilla.org/en-US/docs/Web/API/Headers) HTTP son accesibles en la
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) del fetch. [RestEndpoint.fetchResponse()](../api/RestEndpoint.md#fetchResponse)
puede usarse para construir un [RestEndpoint](../api/RestEndpoint.md).

A veces esto se usa para la [paginación](./pagination.md#tokens-in-http-headers) basada en cursores.

```typescript
import { RestEndpoint, RestGenerics } from '@data-client/rest';

class GithubEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async parseResponse(response: Response) {
    const results = await super.parseResponse(response);
    if (
      (response.headers && response.headers.has('link')) ||
      Array.isArray(results)
    ) {
      return {
        link: response.headers.get('link'),
        results,
      };
    }
    return results;
  }
}
```

## Descarga de archivos {#file-download}

Para los endpoints que devuelven datos binarios (archivos, imágenes, PDFs), establece
[`content: 'blob'`](../api/RestEndpoint.md#content). El tipo de retorno es `Blob` y
`schema` es `undefined` por defecto (los datos binarios no se pueden normalizar). Usa `dataExpiryLength: 0`
para evitar guardar blobs grandes en la caché en memoria.

```typescript title="downloadFile.ts"
import { RestEndpoint } from '@data-client/rest';

export const downloadFile = new RestEndpoint({
  path: '/files/:id/download',
  content: 'blob',
  dataExpiryLength: 0,
});
```

:::react

```tsx title="DownloadButton.tsx"
import { useController } from '@data-client/react';
import { downloadFile } from './downloadFile';

function DownloadButton({ id }: { id: string }) {
  const ctrl = useController();

  const handleDownload = async () => {
    const blob: Blob = await ctrl.fetch(downloadFile, { id });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download';
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleDownload}>Download</button>;
}
```

:::

:::vue

```html title="DownloadButton.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { downloadFile } from './downloadFile';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const handleDownload = async () => {
    const blob: Blob = await ctrl.fetch(downloadFile, { id: props.id });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download';
    a.click();
    URL.revokeObjectURL(url);
  };
</script>

<template>
  <button @click="handleDownload">Download</button>
</template>
```

:::

Para extraer el nombre de archivo de la cabecera `Content-Disposition`, sobrescribe
[parseResponse](../api/RestEndpoint.md#parseResponse):

```typescript title="downloadFile.ts"
import { RestEndpoint } from '@data-client/rest';

export const downloadFile = new RestEndpoint({
  path: '/files/:id/download',
  content: 'blob',
  dataExpiryLength: 0,
  async parseResponse(response) {
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    const filename =
      disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? 'download';
    return { blob, filename };
  },
  process(value): { blob: Blob; filename: string } {
    return value;
  },
});
```

Para las respuestas `ArrayBuffer` (útiles para procesar datos binarios en memoria), usa
`content: 'arrayBuffer'` de la misma manera.

## Renombrar claves {#name-calling}

A veces una API puede cambiar el nombre de una clave, o elegir uno que no te gusta. Por supuesto,
tú tienes estándares de nomenclatura mucho mejores, así que en lugar de cambiar la definición de tu clase `Resource`
y todo tu código, solo quieres reasignar esa clave.

```typescript title="ArticleResource.ts"
class RenamedEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getRequestInit(body) {
    if (body && 'carrotsUsed' in body) {
      const newBody = {
        ...body,
        carrotsUSedIsThisNameTooLong: carrotsUsed,
      };
      delete newBody.carrotsUsed;
      return super.getRequestInit(newBody);
    }
    return super.getRequestInit(body);
  }
  process(value) {
    if ('carrotsUsedIsThisNameTooLong' in value) {
      // ok to mutate jsonResponse since we control it
      value.carrotsUsed = value.carrotsUsedIsThisNameTooLong;
      delete value.carrotsUsedIsThisNameTooLong;
    }
    return value;
  }
}
```
