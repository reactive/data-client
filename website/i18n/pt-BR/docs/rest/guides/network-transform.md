---
title: Transformando dados no fetch
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

Transforme dados nos membros do [RestEndpoint](../api/RestEndpoint.md): [process()](../api/RestEndpoint.md#process) para
respostas, [getRequestInit()](../api/RestEndpoint.md#getRequestInit) para corpos de requisição e
[parseResponse()](../api/RestEndpoint.md#parseResponse) para headers e corpos brutos.

:::tip

Se você controla a API, altere os dados que ela envia. Um cliente enxuto é mais rápido e simples. Use estas transformações
para APIs que você não controla.

:::

## De snake para camel {#snakes-to-camels}

Muitas APIs usam chaves em `snake_case`. Para usar `camelCase` no TypeScript, transforme as chaves nos dois sentidos.

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

## Desserializando campos {#deserializing-fields}

O JSON tem poucos tipos, então as APIs enviam muitos valores como strings. Exemplos são datas em [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
e decimais de alta precisão ([floats podem perder precisão](https://floating-point-gui.de/)). Não há problema em exibir strings.
Para fazer cálculos com elas, como somar tempo a uma data ou multiplicar dois números, desserialize-as.

Use [Entity.schema](../api/Entity.md#schema) com [Temporal.Instant](https://tc39.es/proposal-temporal/) e
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

### Desserializando Date {#deserializing-date}

Para usar o [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) legado,
envolva o construtor dele em um [schema](../api/schema.md) de função.

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

## O caso do `Id` ausente {#case-of-the-missing-id}

Algumas APIs deixam a chave primária fora da resposta. Por exemplo, `https://mystreamsite.tv/[username]/` retorna uma
transmissão sem o seu `username`, que é o único identificador único da transmissão.

Adicione o `username` a partir dos argumentos do endpoint em [RestEndpoint.process()](../api/RestEndpoint.md#process).

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

### Preços de ticker {#ticker-prices}

A resposta de ticker da Coinbase não inclui sua chave primária `product_id`.
[RestEndpoint.process()](../api/RestEndpoint.md#process) a adiciona a partir do argumento `productId`.

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

## Usando headers HTTP {#using-http-headers}

Para ler os [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) HTTP, sobrescreva
[RestEndpoint.parseResponse()](../api/RestEndpoint.md#parseResponse). Ele recebe a
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) do fetch. Por exemplo, a
[paginação](./pagination.md#tokens-in-http-headers) baseada em cursor pode enviar seu cursor em um header.

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

## Download de arquivos {#file-download}

Para endpoints que retornam dados binários (arquivos, imagens, PDFs), defina
[`content: 'blob'`](../api/RestEndpoint.md#content). O tipo de retorno é `Blob` e
`schema` tem `undefined` como padrão (dados binários não são normalizáveis). Use `dataExpiryLength: 0`
para evitar manter blobs grandes em cache na memória.

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

Para extrair o nome do arquivo do header `Content-Disposition`, sobrescreva
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

Para respostas `ArrayBuffer` (úteis para processar dados binários em memória), use
`content: 'arrayBuffer'` da mesma forma.

## Renomeando campos {#name-calling}

Para renomear uma chave que a API usa, mapeie-a nos dois sentidos. Sua Entity e seus componentes passam a usar apenas o seu nome.

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
