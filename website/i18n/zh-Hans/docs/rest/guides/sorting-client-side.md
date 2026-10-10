---
title: 高效地在客户端对 REST 数据排序 | Data Client
sidebar_label: 排序（客户端）
---

import SortDemo from '../shared/\_SortDemo.mdx';

# 客户端排序

这里有一个根据 `orderBy` 字段排序的 API。通过把我们的 [Collection](../api/Collection.md)
包裹在一个进行排序的 [Query](../api/Query.md) 中，可以确保在[推入](../api/RestEndpoint.md#push)
新帖子之后依然保持正确的顺序。

示例代码一开始按 `title` 排序。试着添加一些帖子，看看它们是否按正确的排序
顺序插入。

<SortDemo defaultTab="PostList" />