---
frameworks: [react]
title: Unit testing hooks
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

Be careful with [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) on Reactive Data
Client modules. A mock that removes exports causes errors that are hard to trace, such as
`TypeError: Class extends value undefined is not a function or null`.

Use a [partial mock](https://jestjs.io/docs/mock-functions#mocking-partials) instead, or better,
[mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules) on your endpoints.

:::

[renderDataHook()](../api/renderDataHook.md) renders a hook inside a `DataProvider` and a `Suspense` boundary. It wraps
[@testing-library/react](https://testing-library.com/docs/react-testing-library/api#renderhook)'s `renderHook()` (React
18 and later) or [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library)
(React 17), and adds `result.error`, `waitFor()` and `waitForNextUpdate()`.

Each call to `renderDataHook()` creates new manager instances, so every test starts with an empty cache. Cleanup runs
automatically after each test.

### Polyfill fetch in node &lt; 18

Node 18 and later include `fetch`. For older versions, add a polyfill:

<PkgTabs pkgs="whatwg-fetch" dev />

### Jest

```js
// jest.config.js
module.exports = {
  // other things
  setupFiles: ['./testSetup.js'],
};
```

```js
// testSetup.js
require('whatwg-fetch');
```

### Example

<Tabs
defaultValue="DataProvider"
values={[
{ label: '@data-client/react', value: 'DataProvider' },
{ label: '@data-client/react/redux', value: 'ExternalDataProvider' },
]}>
<TabItem value="DataProvider">

```typescript
import nock from 'nock';
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { ArticleResource } from '../resources/Article';

describe('useSuspense()', () => {
  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article/0`)
      .reply(403, {});
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should throw errors on bad network', async () => {
    const { result, waitFor } = renderDataHook(() => {
      return useSuspense(ArticleResource.get, {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });
});
```

</TabItem>
<TabItem value="ExternalDataProvider">

```typescript
import nock from 'nock';
import { useSuspense } from '@data-client/react';
import { makeRenderDataHook } from '@data-client/test';
import { DataProvider } from '@data-client/react/redux';
import { ArticleResource } from '../resources/Article';

describe('useSuspense()', () => {
  let renderDataHook: ReturnType<typeof makeRenderDataHook>;

  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article/0`)
      .reply(403, {});
    renderDataHook = makeRenderDataHook(DataProvider);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should throw errors on bad network', async () => {
    const { result, waitFor } = renderDataHook(() => {
      return useSuspense(ArticleResource.get, {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });
});
```

</TabItem>
</Tabs>
