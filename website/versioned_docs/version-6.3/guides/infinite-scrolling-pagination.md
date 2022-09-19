---
title: Infinite Scrolling
---

## Add Update Function matching network schema

If your API follows a common pattern, adding the [Endpoint.update](/rest/api/Endpoint#update)
to a base class can make adding pagination behavior to any of your endpoints quite easy.

```typescript
type Params = { cursor: string; [k: string]: any };
abstract class BaseResource extends Resource {
  static list<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    FetchFunction<Params>,
    { results: T[]; cursor: string | null },
    undefined
  > {
    return super.list().extend({
      schema: { results: [this], cursor: null },
      update: (newResults: any, { cursor, ...rest }: Params) => ({
        [this.list().key({ ...rest })]: BaseResource.appendList.bind(
          BaseResource,
          newResults,
        ),
      }),
    });
  }

  static appendList(
    newResults: { results: string[] },
    existingResults: { results: string[] } | undefined,
  ) {
    const existingList = existingResults?.results ?? [];
    const existingSet: Set<string> = new Set(existingList);
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
[Endpoint.update](/rest/api/Endpoint#update).
This can then be used for any Resources that conform to this schema. Most likely
that is the same as those extending from BaseResource.

```typescript
import { useMemo } from 'react';
import { ReadEndpoint, useController } from 'rest-hooks';

function usePaginator<
  E extends ReadEndpoint<(params: any) => Promise<any>, any>,
>(endpoint: E, params: Omit<Parameters<E>[0], 'cursor'> | null) {
  const { fetch } = useController();

  return useMemo(
    () => {
      if (!params) return null;
      return (cursor: string) => {
        const p: Parameters<E> = [{ ...params, cursor }] as any;
        return fetch(endpoint, ...p);
      };
    },
    // "params && endpoint.key(params)" is a method to serialize params
    [fetch, params && endpoint.key(params)],
  );
}
```

## NewsList example

We'll extend the `BaseResource` created above, to define the correct
schema for list().

```typescript
import BaseResource from 'resources/BaseResource';

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

Now we can declare our data depency to get list results with [useSuspense](../api/useSuspense),
and get an imperative handler `getNextPage` using our new hook.

Since UI behaviors vary widely, and implementations vary from platform (react-native or web),
we'll just assume a `Pagination` component is built, that uses a callback to trigger next
page fetching. On web, it is recommended to use something based on [Intersection Observers](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

`<Pagination />` is assumed to call its `onPaginate` prop when a user scrolls and its
`nextCursor` is not falsy. It will then pass the nextCursor prop as the sole argument to
`onPaginate`.

```tsx
import { useSuspense } from 'rest-hooks';
import NewsResource from 'resources/NewsResource';
import usePaginator from 'resources/basePaginator';

function NewsList() {
  const { results, cursor } = useSuspense(NewsResource.list(), {});
  const getNextPage = usePaginator(NewsResource.list(), {});

  return (
    <Pagination onPaginate={getNextPage} nextCursor={cursor}>
      <NewsList data={results} />
    </Pagination>
  );
}
```
