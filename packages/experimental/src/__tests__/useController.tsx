import {
  useCache,
  useSuspense,
  useFetch,
  CacheProvider,
} from '@rest-hooks/react';
import { FixtureEndpoint } from '@rest-hooks/test/mockState';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from '@testing-library/react-hooks';
import { CoolerArticleDetail, FutureArticleResource } from '__tests__/new';
import nock from 'nock';
import { useEffect } from 'react';

import { useController } from '..';
import { makeRenderRestHook } from '../../../test';

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
  renderRestHook = makeRenderRestHook(CacheProvider);
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
    const { result, controller } = renderRestHook(
      () => {
        return {
          data: useCache(FutureArticleResource.get, 5),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    act(() => {
      controller.invalidate(FutureArticleResource.get, 5);
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
    const { result, controller } = renderRestHook(
      () => {
        return {
          data: useCache(FutureArticleResource.get, 5),
          controller: useController(),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    act(() => {
      controller.resetEntireStore();
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
      renderRestHook = makeRenderRestHook(CacheProvider);
    });

    /**
     * useResource(), useRetrive() will re-issue needed fetches upon reset so they never end up loading infinitely
     *    this only triggers after commit of reset action so users have a chance to unmount those components if they are no longer relevant (like doing a url redirect from an unauthorized page)
     */
    it('should refetch useResource() after reset', async () => {
      const consoleSpy = jest.spyOn(console, 'error');

      mynock
        .get(`/article-cooler/${9999}`)
        .delay(2)
        .reply(200, { ...payload, id: 9999 })
        .persist();

      const { result, rerender, controller } = renderRestHook(() => {
        return useSuspense(CoolerArticleDetail, { id: 9999 });
      });
      expect(result.current).toBeUndefined();
      act(() => rerender());
      // should not be resolved
      expect(result.current).toBeUndefined();
      act(() => {
        controller.resetEntireStore();
      });
      act(() => rerender());

      await waitFor(() => expect(result.current).toBeDefined());
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
        .delay(2)
        .reply(200, {
          ...payload,
          id: 9999,
          title: 'latest and greatest title',
        })
        .persist();

      const { result, rerender, controller } = renderRestHook(
        () => {
          return useCache(CoolerArticleDetail, { id: 9999 });
        },
        { initialFixtures: [detail] },
      );
      expect(result.current).toBeDefined();
      expect(result.current?.title).not.toEqual('latest and greatest title');
      controller.fetch(CoolerArticleDetail, { id: 9999 }).catch((e: any) => {
        console.log('...', e);
      });
      act(() => rerender());
      // should not be resolved
      expect(result.current?.title).not.toEqual('latest and greatest title');
      act(() => {
        controller.resetEntireStore();
      });

      act(() => rerender());

      // TODO: Figure out a way to wait until fetch chain resolution instead of waiting on time
      await act(() => new Promise(resolve => setTimeout(resolve, 20)));

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
        return useFetch(CoolerArticleDetail, { id: 9999 });
      });

      //expect(result.current.resolved).toBe(undefined);
      const consoleSpy = jest.spyOn(console, 'error');
      act(() => unmount());

      // TODO: Figure out a way to wait until fetch chain resolution instead of waiting on time
      await act(() => new Promise(resolve => setTimeout(resolve, 20)));

      // when trying to dispatch on unmounted this will trigger console errors
      expect(consoleSpy.mock.calls.length).toBeLessThan(1);
    });
  });
});
