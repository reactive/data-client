import React, { useEffect } from 'react';
import {
  CoolerArticleResource,
  PaginatedArticleResource,
} from '../../__tests__/common';
import { useCache } from '../hooks';
import makeRenderRestHook from '../../test/makeRenderRestHook';
import { makeCacheProvider } from '../../test/providers';
import { articlesPages, payload } from './fixtures';

describe('useCache()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });
  afterEach(() => {
    renderRestHook.cleanup();
  });

  it('should be null with empty state', () => {
    const { result } = renderRestHook(() => {
      return useCache(CoolerArticleResource.detailShape(), payload);
    }, {});
    expect(result.current).toBe(undefined);
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
    expect(result.current && result.current.title).toBe(payload.title);
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
