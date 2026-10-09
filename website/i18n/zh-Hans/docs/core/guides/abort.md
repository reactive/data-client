---
title: 中止获取
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import UseCancelling from '../shared/\_useCancelling.mdx';

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) 提供了一种新方式，用于取消
不再相关的请求。它可以通过第二个 `RequestInit` 参数接入 fetch。

## Resource {#resource}

[RestEndpoint](/rest/api/RestEndpoint) 通过 signal 成员提供了简单的集成方式：

```typescript
const abort = new AbortController();
const AbortableArticle = CoolerArticleResource.get.extend({
  signal: abort.signal,
});
// ...somewhere later trigger cancellation
abort.abort();
```

## Endpoint {#endpoint}

此外，借助自定义成员，也可以轻松地为任何 endpoint 添加类似的功能。

```typescript
type Params = { id: string };

const UserDetail = new Endpoint(
  function ({ id }: Params) {
    const init: RequestInit = {};
    if (this.signal) {
      init.signal = this.signal;
    }
    return fetch(this.url({ id }), init).then(res => res.json()) as Promise<
      typeof payload
    >;
  },
  {
    url({ id }: Params) { return `/users/${id}` },
    signal: undefined as AbortSignal | undefined,
  },
);
```

```typescript
const abort = new AbortController();
const AbortableUserDetail = UserDetail.extend({
  signal: abort.signal,
});
// ...somewhere later trigger cancellation
abort.abort();
```

::::react

## 参数变化时取消 {#cancelling-on-params-change}

有时用户需要填写一个字段，而该字段会影响网络请求的结果。
如果这是一个文本输入框，用户可能输入得很快，从而产生大量网络请求。

使用 [useCancelling()](/docs/api/useCancelling) 会在请求完成之前、参数发生变化时，
自动取消正在进行中的请求。

<UseCancelling />

:::warning[警告]

当许多互不相关的组件向 useSuspense() 传入相同的参数（Endpoint/params 组合）进行获取时，
使用它要格外小心。该方案按组件中止请求，
这意味着你可能会取消另一个组件仍然需要的请求。

:::

::::
