import { CacheProvider as ExternalCacheProvider } from '@data-client/redux';
import { act } from '@testing-library/react-hooks';
import { CoolerArticleDetail } from '__tests__/new';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderDataClient } from '../../../test';
import { useCache, useSuspense } from '../hooks';
import { useController } from '../hooks';
import { payload } from '../test-fixtures';

describe('SSR', () => {
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;

  beforeEach(() => {
    renderDataClient = makeRenderDataClient(ExternalCacheProvider);
  });

  it('should update useCache()', async () => {
    const { result } = renderDataClient(
      () => {
        return [
          useCache(CoolerArticleDetail, { id: payload.id }),
          useController(),
        ] as const;
      },
      {
        resolverFixtures: [
          {
            endpoint: CoolerArticleDetail,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      },
    );
    expect(result.current[0]).toBeUndefined();
    await act(async () => {
      await result.current[1].fetch(CoolerArticleDetail, { id: payload.id });
    });
    expect(result.current[0]?.title).toBe(payload.title);
    // @ts-expect-error
    expect(result.current[0]?.lafsjlfd).toBeUndefined();
  });

  it('should resolve useSuspense()', async () => {
    const { result, waitForNextUpdate } = renderDataClient(
      () => {
        return useSuspense(CoolerArticleDetail, payload);
      },
      {
        resolverFixtures: [
          {
            endpoint: CoolerArticleDetail,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      },
    );
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current.title).toBe(payload.title);
    // @ts-expect-error
    expect(result.current.lafsjlfd).toBeUndefined();
  });
});
