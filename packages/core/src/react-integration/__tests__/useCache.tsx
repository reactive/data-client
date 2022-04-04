import {
  CoolerArticleResource,
  PaginatedArticleResource,
  InvalidIfStaleArticleResource,
  noEntitiesShape,
} from '__tests__/legacy-3';
import React, { useEffect } from 'react';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderRestHook, makeCacheProvider } from '../../../../test';
import { useCache } from '../hooks';
import { articlesPages, payload } from '../test-fixtures';

describe('useCache()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should be null with empty state', () => {
    const { result } = renderRestHook(() => {
      return useCache(CoolerArticleResource.detailShape(), payload);
    }, {});
    // @ts-expect-error
    result.current?.doesnotexist;
    expect(result.current).toBe(undefined);
  });

  it('should return undefined in entities slots when results are not found', async () => {
    const userId = '5';
    const { result } = renderRestHook(() => {
      return useCache(noEntitiesShape, { userId });
    });
    expect(result.current).toEqual({ firstThing: '', someItems: undefined });
  });

  it('should select singles', () => {
    const results = [
      {
        request: CoolerArticleResource.detailShape(),
        params: payload,
        result: payload,
      },
    ];
    const { result } = renderRestHook(
      () => {
        return useCache(CoolerArticleResource.detailShape(), payload);
      },
      { results },
    );

    expect(result.current).toBeTruthy();
    expect(result.current?.title).toBe(payload.title);
  });

  it('should not select when results are stale and invalidIfStale is true', () => {
    const realDate = global.Date.now;
    Date.now = jest.fn(() => 999999999);
    const results = [
      {
        request: InvalidIfStaleArticleResource.detailShape(),
        params: payload,
        result: payload,
      },
    ];
    const { result, rerender } = renderRestHook(
      props => {
        return useCache(InvalidIfStaleArticleResource.detailShape(), props);
      },
      { results, initialProps: { id: payload.id } },
    );

    expect(result.current).toBeDefined();
    Date.now = jest.fn(() => 999999999 * 3);

    rerender({ id: payload.id * 2 });
    expect(result.current).toBeUndefined();
    rerender({ id: payload.id });
    expect(result.current).toBeUndefined();

    global.Date.now = realDate;
  });

  it('should select paginated results', () => {
    const results = [
      {
        request: PaginatedArticleResource.listShape(),
        params: {},
        result: articlesPages,
      },
    ];
    const { result } = renderRestHook(
      () => {
        return useCache(PaginatedArticleResource.listShape(), {});
      },
      { results },
    );
    expect(result.current).toBeDefined();
    if (!result.current) return;
    expect(result.current.results).toBeDefined();
    if (!result.current.results) return;
    expect(result.current.results.length).toBe(articlesPages.results.length);
    expect(result.current.results[0]).toBeInstanceOf(PaginatedArticleResource);
    expect(result.current.results).toMatchSnapshot();
  });

  it('should return identical value no matter how many re-renders', () => {
    const results = [
      {
        request: PaginatedArticleResource.listShape(),
        params: {},
        result: articlesPages,
      },
    ];
    const track = jest.fn();

    const { rerender } = renderRestHook(
      () => {
        const articles = useCache(PaginatedArticleResource.listShape(), {});
        useEffect(track, [articles]);
      },
      { results },
    );

    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 2; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });

  describe('Nested with defaults', () => {
    it('should send defaults with nothing in state', () => {
      const defaults = { prevPage: '', nextPage: '', results: undefined };
      const { result } = renderRestHook(
        () => {
          return useCache(PaginatedArticleResource.listShape(), {});
        },
        { results: [] },
      );
      expect(result.current).toEqual(defaults);
    });

    it('should find results', () => {
      const results = [
        {
          request: PaginatedArticleResource.listShape(),
          params: {},
          result: articlesPages,
        },
      ];
      const { result } = renderRestHook(
        () => {
          return useCache(PaginatedArticleResource.listShape(), {});
        },
        { results },
      );
      expect(result.current).toBeTruthy();
      expect(result.current.nextPage).toBe(articlesPages.nextPage);
      expect(result.current.prevPage).toBe(articlesPages.prevPage);
      expect(result.current.results).toEqual(
        articlesPages.results.map(article =>
          PaginatedArticleResource.fromJS(article),
        ),
      );
    });

    it('should return identical value no matter how many re-renders', () => {
      const results = [
        {
          request: PaginatedArticleResource.listShape(),
          params: {},
          result: articlesPages,
        },
      ];
      const track = jest.fn();

      const { rerender } = renderRestHook(
        () => {
          useEffect(track, [results]);
          return useCache(PaginatedArticleResource.listShape(), {});
        },
        { results },
      );

      expect(track.mock.calls.length).toBe(1);
      for (let i = 0; i < 2; ++i) {
        rerender();
      }
      expect(track.mock.calls.length).toBe(1);
    });
  });
});
