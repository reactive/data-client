---
title: Sorting client-side REST data efficiently | Data Client
sidebar_label: Sorting (client-side)
---

import SortDemo from '../shared/\_SortDemo.mdx';

# Client Side Sorting

Here we have an API that sorts based on the `orderBy` field. By wrapping our [Collection](../api/Collection.md)
in a [Query](../api/Query.md) that sorts, we can ensure we maintain the correct order after [pushing](../api/RestEndpoint.md#push)
new posts.

Our example code starts sorting by `title`. Try adding some posts and see them inserted in the correct sort
order.

<SortDemo defaultTab="PostList" />