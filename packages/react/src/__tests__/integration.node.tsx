import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import { CoolerArticleDetail } from '__tests__/new';

// relative imports to avoid circular dependency in tsconfig references
import React from 'react';

import { makeRenderDataClient, act } from '../../../test';
import { useCache, useSuspense } from '../hooks';
import { useController } from '../hooks';
import { payload } from '../test-fixtures';

describe('SSR', () => {
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;

  beforeEach(() => {
    renderDataClient = makeRenderDataClient(ExternalDataProvider);
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
    // React 19 does not support SSR hook testing
    if (Number(React.version.substring(0, 3)) >= 19) return;

    const { result, waitFor } = renderDataClient(
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
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current.title).toBe(payload.title);
    // @ts-expect-error
    expect(result.current.lafsjlfd).toBeUndefined();
  });
});
