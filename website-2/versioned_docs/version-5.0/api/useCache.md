---
title: useCache()
---
import GenericsTabs from '@site/src/components/GenericsTabs';

<GenericsTabs>

```typescript
function useCache(
  endpoint: ReadEndpoint,
  params: object | null,
): Denormalize<typeof endpoint.schema> | null;
```

```typescript
function useCache<Params extends Readonly<object>, S extends Schema>(
  endpoint: Pick<ReadEndpoint<(p:Params) => Promise<any>, S>, 'schema' | 'key'>,
  params: Params | null,
): Denormalize<S> | null;
```

</GenericsTabs>

Excellent to use data in the normalized cache without fetching.

- [On Error (404, 500, etc)](https://www.restapitutorial.com/httpstatuscodes.html):
  - Returns previously cached if exists
  - null otherwise
- While loading:
  - Returns previously cached if exists
  - null otherwise

## Example

### Using a type guard to deal with null

```tsx
function Post({ id }: { id: number }) {
  const post = useCache(PostResource.detail(), { id });
  // post as PostResource | null
  if (!post) return null;
  // post as PostResource (typeguarded)
  // ...render stuff here
}
```

### Paginated data

When entities are stored in nested structures, that structure will remain.

```typescript
export class PaginatedPostResource extends Resource {
  readonly id: number | null = null;
  readonly title: string = '';
  readonly content: string = '';

  static urlRoot = 'http://test.com/post/';

  static list<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: { results: [this], nextPage: '', lastPage: '' },
    });
  }
}
```

```tsx
function ArticleList({ page }: { page: string }) {
  const { results: posts, nextPage, lastPage } = useCache(
    PaginatedPostResource.list(),
    { page },
  );
  // posts as PaginatedPostResource[] | null
  if (!posts) return null;
  // posts as PaginatedPostResource[] (typeguarded)
  // ...render stuff here
}
```

## Useful `Endpoint`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- detail()
- list()

Feel free to add your own [Endpoint](api/Endpoint.md) as well.
