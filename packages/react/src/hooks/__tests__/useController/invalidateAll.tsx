import { CacheProvider } from '@data-client/react';
import { makeRenderDataClient, renderHook, act } from '@data-client/test';
import { FixtureEndpoint } from '@data-client/test/mockState';
import { CoolerArticleResource, GetPhoto } from '__tests__/new';
import nock from 'nock';
import { useEffect } from 'react';

import { useCache, useController } from '../..';

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

describe('invalidateAll', () => {
  it('should not invalidate anything not matching', () => {
    const { result } = renderDataClient(
      () => {
        return {
          data: useCache(CoolerArticleResource.get, { id: 5 }),
          controller: useController(),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    act(() => {
      result.current.controller.invalidateAll(CoolerArticleResource.update);
    });
    expect(result.current.data).toBeDefined();
    act(() => {
      result.current.controller.invalidateAll(CoolerArticleResource.getList);
    });
    expect(result.current.data).toBeDefined();
  });

  it('should result in useCache having no entry', () => {
    const { result } = renderDataClient(
      () => {
        return {
          data: useCache(CoolerArticleResource.get, { id: 5 }),
          controller: useController(),
        };
      },
      { initialFixtures: [detail] },
    );
    expect(result.current.data).toBeDefined();
    act(() => {
      result.current.controller.invalidateAll(CoolerArticleResource.get);
    });
    expect(result.current.data).toBeUndefined();
  });

  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const invalidateAll = useController().invalidateAll;
      useEffect(track, [invalidateAll]);
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
    const { result, waitForNextUpdate } = renderDataClient(
      () => {
        return {
          data: useCache(GetPhoto, { userId }),
          controller: useController(),
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
      },
    );
    expect(result.current.data).toEqual(response);
    act(() => {
      result.current.controller.invalidateAll(GetPhoto);
    });
    expect(result.current.data).toBeUndefined();
  });
});
