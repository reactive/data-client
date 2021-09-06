---
title: useInvalidator()
id: useInvalidator
original_id: useInvalidator
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useInvalidator(
  fetchShape: ReadShape,
): (params: object | null) => void;
```

<!--With Generics-->

```typescript
function useInvalidator<Params extends Readonly<object>, S extends Schema>(
  fetchShape: ReadShape<S, Params>,
): (params: Params | null) => void;
```

<!--END_DOCUSAURUS_CODE_TABS-->

Mostly useful for imperatively invalidating the cache, with a similar signature to
[useFetcher](./useFetcher.md).

Sending a `null` to params results in a no-op.

When used in conjunction with [invalidIfStale](./FetchShape.md#invalidifstale-boolean)
it can force a component to re-suspend even if it has already fetched the data. Normally
[useResource](./useResource.md) will not suspend if the data is in the cache, even if it
is stale. By pairing this option with `useInvalidator` the component will act as though it
has never tried to fetch the resource before and trigger a fetch with suspense.

## Example

```typescript
import { Resource, FetchOptions } from 'rest-hooks';

export default class ArticleResource extends Resource {
  readonly id: string = null;
  readonly title: string = '';
  // ...

  /** Used as default options for every FetchShape */
  static getFetchOptions(): FetchOptions {
    return {
      invalidIfStale: true,
    };
  }
}
```

```typescript
// Invalidate cache on unmount. When component is remounted it will re-fetch
function useInvalidateOnUnmount<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null) {
  const invalidate = useInvalidator(fetchShape);

  useEffect(() => {
    return () => invalidate(params);
  }, []);
}
```

```tsx
function ArticleName({ id }: { id: string }) {
  const asset = useResource(ArticleResource.detailShape(), { id });
  useInvalidateOnUnmount(ArticleResource.detailShape(), { id });

  return (
    <div>
      <h1>{article.title}<h1>
    </div>
  );
}
```
