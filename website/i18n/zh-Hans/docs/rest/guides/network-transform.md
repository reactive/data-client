---
title: 在获取时转换数据
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

所有网络请求都会经过 `fetch()` 方法，因此任何需要的转换都可以简单地
通过覆盖它并调用 super 来完成。

:::tip

注意：如果你能掌控 API 的设计，通常更推荐直接
修改通过网络发送的数据。让客户端尽可能保持 `thin`，
对性能和复杂度都有好处。

不过，在很多情况下，你需要使用自己无法掌控的 API——
可能是公共 API，也可能是由于内部组织结构的原因。

:::

## 从蛇形到驼峰 {#snakes-to-camels}

API 的键通常采用 `snake_case` 设计，但许多 typescript/javascript 开发者
更喜欢 `camelCase`。下面这段代码可以完成所需的转换。

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

## 反序列化字段 {#deserializing-fields}

由于 JSON 只有少数几种基本类型，通过 JSON 发送的数据在很多情况下
会被序列化为字符串。常见的例子包括用 [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) 表示日期，
甚至用字符串表示需要高精度的小数（[浮点数可能有精度损失](https://floating-point-gui.de/)）。
让数据保持序列化形式通常没有问题，尤其是当它只用于
展示时。然而，当需要计算派生数据时，比如给日期加上一段时间
或将两个数相乘，这就会带来问题。

这种情况下，只需将 [static schema](../api/Entity.md#schema) 与 [Temporal.Instant](https://tc39.es/proposal-temporal/) 和 [BigNumber](https://github.com/MikeMcl/bignumber.js) 搭配使用

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

### 反序列化 Date {#deserializing-date}

如果你想使用传统的 [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)，
可以把构造函数包装成一个函数 [schema](../api/schema.md)。

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

现在你想对接一个很棒的新直播网站 `mystreamsite.tv`。它提供了
一个简单的 API，用于获取当前直播的信息。你可以通过
url 模式 `https://mystreamsite.tv/[username]/` 获取某个直播。然而，出于某种原因，它们并没有
在响应体中返回用户名！而你需要引用它，因为它是
这个类唯一的标识符。

我们可以直接从请求 url 中解析出用户名，并将其添加到
响应中。

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

### 行情价格 {#ticker-prices}

下面是一个真实的 API 示例，其行情数据中不包含主键 `product_id`。

我们使用 [RestEndpoint.process()](../api/RestEndpoint.md#process) 从参数中取值，添加 `product_id` 成员。

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

## 使用 HTTP 头 {#using-http-headers}

HTTP [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) 可以在 fetch 的
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 中访问。[RestEndpoint.fetchResponse()](../api/RestEndpoint.md#fetchResponse)
可用于构建 [RestEndpoint](../api/RestEndpoint.md)。

这有时用于基于游标的[分页](./pagination.md#tokens-in-http-headers)。

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

有时 API 可能会更改某个键名，或者选用了你不喜欢的名字。当然，
你有更好的命名规范，因此你不想改动 `Resource` 类的定义
以及所有代码，而只想重新映射这个键。

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
