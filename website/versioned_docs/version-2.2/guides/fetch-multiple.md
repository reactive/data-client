---
title: Fetching multiple resources at once
id: fetch-multiple
original_id: fetch-multiple
---
## Parallel

If you have the parameters you needs to fetch, they will all happen in parallel!

```tsx
import React from "react";
import { useResource } from "rest-hooks";
import { PostResource, TaskResource } from "./resources";

export default function Post({ name }: { name: string }) {
  const [post, tasks] = useResource(
    [PostResource.detailShape(), { name }],
    [TaskResource.detailShape(), { name }],
  );
  return (
    <div>
      <Post post={post} />
      <Task task={task} />
    </div>
  );
}
```

## Sequential

Each [useResource()](../api/useResource.md) call ensures the resource returned is available. That means
that until that point it will yield running the rest of the component function
when it is loading or errored.

```tsx
import React from "react";
import { useResource } from "rest-hooks";
import { PostResource, UserResource } from "./resources";

export default function Post({ id }: { id: number }) {
  const post = useResource(PostResource.detailShape(), { id });
  const author = useResource(
    UserResource.detailShape(),
    {
      id: post.userId
    }
  );
  return (
    <div>
      <h1>
        {post.title} by {author && author.name}
      </h1>
      <p>{post.body}</p>
    </div>
  );
}
```
