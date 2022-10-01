import { useEffect } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import nock from 'nock';
import {
  CoolerArticle,
  CoolerArticleDetail,
  FutureArticleResource,
} from '__tests__/new';
import { FixtureEndpoint } from '@rest-hooks/test/mockState';
import { act } from '@testing-library/react-hooks';
import { useCache, useError, useResource } from '@rest-hooks/core';
import { useRetrieve } from '@rest-hooks/core';

import { makeRenderRestHook, makeCacheProvider } from '../../../../test';
import useController from '../../react-integration/hooks/useController';

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

describe('receive', () => {
  it('should update store when receive is complete', async () => {
    const { result } = renderRestHook(() => {
      return {
        data: useCache(FutureArticleResource.get, payload.id),
        receive: useController().receive,
      };
    });
    expect(result.current.data).toBeUndefined();
    const ep = FutureArticleResource.get;
    await act(async () => {
      await result.current.receive(ep, 5, payload);
    });
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.content).toEqual(payload.content);
    expect(result.current.data).toEqual(CoolerArticle.fromJS(payload));

    // type tests
    // TODO: move these to own unit tests if/when applicable
    () => {
      // @ts-expect-error
      result.current.receive(ep, payload);
      result.current.receive(
        ep,
        // @ts-expect-error
        {
          id: payload.id,
        },
        payload,
      );
      const create = FutureArticleResource.create;
      const update = FutureArticleResource.update;
      result.current.receive(create, payload, payload);
      // @ts-expect-error
      result.current.receive(create, {}, payload, payload);
      result.current.receive(update, payload.id, payload, payload);
      // @ts-expect-error
      result.current.receive(update, payload, payload);
    };
  });

  it('should update store with error', async () => {
    const { result } = renderRestHook(() => {
      return {
        data: useCache(FutureArticleResource.get, payload.id),
        err: useError(FutureArticleResource.get, payload.id),
        receiveError: useController().receiveError,
      };
    });
    expect(result.current.data).toBeUndefined();
    const error = new Error('hi');
    const ep = FutureArticleResource.get;
    await act(async () => {
      await result.current.receiveError(ep, 5, error);
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.err).toBeDefined();
    expect(result.current.err).toBe(error);

    // type tests
    // TODO: move these to own unit tests if/when applicable
    () => {
      // @ts-expect-error
      result.current.receiveError(ep, error);
      result.current.receiveError(
        ep,
        // @ts-expect-error
        {
          id: payload.id,
        },
        error,
      );
      const create = FutureArticleResource.create;
      const update = FutureArticleResource.update;
      result.current.receiveError(create, payload, error);
      // @ts-expect-error
      result.current.receiveError(create, {}, payload, error);
      result.current.receiveError(update, payload.id, payload, error);
      // @ts-expect-error
      result.current.receiveError(update, payload, error);
    };
  });
});
