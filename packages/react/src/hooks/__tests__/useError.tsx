import { CacheProvider } from '@data-client/react';
import { CoolerArticleResource } from '__tests__/new';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderDataClient } from '../../../../test';
import { payload } from '../test-fixtures';
import useError from '../useError';

describe('useError()', () => {
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;
  beforeEach(() => {
    renderDataClient = makeRenderDataClient(CacheProvider);
  });

  it('should return undefined when cache not ready and no error in meta', () => {
    const initialFixtures = [
      {
        endpoint: CoolerArticleResource.get,
        args: [{ id: payload.id }],
        response: payload,
      },
    ];
    const { result } = renderDataClient(
      () => {
        return useError(CoolerArticleResource.get, { id: payload.id });
      },
      { initialFixtures },
    );

    expect(result.current).toBeUndefined();
  });
});
