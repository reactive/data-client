---
title: useCache()
---

<head>
  <title>useCache() - Accessing Rest Hooks data without fetching</title>
</head>

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';

<GenericsTabs>

```typescript
function useCache(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Denormalize<typeof endpoint.schema> | null;
```

```typescript
function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined>,
    'key' | 'schema' | 'invalidIfStale'
  >,
  Args extends readonly [...Parameters<E['key']>] | readonly [null],
>(endpoint: E, ...args: Args): DenormalizeNullable<E['schema']>;
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
  const post = useCache(PostResource.get, { id });
  // post as PostResource | null
  if (!post) return null;
  // post as PostResource (typeguarded)
  // ...render stuff here
}
```

### Paginated data

When entities are stored in nested structures, that structure will remain.

```typescript
export class PaginatedPost extends Entity {
  readonly id: number | null = null;
  readonly title: string = '';
  readonly content: string = '';

  pk() {
    return this.id;
  }
}

export const getPosts = new RestEndpoint({
  path: '/post\\?page=:page',
  schema: { results: [PaginatedPost], nextPage: '', lastPage: '' },
});
```

```tsx
function ArticleList({ page }: { page: string }) {
  const { results: posts, nextPage, lastPage } = useCache(getPosts, { page });
  // posts as PaginatedPost[] | null
  if (!posts) return null;
  // posts as PaginatedPost[] (typeguarded)
  // ...render stuff here
}
```

<ConditionalDependencies hook="useCache" />

## Useful `Endpoint`s to send

[Resource](/rest/api/createResource#members) provides these built-in:

- [get](/rest/api/createResource#get)
- [getList](/rest/api/createResource#getlist)

Feel free to add your own [RestEndpoint](/rest/api/RestEndpoint) as well.
