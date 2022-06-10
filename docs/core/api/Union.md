---
title: schema.Union
---
<head>
  <title>schema.Union - Representing a Union of possible types | Rest Hooks</title>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';

Describe a schema which is a union of multiple schemas. This is useful if you need the polymorphic behavior provided by `schema.Array` or `schema.Values` but for non-collection fields.

- `definition`: **required** An object mapping the definition of the nested entities found within the input array
- `schemaAttribute`: **required** The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Union` constructor. This method tends to be useful for creating circular references in schema.

## Usage

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve([
    { id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },
    { id: 10, type: 'post', content: 'good day!' },
  ]);

abstract class FeedItem extends Entity {
  readonly id: number = 0;
  declare readonly type: 'link' | 'post';
  pk() {
    return `${this.id}`;
  }
}
class Link extends FeedItem {
  readonly type = 'link' as const;
  readonly url: string = '';
  readonly title: string = '';
}
class Post extends FeedItem {
  readonly type = 'post' as const;
  readonly content: string = '';
}

const feed = new Endpoint(sampleData, {
  schema: [
    new schema.Union(
      {
        link: Link,
        post: Post,
      },
      'type',
    ),
  ],
});

function FeedList() {
  const feedItems = useSuspense(feed, {});
  return (
    <div>
      {feedItems.map(item =>
        item.type === 'link' ? (
          <LinkItem link={item} key={item.pk()} />
        ) : (
          <PostItem post={item} key={item.pk()} />
        ),
      )}
    </div>
  );
}
function LinkItem({ link }: { link: Link }) {
  return <a href={link.url}>{link.title}</a>;
}
function PostItem({ post }: { post: Post }) {
  return <div>{post.content}</div>;
}
render(<FeedList />);
```

</HooksPlayground>
