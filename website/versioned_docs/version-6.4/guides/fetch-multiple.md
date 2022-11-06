---
title: Fetching multiple resources at once
---
## Parallel

If you have the parameters you needs to fetch, they will all happen in parallel!

```tsx
import React from "react";
import { useSuspense } from "rest-hooks";
import { PostResource, TaskResource } from "/rest/api/resources";

export default function Post({ name }: { name: string }) {
  const [post, tasks] = useSuspense(
    [PostResource.detail(), { name }],
    [TaskResource.detail(), { name }],
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

Each [useSuspense()](../api/useSuspense) call ensures the resource returned is available. That means
that until that point it will yield running the rest of the component function
when it is loading or errored.

```tsx
import React from "react";
import { useSuspense } from "rest-hooks";
import { PostResource, UserResource } from "/rest/api/resources";

export default function Post({ id }: { id: number }) {
  const post = useSuspense(PostResource.detail(), { id });
  const author = useSuspense(
    UserResource.detail(),
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
