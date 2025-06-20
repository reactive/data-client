import { CacheProvider } from '@data-client/react';
import { act, FixtureEndpoint } from '@data-client/test';
import { CoolerArticle, FutureArticleResource } from '__tests__/new';
import nock from 'nock';

import { useCache, useController, useError } from '../..';
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

describe('setResponse', () => {
  it('should update store when set is complete', async () => {
    const { result } = renderDataClient(() => {
      return {
        data: useCache(FutureArticleResource.get, payload.id),
        setResponse: useController().setResponse,
      };
    });
    expect(result.current.data).toBeUndefined();
    const ep = FutureArticleResource.get;
    await result.current.setResponse(ep, 5, payload);
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.content).toEqual(payload.content);
    expect(result.current.data).toEqual(CoolerArticle.fromJS(payload));

    // type tests
    // TODO: move these to own unit tests if/when applicable
    () => {
      // @ts-expect-error
      result.current.setResponse(ep, payload);
      result.current.setResponse(
        ep,
        // @ts-expect-error
        {
          id: payload.id,
        },
        payload,
      );
      const create = FutureArticleResource.create;
      const update = FutureArticleResource.update;
      result.current.setResponse(create, payload, payload);
      // @ts-expect-error
      result.current.setResponse(create, {}, payload, payload);
      result.current.setResponse(update, payload.id, payload, payload);
      // @ts-expect-error
      result.current.setResponse(update, payload, payload);
    };
  });

  it('should update store with error', async () => {
    const { result } = renderDataClient(() => {
      return {
        data: useCache(FutureArticleResource.get, payload.id),
        err: useError(FutureArticleResource.get, payload.id),
        setError: useController().setError,
      };
    });
    expect(result.current.data).toBeUndefined();
    const error = new Error('hi');
    const ep = FutureArticleResource.get;
    act(() => {
      result.current.setError(ep, 5, error);
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.err).toBeDefined();
    expect(result.current.err).toBe(error);

    // type tests
    // TODO: move these to own unit tests if/when applicable
    () => {
      // @ts-expect-error
      result.current.setError(ep, error);
      result.current.setError(
        ep,
        // @ts-expect-error
        {
          id: payload.id,
        },
        error,
      );
      const create = FutureArticleResource.create;
      const update = FutureArticleResource.update;
      result.current.setError(create, payload, error);
      // @ts-expect-error
      result.current.setError(create, {}, payload, error);
      result.current.setError(update, payload.id, payload, error);
      // @ts-expect-error
      result.current.setError(update, payload, error);
    };
  });
});
