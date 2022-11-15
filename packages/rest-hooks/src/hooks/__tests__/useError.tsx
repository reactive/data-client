import { shapeToEndpoint } from '@rest-hooks/legacy';
import makeCacheProvider from '@rest-hooks/react/makeCacheProvider';
import { CoolerArticleResource } from '__tests__/legacy-3';

// relative imports to avoid circular dependency in tsconfig references
import { useError } from '..';
import { makeRenderRestHook } from '../../../../test';
import { payload } from '../test-fixtures';

describe('useError()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should return undefined when cache not ready and no error in meta', () => {
    const results = [
      {
        endpoint: shapeToEndpoint(CoolerArticleResource.detailShape()),
        args: [payload],
        response: payload,
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
