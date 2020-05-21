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
  afterEach(() => {
    renderRestHook.cleanup();
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
    expect((result.current as any).status).toBe(404);
    expect(result.current).toMatchInlineSnapshot(
      `[Error: Resource not found in cache GET http://test.com/article-cooler/5]`,
    );
  });
});
