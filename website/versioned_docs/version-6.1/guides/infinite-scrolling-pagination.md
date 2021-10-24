---
title: Infinite Scrolling
---

## Add Update Function matching network schema

If your API follows a common pattern, adding the [Endpoint.update](../api/Endpoint#update)
to a base class can make adding pagination behavior to any of your endpoints quite easy.

```typescript
abstract class BaseResource extends Resource {
  static list<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: { results: [this], cursor: null as string | null },
      update: (newResults: any, { cursor, ...rest }) => ({
        [this.key(...rest)]: this.appendList.bind(this, newResults),
      }),
    });
  }

  static appendList(
    newResults: { results: string[] },
    existingResults: { results: string[] } | undefined,
  ) {
    const existingSet: Set<string> = new Set(existingResults?.results ?? []);
    const addedList = newResults.results.filter(
      (pk: string) => !existingSet.has(pk),
    );
    const mergedResults: string[] = [...existingList, ...addedList];
    return {
      ...newResults,
      results: mergedResults,
    };
  }
}
```

## Create pagination hook

Here we'll define a helper hook for pagination that uses the BaseResource
[Endpoint.update](../api/Endpoint#update).
This can then be used for any Resources that conform to this schema. Most likely
that is the same as those extending from BaseResource.

```typescript
import { ReadEndpoint, EndpointParam, useController } from 'rest-hooks';
import BaseResource from 'resources/BaseResource';

function usePaginator<
  E extends ReadEndpoint<any, any>,
  P extends Omit<EndpointParam<E>, 'cursor'> | null,
>(endpoint: E, params: P) {
  const { fetch } = useController();

  return useCallback(
    (cursor: string) => fetch(endpoint, { ...params, cursor }),
    // "params && endpoint.key(params)" is a method to serialize params
    [fetch, params && endpoint.key(params)],
  );
}
```

## NewsList example

We'll extend the `BaseResource` created above, to define the correct
schema for list().

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
  const { results, cursor } = useResource(NewsResource.list(), {});
  const getNextPage = usePaginator(NewsResource.list(), {});

  return (
    <Pagination onPaginate={getNextPage} nextCursor={cursor}>
      <NewsList data={results} />
    </Pagination>
  );
}
```
