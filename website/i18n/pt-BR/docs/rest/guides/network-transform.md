---
title: Transformando dados no fetch
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

Todas as requisições de rede passam pelo método `fetch()`, então qualquer transformação necessária pode simplesmente
ser feita sobrescrevendo-o com uma chamada a super.

:::tip

Observação: se você mantém o controle sobre o design da API, geralmente é preferível
atualizar os dados enviados pela rede. Manter o cliente o mais enxuto (`thin`) possível
ajuda tanto no desempenho quanto na complexidade.

Dito isso, em muitos casos você quer consumir APIs sobre as quais não tem controle -
seja por serem APIs públicas ou por causa da estrutura organizacional interna.

:::

## De snake para camel {#snakes-to-camels}

É comum que APIs sejam projetadas com chaves em `snake_case`, mas muitos em typescript/javascript
preferem `camelCase`. Este trecho nos permite fazer a transformação necessária.

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

## Desserializando campos {#deserializing-fields}

Em muitos casos, os dados enviados via JSON são serializados como strings, já que o JSON
tem apenas alguns tipos primitivos. Exemplos comuns incluem [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
para datas ou até strings para decimais que exigem alta precisão ([floats podem perder precisão](https://floating-point-gui.de/)).
Manter os dados na forma serializada costuma ser aceitável, especialmente se forem usados apenas para
exibição. No entanto, isso pode ser problemático quando dados derivados são computados, como somar tempo a uma data
ou multiplicar dois números.

Nesse caso, basta usar o [static schema](../api/Entity.md#schema) com [Temporal.Instant](https://tc39.es/proposal-temporal/) e [BigNumber](https://github.com/MikeMcl/bignumber.js)

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

### Desserializando Date {#deserializing-date}

Caso queira usar o [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) legado,
você pode transformar o construtor em um [schema](../api/schema.md) de função.

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

Agora você quer se integrar a um ótimo site de streaming novo chamado `mystreamsite.tv`. Ele tem
uma API simples para obter informações sobre as transmissões atuais. Você pode obter uma transmissão com o
padrão de url `https://mystreamsite.tv/[username]/`. No entanto, por algum motivo, eles não
retornam o username no corpo da resposta! Você quer poder se referir a ele, e ele é
o único identificador que define a classe de forma única.

Podemos simplesmente extrair o username da própria url da requisição e adicioná-lo à
resposta.

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

### Preços de ticker {#ticker-prices}

Aqui está um exemplo do mundo real de uma API em que os dados do ticker não incluem sua chave primária `product_id`.

Usamos [RestEndpoint.process()](../api/RestEndpoint.md#process) para adicionar o membro `product_id` a partir do seu argumento.

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

## Usando headers HTTP {#using-http-headers}

Os [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) HTTP são acessíveis na
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) do fetch. [RestEndpoint.fetchResponse()](../api/RestEndpoint.md#fetchResponse)
pode ser usado para construir um [RestEndpoint](../api/RestEndpoint.md).

Às vezes isso é usado para [paginação](./pagination.md#tokens-in-http-headers) baseada em cursor.

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

Às vezes uma API pode mudar o nome de uma chave ou escolher um de que você não gosta. Claro que
você tem padrões de nomenclatura muito melhores, então, em vez de alterar a definição da sua classe `Resource`
e todo o seu código, você quer apenas remapear essa chave.

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
