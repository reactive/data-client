import { CacheProvider } from '@rest-hooks/react';
import { CoolerArticleResource } from '__tests__/new';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderRestHook } from '../../../../test';
import { payload } from '../test-fixtures';
import useError from '../useError';

describe('useError()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(CacheProvider);
  });

  it('should return undefined when cache not ready and no error in meta', () => {
    const initialFixtures = [
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
      { initialFixtures },
    );

    expect(result.current).toBeUndefined();
  });
});
