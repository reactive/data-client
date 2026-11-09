---
title: Transformar datos al hacer fetch
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

Transforma los datos en los miembros de [RestEndpoint](../api/RestEndpoint.md): [process()](../api/RestEndpoint.md#process) para
las respuestas, [getRequestInit()](../api/RestEndpoint.md#getRequestInit) para los cuerpos de las peticiones y
[parseResponse()](../api/RestEndpoint.md#parseResponse) para las cabeceras y los cuerpos sin procesar.

:::tip

Si controlas la API, cambia en su lugar los datos que envía. Un cliente delgado es más rápido y sencillo. Usa estas transformaciones
para las APIs que no controlas.

:::

## De snake a camel {#snakes-to-camels}

Muchas APIs usan claves en `snake_case`. Para usar `camelCase` en TypeScript, transforma las claves en ambas direcciones.

```typescript title="CamelResource.ts"
import { camelCase, snakeCase } from 'lodash';
import { RestEndpoint, RestGenerics } from '@data-client/rest';

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

class CamelEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
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

JSON tiene pocos tipos, así que las APIs envían muchos valores como cadenas. Ejemplos son las fechas [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
y los decimales de alta precisión ([los floats pueden perder precisión](https://floating-point-gui.de/)). Las cadenas sirven para mostrarse.
Para operar con ellas, como sumar tiempo a una fecha o multiplicar dos números, deserialízalas.

Usa [Entity.schema](../api/Entity.md#schema) con [Temporal.Instant](https://tc39.es/proposal-temporal/) y
[BigNumber](https://github.com/MikeMcl/bignumber.js):

<FrameworkPlayground groupId="schema" defaultOpen="store" fixtures={[
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
    <dl className="stats">
      <div>
        <dt>
          {currentPrice.exchangePair.toUpperCase()}, as of{' '}
          <time>
            {currentPrice.updatedAt.toLocaleString('en-US', {
              dateStyle: 'medium',
            })}
          </time>
        </dt>
        <dd>${currentPrice.price.toFormat(2)}</dd>
      </div>
    </dl>
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
  <dl class="stats">
    <div>
      <dt>
        {{ currentPrice.exchangePair.toUpperCase() }}, as of
        <time>
          {{ currentPrice.updatedAt.toLocaleString('en-US', { dateStyle: 'medium' }) }}
        </time>
      </dt>
      <dd>${{ currentPrice.price.toFormat(2) }}</dd>
    </div>
  </dl>
</template>
```

:::

</FrameworkPlayground>

### Deserializar Date {#deserializing-date}

Para usar el [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) heredado,
envuelve su constructor en un [schema](../api/schema.md) de función.

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

Algunas APIs omiten la clave primaria en la respuesta. Por ejemplo, `https://mystreamsite.tv/[username]/` devuelve un
stream sin su `username`, que es el único identificador único del stream.

Añade el `username` a partir de los argumentos del endpoint en [RestEndpoint.process()](../api/RestEndpoint.md#process).

```json title="GET https://mystreamsite.tv/ntucker/"
{
  "title": "When I'm Grandmaster, I will play faster.",
  "game": "Starcraft II",
  "current_viewers": 1337,
  "live": true
}
```

```typescript title="api/Stream.ts"
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

La respuesta del ticker de Coinbase no incluye su clave primaria `product_id`.
[RestEndpoint.process()](../api/RestEndpoint.md#process) la añade a partir del argumento `productId`.

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
    <dl className="stats">
      <div>
        <dt>{productId}</dt>
        <dd>
          <NumberFlow
            value={ticker.price}
            format={{ style: 'currency', currency: 'USD' }}
          />
        </dd>
      </div>
    </dl>
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
  <dl class="stats">
    <div>
      <dt>{{ productId }}</dt>
      <dd>
        <NumberFlow
          :value="ticker.price"
          :format="{ style: 'currency', currency: 'USD' }"
        />
      </dd>
    </div>
  </dl>
</template>
```

:::

</FrameworkPlayground>

## Uso de cabeceras HTTP {#using-http-headers}

Para leer las [cabeceras](https://developer.mozilla.org/en-US/docs/Web/API/Headers) HTTP, sobrescribe
[RestEndpoint.parseResponse()](../api/RestEndpoint.md#parseResponse). Recibe la [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
del fetch. Por ejemplo, la [paginación](./pagination.md#tokens-in-http-headers) basada en cursores puede enviar su cursor en una cabecera.

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

Para renombrar una clave que usa la API, asígnala en ambas direcciones. Tu Entity y tus componentes usan entonces solo tu nombre.

```typescript title="ArticleResource.ts"
class RenamedEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getRequestInit(body) {
    if (body && 'carrotsUsed' in body) {
      const newBody = {
        ...body,
        carrotsUsedIsThisNameTooLong: body.carrotsUsed,
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
