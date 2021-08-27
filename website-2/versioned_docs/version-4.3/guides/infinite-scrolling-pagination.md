---
title: Infinite Scrolling
id: infinite-scrolling-pagination
original_id: infinite-scrolling-pagination
---

## Add Update Function matching network schema

If your API follows a common pattern, adding the [update function](../api/useFetcher#updatefunction-sourceresults-destresults--destresults)
to a base class can make adding pagination behavior to any of your endpoints quite easy.

```typescript
abstract class BaseResource extends Resource {
  static listShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      schema: { results: [this.asSchema()], cursor: null as string | null },
    };
  }

  static appendList(
    newResults: { results: string[] },
    existingResults: { results: string[] } | undefined,
  ) {
    // In case there are duplicates, Set will eliminate them.
    const set = new Set([
      ...(existingResults?.results ?? []),
      ...newResults.results,
    ]);
    return {
      ...newResults,
      results: [...set.values()],
    };
  }
}
```

## Create pagination hook

Here we'll define a helper hook for pagination that uses the BaseResource
[update function](../api/useFetcher#updatefunction-sourceresults-destresults--destresults).
This can then be used for any Resources that conform to this schema. Most likely
that is the same as those extending from BaseResource.

```typescript
import { ReadShape, ParamsFromShape, useFetcher } from 'rest-hooks';
import BaseResource from 'resources/BaseResource';

function usePaginator<
  S extends ReadShape<any, any>,
  P extends Omit<ParamsFromShape<S>, 'cursor'> | null
>(fetchShape: Shape, params: Params) {
  // the second argument here is really important - it indicates that requests should be deduped!
  const getNextPage = useFetcher(fetchShape, true);

  return useCallback(
    (cursor: string) => {
      return getNextPage({ ...params, cursor }, undefined, [
        // this instructs Rest Hooks to update the cache results specified by the first two members
        // with the merge algorithm of the third.
        [fetchShape, params, BaseResource.appendList],
      ]);
      // "params && fetchShape.getFetchKey(params)" is a method to serialize params
    },
    [getNextPage, params && fetchShape.getFetchKey(params)],
  );
}
```

## NewsList example

We'll extend the `BaseResource` created above, to define the correct
schema for listShape().

```typescript
class NewsResource extends BaseResource {
  readonly id: string | undefined = undefined;
  readonly title = '';
  readonly url = '';
  readonly previewImage = '';

  pk() {
    return this.id;
  }
  static urlRoot = '/news';
}
```

Now we can declare our data depency to get list results with [useResource](../api/useresource),
and get an imperative handler `getNextPage` using our new hook.

Since UI behaviors vary widely, and implementations vary from platform (react-native or web),
we'll just assume a `Pagination` component is built, that uses a callback to trigger next
page fetching. On web, it is recommended to use something based on [Intersection Observers](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

`<Pagination />` is assumed to call its `onPaginate` prop when a user scrolls and its
`nextCursor` is not falsy. It will then pass the nextCursor prop as the sole argument to
`onPaginate`.

```tsx
import { useResource } from 'rest-hooks';
import NewsResource from 'resources/NewsResource';
import usePaginator from 'resources/basePaginator';

function NewsList() {
  const { results, cursor } = useResource(NewsResource.listShape(), {});
  const getNextPage = usePaginator(NewsResource.listShape(), {});

  return (
    <Pagination onPaginate={getNextPage} nextCursor={cursor}>
      <NewsList data={results} />
    </Pagination>
  );
}
```
