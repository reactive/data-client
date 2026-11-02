---
title: 中止获取
---

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

当参数快速变化时，比如读者快速浏览收件箱，他们经过的每一封邮件都会开始一次下载。
每个响应都按各自的参数存储，因此迟到的响应永远不会替换屏幕上的内容。但被他们抛在身后的
下载仍会继续，与他们真正想要的那次下载争用缓慢的网络连接。

[useCancelling()](/docs/api/useCancelling) 会在参数一变化时就中止进行中的请求，因此
读者停留的那封邮件可以独自下载。

<UseCancelling />

:::warning[警告]

当许多互不相关的组件向 useSuspense() 传入相同的参数（Endpoint/params 组合）进行获取时，
使用它要格外小心。该方案按组件中止请求，
这意味着你可能会取消另一个组件仍然需要的请求。

:::

::::
