---
title: useInvalidator()
---

```typescript
function useInvalidator<Params extends Readonly<object>, S extends Schema>(
  selectShape: ReadShape<S, Params, any>,
): (params: Params) => void;
```

Mostly useful for imperatively invalidating the cache, with a similar signature to
[useFetcher](./useFetcher.md).

When used in conjunction with [invalidIfStale](./RequestShape.md#invalidifstale-boolean)
it can force a component to re-suspend even if it has already fetched the data. Normally
[useResource](./useResource.md) will not suspend if the data is in the cache, even if it
is stale. By pairing this option with `useInvalidator` the component will act as though it
has never tried to fetch the resource before and trigger a fetch with suspense.

## Example

```typescript
import { Resource, RequestOptions } from 'rest-hooks';

export default class ArticleResource extends Resource {
  readonly id: string = null;
  readonly title: string = '';
  // ...

  /** Used as default options for every RequestShape */
  static getRequestOptions(): RequestOptions {
    return {
      invalidIfStale: true,
    };
  }
}
```

```tsx
function ArticleName({ id }: { id: string }) {
  const asset = useResource(ArticleResource.singleRequest(), { id });
  const invalidate = useInvalidator(ArticleResource.singleRequest());

  // Invalidate cache on unmount. When component is remounted it will re-fetch
  useEffect(() => {
    return () => invalidate({ id });
  }, []);

  return (
    <div>
      <h1>{article.title}<h1>
    </div>
  );
}
```
