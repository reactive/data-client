---
title: '⚛ 原子变更：安全、高性能的异步变更'
sidebar_label: 原子变更
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# 超越类型的安全性

当用户触发创建、更新或删除资源等变更时，让这些变化及时反映到应用中
非常重要。一个对底层数据结构一无所知的简单发布式缓存，
需要重新获取所有发生变化的 endpoint。这会降低性能，并给后端带来额外负担。

然而，和许多其他场景一样，规范化缓存（了解资源之间底层关系的缓存）
能够在不进行任何重新获取的情况下，
保持所有数据一致且最新。

## 更新 {#update}

Reactive Data Client 使用你的 schema 定义来理解如何把响应数据规范化到
`entity table` 和 `result table` 中。当然，这意味着任何给定的 `entity`
永远只有一份副本。除了在使用不同响应 endpoint 时提供一致性之外，
这还意味着只要提供准确的 schema 定义，Reactive Data Client 就能自动让
所有数据的使用处保持一致且最新。默认的更新 endpoint [Resource.update](/rest/api/resource#update) 和
[Resource.partialUpdate](/rest/api/resource#partialupdate) 都会自动做到这一点。[进一步了解如何定义其他
更新 endpoint](/rest/guides/side-effects)

## 删除 {#delete}

使用 [schema.Invalidate](/rest/api/Invalidate) 时，Reactive Data Client 会自动删除 Entity 条目。
[Resource.delete](/rest/api/resource#delete)
就提供了这样的 endpoint。

## 创建 {#create}

新创建的 Entity 会立即可用。它们还可以通过 [.push](/rest/api/RestEndpoint#push)、[.unshift](/rest/api/RestEndpoint#unshift) 或 [.assign](/rest/api/RestEndpoint#assign)
添加到已有的 [Collection](/rest/api/Collection) 中。