import { CoolerArticleResource } from '__tests__/common';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderRestHook, makeCacheProvider } from '../../../../test';
import { useError } from '../hooks';
import { payload } from '../test-fixtures';

describe('useError()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should return 404 when cache not ready and no error in meta', () => {
    const results = [
      {
        request: CoolerArticleResource.detailShape(),
        params: payload,
        result: payload,
      },
    ];
    const { result } = renderRestHook(
      () => {
        return useError(CoolerArticleResource.detailShape(), payload, false);
      },
      { results },
    );

    expect(result.current).toBeDefined();
    expect((result.current as any).status).toBe(400);
    expect(result.current).toMatchInlineSnapshot(`
      [Error: Entity from "GET http://test.com/article-cooler/5" not found in cache.

              This is likely due to a malformed response.
              Try inspecting the network response or fetch() return value.

              Schema: {
        "name": "CoolerArticleResource",
        "schema": {
          "author": {
            "name": "UserResource",
            "schema": {},
            "key": "http://test.com/user/"
          }
        },
        "key": "http://test.com/article-cooler/"
      }]
    `);
  });
});
