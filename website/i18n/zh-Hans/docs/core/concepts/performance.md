---
title: 性能
sidebar_label: 性能
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import PosterVideo from '@site/src/components/PosterVideo';

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
- **扩展性**：存储 1 万条、渲染 100 条时重命名一个用户。[^scaling]

这些基准测试衡量的是框架在更大系统中的影响。因此，
它们最适合用来比较不同方案，而不是作为
应用整体性能的绝对度量。我们用它们来
指导库的优化，并随时间发现性能回退。

[^setup]: 于 2026-11-05 在 Ryzen 9 7950X（64 GB，WSL2 上的 Ubuntu，Node 26.12.1，Playwright 1.64.0 的 headless Chromium）上测量，每个请求延迟 40 ms，外加每 20 条记录 1 ms。每个场景在预热后取 10 到 60 个样本的中位数，并取两次完整运行的中位数。[完整方法](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md)。
[^config]: TanStack Query 5.96.2（`staleTime` 和 `gcTime` 设为 `Infinity`），SWR 2.5.1（禁用聚焦、重连和过时时的重新验证），React 19.3.1。变更之后，TanStack Query 和 SWR 会等待响应，然后失效并重新获取；Data Client 则以乐观方式更新 store。[配置详情](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#how-each-library-is-configured)。
[^nav]: `list-detail-switch-10`：Data Client 为 21.2 ms，TanStack Query 为 446 ms，SWR 为 452 ms，基线为 1,351 ms。即分别是基线的 63.8 倍、TanStack Query 的 21.1 倍和 SWR 的 21.4 倍。
[^mutation]: `update-entity`：Data Client 为 0.73 ms，TanStack Query 为 136 ms，SWR 为 137 ms，基线为 135 ms。其他变更场景是基线的 74 倍到 194 倍不等。[全部结果](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#results)。
[^scaling]: `update-user-10000`：Data Client 为 5.7 ms，TanStack Query 为 625 ms，SWR 为 602 ms，基线为 606 ms。

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

<PosterVideo
  poster={useBaseUrl('/videos/docs/memocache-poster.jpg')}
  duration="1:59"
  volume={0.5}
  alt="反规范化会根据 id 重建每篇文章，因此如果没有缓存，每次写入都会让每一行得到一个新对象。MemoCache 以它读取的 entity 对象作为每个结果的键，并通过 WeakDependencyMap 弱引用持有这些对象。重命名 User 7 会重建文章 1 和 2，而文章 3 保留原有对象；旧的 user 对象会连同其背后缓存的文章一起被垃圾回收。在大型列表上与 normalizr 对比，不使用缓存时反规范化快 1.7 倍，命中缓存时快 11.5 倍。"
>
  <source
    src={useBaseUrl('/videos/docs/memocache.webm')}
    type='video/webm; codecs="av01.0.08M.10, opus"'
  />
  <source src={useBaseUrl('/videos/docs/memocache.mp4')} type="video/mp4" />
</PosterVideo>
