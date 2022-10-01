import { CoolerArticleResource } from '__tests__/new';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderRestHook, makeCacheProvider } from '../../../../../test';
import useError from '../useError';
import { payload } from '../test-fixtures';

describe('useError()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should return undefined when cache not ready and no error in meta', () => {
    const results = [
      {
        endpoint: CoolerArticleResource.get,
        args: [{ id: payload.id }],
        response: payload,
      },
    ];
    const { result } = renderRestHook(
      () => {
        return useError(CoolerArticleResource.get, { id: payload.id });
      },
      { results },
    );

    expect(result.current).toBeUndefined();
  });
});
