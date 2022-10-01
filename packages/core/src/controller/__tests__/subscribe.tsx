import nock from 'nock';
import { FutureArticleResource } from '__tests__/new';
import { FixtureEndpoint } from '@rest-hooks/test/mockState';
import { act } from '@testing-library/react-hooks';
import { useCache } from '@rest-hooks/core';

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

describe('subscribe', () => {
  it('should not error on subscribe', async () => {
    const { result } = renderRestHook(() => {
      return {
        data: useCache(FutureArticleResource.get, payload.id),
        subscribe: useController().subscribe,
        unsubscribe: useController().unsubscribe,
      };
    });
    expect(result.current.data).toBeUndefined();
    const ep = FutureArticleResource.get;
    await act(async () => {
      await result.current.subscribe(ep.extend({ pollFrequency: 1000 }), 5);
    });
    await act(async () => {
      await result.current.unsubscribe(ep.extend({ pollFrequency: 1000 }), 5);
    });

    // type tests
    // TODO: move these to own unit tests if/when applicable
    () => {
      // @ts-expect-error
      result.current.subscribe(FutureArticleResource.detail());
      // @ts-expect-error
      result.current.subscribe(FutureArticleResource.detail(), {
        id: payload.id,
      });
      // @ts-expect-error
      result.current.subscribe(FutureArticleResource.create(), payload);
      // @ts-expect-error
      result.current.subscribe(FutureArticleResource.update(), payload);
    };
    // TODO: move these to own unit tests if/when applicable
    () => {
      // @ts-expect-error
      result.current.unsubscribe(FutureArticleResource.detail());
      // @ts-expect-error
      result.current.unsubscribe(FutureArticleResource.detail(), {
        id: payload.id,
      });
      // @ts-expect-error
      result.current.unsubscribe(FutureArticleResource.create(), payload);
      // @ts-expect-error
      result.current.unsubscribe(FutureArticleResource.update(), payload);
    };
  });
});
