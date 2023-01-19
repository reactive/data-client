---
title: Upgrading from 6 to 7
---

import BeforeAfterTabs from '@site/src/components/BeforeAfterTabs';
import PkgTabs from '@site/src/components/PkgTabs';
import PkgInstall from '@site/src/components/PkgInstall';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<PkgTabs pkgs="rest-hooks@7 @rest-hooks/react@6 @rest-hooks/redux@6 @rest-hooks/test@9" upgrade />

[@rest-hooks/react](https://www.npmjs.com/package/@rest-hooks/react) is now a peerDependency
so be sure to install it. The [rest-hooks](https://www.npmjs.com/package/rest-hooks) will eventually
only proxy to exporting its members.

For those on @rest-hooks/rest 3 or 4, you'll need to upgrade to the latest on that major release (3.1 or 4.1),
then upgrade @rest-hooks/endpoint to 3.

<Tabs
defaultValue="4"
values={[
{ label: 'rest@4', value: '4' },
{ label: 'rest@3', value: '3' },
]}>
<TabItem value="4">
<PkgInstall pkgs="@rest-hooks/rest@4.1 @rest-hooks/endpoint@3" upgrade />
</TabItem>
<TabItem value="3">
<PkgInstall pkgs="@rest-hooks/rest@3.1 @rest-hooks/endpoint@3" upgrade />
</TabItem>
</Tabs>

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

## Test @9

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

## Preparing for the future

Once you have successfully upgraded, you can try converting all 'rest-hooks' imports to '@rest-hooks/react'.
This will become the recommended way to consume rest hooks when using React. The 'rest-hooks' package will
still work but eventually remove any additions.

- `import {} from 'rest-hooks'` -> `import {} from '@rest-hooks/react'`
- `import { makeCacheProvider } from '@rest-hooks/test';` -> `import makeCacheProvider from '@rest-hooks/react/makeCacheProvider';`
- `import { makeExternalCacheProvider } from '@rest-hooks/test';` -> `import makeExternalCacheProvider from '@rest-hooks/redux/makeCacheProvider';`

## Support

If you have any trouble upgrading, you can get some help from the community discord [![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

If you find any bugs or other issues, feel free to open a [github ticket](https://github.com/coinbase/rest-hooks/issues/new/choose)
