---
titlke: Union Schema - Declarative polymorphic data for React
sidebar_label: Union
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';
import StackBlitz from '@site/src/components/StackBlitz';

# Union

Describe a schema which is a union of multiple schemas. This is useful if you need the polymorphic behavior provided by [schema.Array](./Array.md) or [Values](./Values.md) but for non-collection fields.

- `definition`: **required** An object mapping the definition of the nested entities found within the input array
- `schemaAttribute`: **required** The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Union` constructor. This method tends to be useful for creating circular references in schema.

:::info Naming

`Union` is named after the [set theory concept](https://en.wikipedia.org/wiki/Union_(set_theory)) just like [TypeScript Unions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

:::

## Usage

:::note

If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created.

:::

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/feed'}),
args: [],
response: [
    { id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },
    { id: 10, type: 'post', content: 'good day!' },
  ],
delay: 150,
},
]}>

```typescript title="api/Feed"
abstract class FeedItem extends Entity {
  id = 0;
  declare type: 'link' | 'post';
}
class Link extends FeedItem {
  type = 'link' as const;
  url = '';
  title = '';
}
class Post extends FeedItem {
  type = 'post' as const;
  content = '';
}

const feed = new RestEndpoint({
  path: '/feed',
  schema: [
    new Union(
      {
        link: Link,
        post: Post,
      },
      'type',
    ),
  ],
});
```

```tsx title="FeedList" collapsed
function FeedList() {
  const feedItems = useSuspense(feed);
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

### Github Events

Contribution activity comes from grouping github events by their type. Each type of Event has its
own distinct schema, which is why we use `Union`

<StackBlitz app="github-app" file="src/pages/ProfileDetail/UserEvents.tsx,src/resources/Event.tsx" view="preview" initialpath="/users/ntucker" height="700" />
