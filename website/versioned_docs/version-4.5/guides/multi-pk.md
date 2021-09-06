---
title: Multi-column primary key
id: multi-pk
original_id: multi-pk
---
Sometimes you have a resource that doesn't have its own primary key. This is typically
found in `join tables` that express `many-to-many` relationships.

Since the pk() method must return either a number, string or undefined, make sure to
do a simple serialization. A simple join on the values should work. Be care to
make sure your join value can't be a part of the id.

```typescript
export class VoteResource extends Resource {
  readonly userId: number | undefined = undefined;
  readonly postId: number | undefined = undefined;
  readonly createdAt: string = '1900-01-01T01:01:01Z';

  pk() {
    return [this.userId, this.postId].join(',');
  }
  static urlRoot = 'https://example.com/votes/';
}
```
