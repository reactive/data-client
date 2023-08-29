import { CacheProvider } from '@data-client/react';
import { FixtureEndpoint } from '@data-client/test/mockState';
import { renderHook } from '@testing-library/react-hooks';
import { act } from '@testing-library/react-hooks';
import { FutureArticleResource, GetPhoto } from '__tests__/new';
import nock from 'nock';
import { useEffect } from 'react';

import { useCache, useController } from '../..';
import { makeRenderDataClient } from '../../../../../test';

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

describe('invalidate', () => {
  it('should not invalidate anything if params is null', () => {
    const { result } = renderDataClient(
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
      result.current.controller.invalidate(FutureArticleResource.get, null);
    });
    expect(result.current.data).toBeDefined();
  });

  it('should result in useCache having no entry', () => {
    const { result } = renderDataClient(
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
      result.current.controller.invalidate(FutureArticleResource.get, 5);
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
      result.current.controller.invalidate(GetPhoto, { userId });
    });
    expect(result.current.data).toBeUndefined();
  });
});
