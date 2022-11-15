---
title: Upgrading from 6 to 7
---
import BeforeAfterTabs from '@site/src/components/BeforeAfterTabs';
import PkgTabs from '@site/src/components/PkgTabs';

<PkgTabs pkgs="rest-hooks@7 @rest-hooks/react @rest-hooks/redux @rest-hooks/test@8" upgrade />

[@rest-hooks/react](https://www.npmjs.com/package/@rest-hooks/react) is now a peerDependency
so be sure to install it. The [rest-hooks](https://www.npmjs.com/package/rest-hooks) will eventually
only proxy to exporting its members.

## Removals

The following previously deprecated members were removed in this release:

- hasUsableData() -> [Controller.getResponse](https://resthooks.io/docs/api/Controller#getResponse)
- useFetcher() -> [Controller.fetch](https://resthooks.io/docs/api/Controller#fetch)
- useInvalidateDispatcher() -> [Controller.invalidate](https://resthooks.io/docs/api/Controller#invalidate)
- useInvalidator() -> [Controller.invalidate](https://resthooks.io/docs/api/Controller#invalidate)
- useResetter() -> [Controller.resetEntireStore](https://resthooks.io/docs/api/Controller#resetEntireStore)

This functionality has been moved to [Controller](../api/Controller.md), accessible through
[useController()](../api/useController.md)

Redux-related members have been moved to [@rest-hooks/redux](https://www.npmjs.com/package/@rest-hooks/redux)
and have been removed from 'rest-hooks'. Be sure to update their import location to refer to [@rest-hooks/redux](https://www.npmjs.com/package/@rest-hooks/redux)

- [ExternalCacheProvider](../api/ExternalCacheProvider.md)
- PromiseifyMiddleware
- mapMiddleware


## Deprecations

The following members have been marked as deprecated. Consider changing them after upgrade:

- [useResource()](../api/useResource.md) -> [useSuspense()](../api/useSuspense.md)
- [useMeta()](../api/useMeta.md) -> [useError()](../api/useError.md)
- [useRetrieve()](../api/useRetrieve.md) -> [useFetch()](../api/useFetch.md)

## FetchShape -> Endpoint

The new hooks only support [EndpointInterface](/rest/api/Endpoint). [Endpoints](https://www.npmjs.com/package/@rest-hooks/endpoint)
have been around since 2020, so we expect most to already be upgraded by this point.

However, if you still have FetchShapes, you can easily convert them to [EndpointInterface](/rest/api/Endpoint) by
using [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy)'s shapeToEndpoint

```tsx
import { shapeToEndpoint } from '@rest-hooks/legacy';

function MyComponent() {
  const endpoint: any = useMemo(() => {
    return shapeToEndpoint(fetchShape);
    // we currently don't support shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mydata = useSuspense(endpoint, params);
  //...
}
```

## Test @8

Old-style fixtures using FetchShape were removed here.

Before:

```ts
const fixtures = [
  {
    request: CoolerArticleResource.detailShape(),
    params,
    result: payload,
  },
];
```

After:

```ts
const fixtures = [
  {
    endpoint: shapeToEndpoint(CoolerArticleResource.detailShape()),
    args: [payload],
    response: payload,
  },
];
```
