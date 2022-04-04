import { CoolerArticleResource } from '__tests__/legacy-3';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderRestHook, makeCacheProvider } from '../../../../test';
import { useError } from '../hooks';
import { payload } from '../test-fixtures';

describe('useError()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should return undefined when cache not ready and no error in meta', () => {
    const results = [
      {
        request: CoolerArticleResource.detailShape(),
        params: payload,
        result: payload,
      },
    ];
    const { result } = renderRestHook(
      () => {
        return useError(CoolerArticleResource.detailShape(), payload);
      },
      { results },
    );

    expect(result.current).toBeUndefined();
  });
});
