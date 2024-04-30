import { CacheProvider } from '@data-client/react';
import { makeRenderDataClient, renderHook, act } from '@data-client/test';
import { FixtureEndpoint } from '@data-client/test/mockState';
import { CoolerArticleResource, GetPhoto } from '__tests__/new';
import nock from 'nock';
import { useEffect } from 'react';

import { useCache, useController, useSuspense } from '../..';

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
  endpoint: CoolerArticleResource.get,
  args: [{ id: 5 }],
  response: payload,
};

export const nested: FixtureEndpoint = {
  endpoint: CoolerArticleResource.getList,
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
let renderDataClient: ReturnType<typeof makeRenderDataClient>;
let mynock: nock.Scope;

beforeEach(() => {
  renderDataClient = makeRenderDataClient(CacheProvider);
  mynock = nock(/.*/).defaultReplyHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
});
afterEach(() => {
  nock.cleanAll();
});

describe('expireAll', () => {
  // TODO: this test isn't really testing much
  it('should not expire anything not matching', () => {
    const { result, controller } = renderDataClient(
      () => {
        return {
          data: useCache(CoolerArticleResource.get, { id: 5 }),
        };
      },
      { initialFixtures: [detail], resolverFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    act(() => {
      controller.expireAll(CoolerArticleResource.update);
    });
    expect(result.current.data).toBeDefined();
    act(() => {
      controller.expireAll(CoolerArticleResource.getList);
    });
    expect(result.current.data).toBeDefined();
  });

  it('should suspend when invalidIfStale is used', () => {
    const throws: Promise<any>[] = [];

    const { result, controller } = renderDataClient(
      () => {
        try {
          return {
            data: useSuspense(
              CoolerArticleResource.get.extend({ invalidIfStale: true }),
              { id: 5 },
            ),
          };
        } catch (e: any) {
          if (typeof e.then === 'function') {
            if (e !== throws[throws.length - 1]) {
              throws.push(e);
            }
          }
          throw e;
        }
      },
      { initialFixtures: [detail], resolverFixtures: [detail] },
    );
    expect(throws.length).toBe(0);
    expect(result.current.data).toBeDefined();
    act(() => {
      controller.expireAll(CoolerArticleResource.get);
    });
    expect(throws.length).toBe(1);
  });

  it('should *not* suspend when invalidIfStale is false', () => {
    const throws: Promise<any>[] = [];

    const { result, controller } = renderDataClient(
      () => {
        try {
          return {
            data: useSuspense(CoolerArticleResource.get, { id: 5 }),
          };
        } catch (e: any) {
          if (typeof e.then === 'function') {
            if (e !== throws[throws.length - 1]) {
              throws.push(e);
            }
          }
          throw e;
        }
      },
      { initialFixtures: [detail], resolverFixtures: [detail] },
    );
    expect(throws.length).toBe(0);
    expect(result.current.data).toBeDefined();
    act(() => {
      controller.expireAll(CoolerArticleResource.get);
    });
    expect(throws.length).toBe(0);
    expect(result.current.data).toBeDefined();
  });

  it('should not change useCache()', () => {
    const { result, controller } = renderDataClient(
      () => {
        return {
          data: useCache(CoolerArticleResource.get, { id: 5 }),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    act(() => {
      controller.expireAll(CoolerArticleResource.get);
    });
    expect(result.current.data).toBeDefined();
  });

  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const expireAll = useController().expireAll;
      useEffect(track, [expireAll]);
    });
    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 4; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });

  it('should work with ArrayBuffer shapes', () => {
    const userId = '5';
    const response = new ArrayBuffer(10);
    const secondResponse = new ArrayBuffer(20);
    const { result, controller } = renderDataClient(
      () => {
        return {
          data: useSuspense(GetPhoto, { userId }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: GetPhoto,
            response,
            args: [{ userId }],
          },
        ],
        resolverFixtures: [
          {
            endpoint: GetPhoto,
            response: secondResponse,
            args: [{ userId }],
          },
        ],
      },
    );
    expect(result.current.data).toEqual(response);
    act(() => {
      controller.expireAll(GetPhoto);
    });
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toEqual(secondResponse);
  });
});
