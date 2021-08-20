import { Suspense, useEffect } from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import nock from 'nock';
import { CoolerArticleDetail, FutureArticleResource } from '__tests__/new';
import { FixtureEndpoint } from '@rest-hooks/test/mockState';
import { act } from '@testing-library/react-hooks';
import { useCache, useResource } from '@rest-hooks/core';
import React from 'react';
import { useRetrieve } from '@rest-hooks/core';

import {
  makeRenderRestHook,
  makeCacheProvider,
  MockNetworkManager,
} from '../../../test';
import useController from '../useController';

export const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

export const createPayload = {
  id: 1,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

export const detail: FixtureEndpoint = {
  endpoint: FutureArticleResource.detail(),
  args: [5],
  response: payload,
};

export const nested: FixtureEndpoint = {
  endpoint: FutureArticleResource.list(),
  args: [{}],
  response: [
    {
      id: 5,
      title: 'hi ho',
      content: 'whatever',
      tags: ['a', 'best', 'react'],
      author: {
        id: 23,
        username: 'bob',
      },
    },
    {
      id: 3,
      title: 'the next time',
      content: 'whatever',
      author: {
        id: 23,
        username: 'charles',
        email: 'bob@bob.com',
      },
    },
  ],
};
let renderRestHook: ReturnType<typeof makeRenderRestHook>;
let mynock: nock.Scope;

beforeEach(() => {
  renderRestHook = makeRenderRestHook(makeCacheProvider);
  mynock = nock(/.*/).defaultReplyHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
});
afterEach(() => {
  nock.cleanAll();
});

describe('invalidate', () => {
  it('should not invalidate anything if params is null', async () => {
    const { result } = renderRestHook(
      () => {
        return {
          data: useCache(FutureArticleResource.detail(), 5),
          controller: useController(),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    await act(async () => {
      await result.current.controller.invalidate(
        FutureArticleResource.detail(),
        null,
      );
    });
    expect(result.current.data).toBeDefined();
  });

  it('should result in useCache having no entry', async () => {
    const { result } = renderRestHook(
      () => {
        return {
          data: useCache(FutureArticleResource.detail(), 5),
          controller: useController(),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    await act(async () => {
      await result.current.controller.invalidate(
        FutureArticleResource.detail(),
        5,
      );
    });
    expect(result.current.data).toBeUndefined();
  });

  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const invalidate = useController().invalidate;
      useEffect(track, [invalidate]);
    });
    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 4; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });
});

describe('resetEntireStore', () => {
  it('should result in useCache having no entry', async () => {
    const { result } = renderRestHook(
      () => {
        return {
          data: useCache(FutureArticleResource.detail(), 5),
          controller: useController(),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    await act(async () => {
      await result.current.controller.resetEntireStore();
    });
    expect(result.current.data).toBeUndefined();
  });

  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const reset = useController().resetEntireStore;
      useEffect(track, [reset]);
    });
    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 4; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });

  describe('integration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      renderRestHook = makeRenderRestHook(makeCacheProvider);
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should refetch useResource() after reset', async () => {
      mynock
        .get(`/article-cooler/${9999}`)
        .delay(2000)
        .reply(200, { ...payload, id: 9999 })
        .persist();

      let resetEntireStore: any;

      const { result, waitForNextUpdate, rerender } = renderRestHook(() => {
        // cheating result since useResource will suspend
        ({ resetEntireStore } = useController());
        return useResource(CoolerArticleDetail, { id: 9999 });
      });
      expect(result.current).toBeUndefined();
      jest.advanceTimersByTime(1000);
      act(() => rerender());
      // should not be resolved
      expect(result.current).toBeUndefined();
      await act(resetEntireStore);
      jest.advanceTimersByTime(5000);
      act(() => rerender());
      jest.advanceTimersByTime(5000);

      await waitForNextUpdate();
      expect(result.current).toBeDefined();
      expect(result.current.title).toEqual(payload.title);
    });

    it('should not dispatch resolutions after CacheProvider unmounts', async () => {
      mynock
        .get(`/article-cooler/${9999}`)
        .reply(200, () => {
          return { ...payload, id: 9999 };
        })
        .persist();

      const { unmount, result } = renderRestHook(() => {
        return useRetrieve(CoolerArticleDetail, { id: 9999 });
      });

      expect(result.current.resolved).toBe(undefined);
      const consoleSpy = jest.spyOn(console, 'error');
      act(() => unmount());
      jest.advanceTimersByTime(5000);
      jest.useRealTimers();
      // TODO: Figure out a way to wait until fetch chain resolution instead of waiting on time
      await act(() => new Promise(resolve => setTimeout(resolve, 100)));

      // when trying to dispatch on unmounted this will trigger console errors
      expect(consoleSpy.mock.calls.length).toBeLessThan(1);
    });
  });
});
