# Fetching multiple resources at once

## Parallel

If you have the parameters you needs to fetch, they will all happen in parallel!

```tsx
import React from "react";
import { hooks } from "rest-hooks";
import { PostResource, TaskResource } from "./resources";

export default function Post({ name }: { name: string }) {
  const [post, tasks] = hooks.useResource(
    [PostResource.singleRequest(), { name }],
    [TaskResource.singleRequest(), { name }],
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

```tsx
import React from "react";
import { hooks } from "rest-hooks";
import { PostResource, UserResource } from "./resources";

export default function Post({ id }: { id: number }) {
  const post = hooks.useResource(PostResource.singleRequest(), { id });
  const author = hooks.useResource(
    UserResource.singleRequest(),
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
