---
title: Unit testing hooks
---

Hooks allow you to pull complex behaviors out of your components into succinct,
composable functions. This makes testing component behavior potentially much
easier. But how does this work if you want to use hooks from `rest-hooks`?

We have provided some simple utilities to reduce boilerplate for unit tests
that are wrappers around [react-hooks-testing-library](https://github.com/mpeyper/react-hooks-testing-library)'s [renderHook()](https://github.com/mpeyper/react-hooks-testing-library#renderhookcallback-options).

We want a `renderRestHook()` function that renders in the context of both
a `Provider` and `Suspense` boundary.

To support both providers, you must choose among two provider-generators to
send as args to the `renderRestHook()` generator.

These will generally be done during test setup. It's important to call cleanup
upon test completion.

### Example:

```typescript
import nock from 'nock';
import { makeRenderRestHook, makeCacheProvider } from 'rest-hooks/test';

describe('useResource()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;

  beforeEach(() => {
    nock('http://test.com')
      .get(`/article/0`)
      .reply(403, {});
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  afterEach(() => {
    renderRestHook.cleanup();
  });

  it('should throw errors on bad network', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(ArticleResource.singleRequest(), {
        title: '0',
      });
    });
    expect(result.current).toBe(null);
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });
});
```
