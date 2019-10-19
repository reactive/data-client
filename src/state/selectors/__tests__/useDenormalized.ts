import { renderHook } from '@testing-library/react-hooks';
import { CoolerArticleResource } from '../../../__tests__/common';
import useDenormalized from '../useDenormalized';

describe('useDenormalized()', () => {
  it('should throw when results are Array', () => {
    const params = { title: 'bob' };
    const state = {
      entities: {},
      results: {
        [CoolerArticleResource.detailShape().getFetchKey(params)]: [5, 6, 7],
      },
      meta: {},
    };
    const { result } = renderHook(() =>
      useDenormalized(CoolerArticleResource.detailShape(), params, state),
    );
    expect(result.error).toBeDefined();
  });
  it('should throw when results are Object', () => {
    const params = { title: 'bob' };
    const state = {
      entities: {},
      results: {
        [CoolerArticleResource.detailShape().getFetchKey(params)]: {
          results: [5, 6, 7],
        },
      },
      meta: {},
    };
    const { result } = renderHook(() =>
      useDenormalized(CoolerArticleResource.detailShape(), params, state),
    );
    expect(result.error).toBeDefined();
  });
  it('should be undefined when state is empty', () => {
    const state: any = { entities: {}, results: {}, meta: {} };
    const { result } = renderHook(() =>
      useDenormalized(CoolerArticleResource.detailShape(), { id: 5 }, state),
    );

    expect(result.current).toStrictEqual([undefined, false]);
  });
});
