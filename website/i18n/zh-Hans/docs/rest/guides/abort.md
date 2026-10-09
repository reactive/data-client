---
title: 中止请求
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import UseCancelling from '../../core/shared/\_useCancelling.mdx';

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) 提供了一种新方式，用于取消那些已不再相关的请求。
它可以通过 fetch 的第二个参数 `RequestInit` 接入。

## 参数变化时取消 {#cancelling-on-params-change}

有时用户可以填写某个字段，而这个字段会影响网络请求的结果。
如果这是一个文本输入框，用户可能输入得很快，从而产生大量网络请求。

使用 [useCancelling()](/docs/api/useCancelling) 时，如果参数在请求完成之前发生变化，
进行中的请求会被自动取消。

<UseCancelling />

:::warning[警告]

当许多互不相关的组件向 useSuspense() 传入相同的参数（Endpoint/params 组合）进行获取时，
使用它要格外小心。这种方案按组件中止请求，
这意味着你可能会取消另一个组件仍然需要的请求。

:::
