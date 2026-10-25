---
title: 性能
sidebar_label: 性能
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>


除了数据完整性方面的好处之外，带有 Entity 级记忆化的[规范化缓存](./normalization.md)还能为
富交互应用带来显著的性能提升。

## React 渲染基准测试 {#react-rendering-benchmarks}

完整的渲染流水线（从 fetch 到 DOM 提交），通过 Playwright 在真实浏览器中测量。[^setup]
React 基线使用 React 文档中的 useEffect + useState。[^config]

<center>

<ThemedImage
alt="React 渲染基准测试"
title="Data Client 与 TanStack Query、SWR 及基线对比"
sources={{
    light: useBaseUrl('/img/bench-react.svg'),
    dark: useBaseUrl('/img/bench-react-dark.svg'),
  }}
/>

[查看基准测试源码](https://github.com/reactive/data-client/tree/master/examples/benchmark-react) · [方法与结果](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md) · [性能随时间变化](https://reactive.github.io/data-client/react-bench/)

</center>

- **缓存导航**：在完整列表与列表中的条目之间来回导航十次。[^nav]
- **变更传播**：一次 store 写入即可更新所有引用该 Entity 的视图。[^mutation]
- **扩展性**：在渲染了 1 万条列表项的情况下进行变更。[^scaling]

这些基准测试衡量的是框架在更大系统中的影响。因此，
它们最适合用来比较不同方案，而不是作为
应用整体性能的绝对度量。我们用它们来
指导库的优化，并随时间发现性能回退。

[^setup]: 于 2026-03-22 在 Ryzen 9 7950X（64 GB，WSL2 上的 Ubuntu，Node 24.12.0，Playwright 1.58.2 的 headless Chromium）上测量，每个请求延迟 40 ms，外加每 20 条记录 1 ms。每个场景在预热后取 5 到 50 个样本的中位数。[完整方法](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md)。
[^config]: TanStack Query 5.62.7（`staleTime` 和 `gcTime` 设为 `Infinity`），SWR 2.4.1（禁用聚焦、重连和过时时的重新验证），React 19.2.3。变更之后，TanStack Query 和 SWR 会等待响应，然后失效并重新获取；Data Client 则以乐观方式更新 store。[配置详情](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#how-each-library-is-configured)。
[^nav]: `list-detail-switch-10`：Data Client 为 57.5 ms，TanStack Query 为 610 ms，SWR 为 629 ms，基线为 1,370 ms。即分别是基线的 23.8 倍、TanStack Query 的 10.6 倍和 SWR 的 10.9 倍。
[^mutation]: `update-entity`：Data Client 为 1.5 ms，TanStack Query 为 143 ms，SWR 为 141 ms，基线为 138 ms。其他变更场景是基线的 48 倍到 116 倍不等。[全部结果](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#results)。
[^scaling]: `update-user-10000`：Data Client 为 6.9 ms，TanStack Query 为 671 ms，SWR 为 641 ms，基线为 641 ms。

## 规范化基准测试 {#normalization-benchmarks}

与旧版 [normalizr](https://github.com/paularmstrong/normalizr)
库对比反规范化。Entity 级记忆化可以保持全局引用相等，并
加快重复访问，包括在[变更](../getting-started/mutations.md)之后。

<center>

<ThemedImage
alt="反规范化基准测试"
title="Data Client 与 normalizr 对比"
sources={{
    light: useBaseUrl('/img/bench-norm.svg'),
    dark: useBaseUrl('/img/bench-norm-dark.svg'),
  }}
/>

[查看基准测试源码](https://github.com/reactive/data-client/blob/master/examples/benchmark) · [方法](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#normalization-benchmarks)

</center>
