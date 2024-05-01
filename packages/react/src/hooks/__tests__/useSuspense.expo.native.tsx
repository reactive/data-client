import {
  State,
  initialState,
  Controller,
  ActionTypes,
  actionTypes,
} from '@data-client/core';
import { FetchAction } from '@data-client/core';
import { Endpoint, FetchFunction, ReadEndpoint } from '@data-client/endpoint';
import { normalize } from '@data-client/normalizr';
import { makeRenderDataClient, mockInitialState } from '@data-client/test';
import { jest } from '@jest/globals';
import {
  CoolerArticleResource,
  InvalidIfStaleArticleResource,
  GetNoEntities,
  ArticleTimedResource,
  ContextAuthdArticleResource,
  AuthContext,
  PaginatedArticleResource,
  CoolerArticle,
  PaginatedArticle,
  FutureArticleResource,
  ArticleTimed,
} from '__tests__/new';
import { createEntityMeta } from '__tests__/utils';
import { Slot } from 'expo-router';
import { ReactComponent } from 'expo-router/build/testing-library/context-stubs';
import { renderRouter, screen, act } from 'expo-router/testing-library';
import { SpyInstance } from 'jest-mock';
import nock from 'nock';
import React, { Suspense } from 'react';
import { Text, View } from 'react-native';
import { InteractionManager } from 'react-native';

// relative imports to avoid circular dependency in tsconfig references
import {
  CacheProvider,
  useController,
  ControllerContext,
  StateContext,
  AsyncBoundary,
} from '../..';
import { articlesPages, payload, users, nested } from '../test-fixtures';
import useSuspense from '../useSuspense';

function ArticleComponentTester() {
  const invalidIfStale = false,
    schema = true;
  let endpoint =
    invalidIfStale ?
      InvalidIfStaleArticleResource.get
    : CoolerArticleResource.get;
  if (!schema) {
    endpoint = (endpoint as any).extend({ schema: undefined }) as any;
  }
  const article = useSuspense(endpoint, {
    id: payload.id,
  });
  return (
    <View testID="article">
      <Text>{article.title}</Text>
      <Text>{article.content}</Text>
    </View>
  );
}

describe('useSuspense()', () => {
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;
  const fbmock = jest.fn();

  async function testMalformedResponse(
    payload: any,
    endpoint: ReadEndpoint<FetchFunction, any> = CoolerArticleResource.get,
  ) {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/400`)
      .reply(200, payload);

    const { result, waitForNextUpdate } = renderDataClient(() => {
      return useSuspense(endpoint, {
        id: 400,
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBeGreaterThan(399);
    expect(result.error).toMatchSnapshot();
  }

  function Fallback() {
    fbmock();
    return null;
  }

  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload)
      .get(`/article-time/${payload.id}`)
      .reply(200, { ...payload, createdAt: '2020-06-07T02:00:15+0000' })
      .delete(`/article-cooler/${payload.id}`)
      .reply(204, '')
      .delete(`/article/${payload.id}`)
      .reply(200, {})
      .get(`/article-cooler/0`)
      .reply(403, {})
      .get(`/article-cooler/666`)
      .reply(200, '')
      .get(`/article-cooler`)
      .reply(200, nested)
      .get(`/user`)
      .reply(200, users);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    renderDataClient = makeRenderDataClient(CacheProvider);
    fbmock.mockReset();
  });

  afterEach(() => {
    try {
      screen.unmount();
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  describe('result is stale and options.invalidIfStale is false', () => {
    const { entities, result } = normalize(payload, CoolerArticle);
    const fetchKey = CoolerArticleResource.get.key({ id: payload.id });
    const state = {
      ...initialState,
      entities,
      entityMeta: createEntityMeta(entities),
      results: {
        [fetchKey]: result,
      },
      meta: {
        [fetchKey]: {
          date: 0,
          expiresAt: 0,
        },
      },
    };
    let thenavigation: any;
    function Home() {
      return <Text>Home</Text>;
    }

    const dispatch = jest.fn(() => Promise.resolve());
    const controller = new Controller({ dispatch });
    // const Stack = createNativeStackNavigator();

    function Layout() {
      return (
        <StateContext.Provider value={state}>
          <ControllerContext.Provider value={controller}>
            <AsyncBoundary fallback={<Fallback />}>
              <Slot />
            </AsyncBoundary>
          </ControllerContext.Provider>
        </StateContext.Provider>
      );
    }
    it('should fetch expo route changes and results are stale', async () => {
      dispatch.mockClear();

      const { getByText, getByTestId } = renderRouter(
        {
          _layout: Layout,
          index: Home,
          article: ArticleComponentTester,
        },
        {
          initialUrl: '/article',
        },
      );

      // expect(fbmock).not.toBeCalled();
      // await new Promise(resolve =>
      //   InteractionManager.runAfterInteractions(() => {
      //     resolve(null);
      //   }),
      // );
      // // still should revalidate
      // expect(dispatch.mock.calls.length).toBe(1);
      // act(() => thenavigation.navigate('Home'));
      // expect(getByText('Home')).toBeDefined();

      // act(() => thenavigation.goBack());
      // await new Promise(resolve =>
      //   InteractionManager.runAfterInteractions(() => {
      //     resolve(null);
      //   }),
      // );
      // expect(getByTestId('article')).toBeDefined();
      // // since we got focus back we should have called again
      // expect(dispatch.mock.calls.length).toBe(2);
    });
  });
});
