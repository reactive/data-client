---
title: 在获取时转换数据
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

在 [RestEndpoint](../api/RestEndpoint.md) 的成员中转换数据：用 [process()](../api/RestEndpoint.md#process) 处理
响应，用 [getRequestInit()](../api/RestEndpoint.md#getRequestInit) 处理请求体，用
[parseResponse()](../api/RestEndpoint.md#parseResponse) 处理响应头和原始响应体。

:::tip

如果你能掌控 API，请改为修改它发送的数据。轻量的客户端更快也更简单。这些转换适用于
你无法掌控的 API。

:::

## 从蛇形到驼峰 {#snakes-to-camels}

许多 API 使用 `snake_case` 的键。要在 TypeScript 中使用 `camelCase`，需要在两个方向上转换键。

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

## 反序列化字段 {#deserializing-fields}

JSON 的类型很少，因此 API 会把许多值作为字符串发送。例如 [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
日期和高精度小数（[浮点数可能有精度损失](https://floating-point-gui.de/)）。字符串用于展示没有问题。
要用它们进行计算，比如给日期加上一段时间或将两个数相乘，就需要反序列化。

将 [Entity.schema](../api/Entity.md#schema) 与 [Temporal.Instant](https://tc39.es/proposal-temporal/) 和
[BigNumber](https://github.com/MikeMcl/bignumber.js) 搭配使用：

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

### 反序列化 Date {#deserializing-date}

要使用传统的 [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)，
请把它的构造函数包装成一个函数 [schema](../api/schema.md)。

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

## 缺失 `Id` 的情况 {#case-of-the-missing-id}

有些 API 的响应中不包含主键。例如，`https://mystreamsite.tv/[username]/` 返回的直播中没有
`username`，而它是该直播唯一的标识符。

在 [RestEndpoint.process()](../api/RestEndpoint.md#process) 中从 endpoint 的参数里添加 `username`。

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

### 行情价格 {#ticker-prices}

Coinbase 的行情响应中不包含主键 `product_id`。
[RestEndpoint.process()](../api/RestEndpoint.md#process) 会从 `productId` 参数中添加它。

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

## 使用 HTTP 头 {#using-http-headers}

要读取 HTTP [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers)，请覆盖
[RestEndpoint.parseResponse()](../api/RestEndpoint.md#parseResponse)。它会接收 fetch 的
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)。例如，基于游标的
[分页](./pagination.md#tokens-in-http-headers)可以在响应头中发送游标。

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

## 文件下载 {#file-download}

对于返回二进制数据（文件、图片、PDF）的 endpoint，请设置
[`content: 'blob'`](../api/RestEndpoint.md#content)。其返回类型为 `Blob`，
`schema` 默认为 `undefined`（二进制数据无法规范化）。使用 `dataExpiryLength: 0`
可以避免在内存中缓存大型 blob。

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

要从 `Content-Disposition` 头中提取文件名，请覆盖
[parseResponse](../api/RestEndpoint.md#parseResponse)：

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

对于 `ArrayBuffer` 响应（适合在内存中处理二进制数据），以同样的方式使用
`content: 'arrayBuffer'`。

## 重命名键 {#name-calling}

要重命名 API 使用的某个键，请在两个方向上映射它。这样你的 Entity 和组件就只会使用你起的名字。

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
