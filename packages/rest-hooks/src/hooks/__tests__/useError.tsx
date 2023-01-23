import { shapeToEndpoint } from '@rest-hooks/legacy';
import { CacheProvider } from '@rest-hooks/react';
import { CoolerArticleResource } from '__tests__/legacy-3';

// relative imports to avoid circular dependency in tsconfig references
import { useError } from '..';
import { makeRenderRestHook } from '../../../../test';
import { payload } from '../test-fixtures';

describe('useError()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(CacheProvider);
  });

  it('should return undefined when cache not ready and no error in meta', () => {
    const initialFixtures = [
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
      { initialFixtures },
    );

    expect(result.current).toBeUndefined();
  });
});
