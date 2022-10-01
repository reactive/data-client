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
import { useController } from '..';

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
  endpoint: FutureArticleResource.get,
  args: [5],
  response: payload,
};

export const nested: FixtureEndpoint = {
  endpoint: FutureArticleResource.getList,
  args: [],
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
          data: useCache(FutureArticleResource.get, 5),
          controller: useController(),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    await act(async () => {
      await result.current.controller.invalidate(
        FutureArticleResource.get,
        null,
      );
    });
    expect(result.current.data).toBeDefined();
  });

  it('should result in useCache having no entry', async () => {
    const { result } = renderRestHook(
      () => {
        return {
          data: useCache(FutureArticleResource.get, 5),
          controller: useController(),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    await act(async () => {
      await result.current.controller.invalidate(FutureArticleResource.get, 5);
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
          data: useCache(FutureArticleResource.get, 5),
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

    /**
     * useResource(), useRetrive() will re-issue needed fetches upon reset so they never end up loading infinitely
     *    this only triggers after commit of reset action so users have a chance to unmount those components if they are no longer relevant (like doing a url redirect from an unauthorized page)
     */
    it('should refetch useResource() after reset', async () => {
      const consoleSpy = jest.spyOn(console, 'error');

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
      act(() => {
        resetEntireStore();
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      act(() => rerender());
      jest.advanceTimersByTime(5000);
      await waitForNextUpdate();

      expect(result.current).toBeDefined();
      expect(result.current.title).toEqual(payload.title);

      // ensure it doesn't try to setstate during render (dispatching during fetch - which is called from memo)
      expect(consoleSpy.mock.calls.length).toBeLessThan(1);
    });

    /**
     * upon reset, all inflight requests will not dispatch receives
     *    promises still reject so external listeners know (abort signals do this as well)
     */
    it('should not receive fetches that started before RESET', async () => {
      const detail: FixtureEndpoint = {
        endpoint: CoolerArticleDetail,
        args: [{ id: 9999 }],
        response: { ...payload, id: 9999 },
      };
      mynock
        .get(`/article-cooler/${9999}`)
        //.delay(2000)
        .reply(200, {
          ...payload,
          id: 9999,
          title: 'latest and greatest title',
        })
        .persist();

      let resetEntireStore: any;
      let fetch: any;

      const { result, rerender } = renderRestHook(
        () => {
          // cheating result since useResource will suspend
          ({ resetEntireStore, fetch } = useController());
          return useCache(CoolerArticleDetail, { id: 9999 });
        },
        { initialFixtures: [detail] },
      );
      expect(result.current).toBeDefined();
      expect(result.current?.title).not.toEqual('latest and greatest title');
      fetch(CoolerArticleDetail, { id: 9999 }).catch((e: any) => {
        console.log('...', e);
      });
      jest.advanceTimersByTime(1000);
      act(() => rerender());
      // should not be resolved
      expect(result.current?.title).not.toEqual('latest and greatest title');
      act(() => {
        resetEntireStore();
      });

      jest.advanceTimersByTime(5000);
      act(() => rerender());
      jest.advanceTimersByTime(5000);
      jest.runAllTimers();
      jest.runAllTicks();

      // TODO: Figure out a way to wait until fetch chain resolution instead of waiting on time
      jest.useRealTimers();
      await act(() => new Promise(resolve => setTimeout(resolve, 100)));

      // should still not be resolved
      expect(result.current?.title).not.toEqual('latest and greatest title');
    });

    /**
     * unmounting CacheProvider with inflight requests will not attempt to dispatch after unmount causing react error
     *    promises are neither resolved nor rejected
     */
    it('should not dispatch resolutions after CacheProvider unmounts', async () => {
      mynock
        .get(`/article-cooler/${9999}`)
        .reply(200, () => {
          return { ...payload, id: 9999 };
        })
        .persist();
      jest.useRealTimers();

      const { unmount, result } = renderRestHook(() => {
        return useRetrieve(CoolerArticleDetail, { id: 9999 });
      });

      expect(result.current.resolved).toBe(undefined);
      const consoleSpy = jest.spyOn(console, 'error');
      act(() => unmount());

      // TODO: Figure out a way to wait until fetch chain resolution instead of waiting on time
      await act(() => new Promise(resolve => setTimeout(resolve, 100)));

      // when trying to dispatch on unmounted this will trigger console errors
      expect(consoleSpy.mock.calls.length).toBeLessThan(1);
    });
  });
});
