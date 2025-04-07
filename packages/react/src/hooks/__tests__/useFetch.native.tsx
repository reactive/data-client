import {
  initialState,
  State,
  ActionTypes,
  Controller,
} from '@data-client/core';
import { normalize } from '@data-client/normalizr';
import { CacheProvider } from '@data-client/react';
import { makeRenderDataClient, renderHook } from '@data-client/test';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, render } from '@testing-library/react-native';
import {
  CoolerArticle,
  CoolerArticleResource,
  StaticArticleResource,
} from '__tests__/new';
import { createEntityMeta } from '__tests__/utils';
import nock from 'nock';
import React, { Suspense } from 'react';
// relative imports to avoid circular dependency in tsconfig references
import { InteractionManager, Text, View } from 'react-native';

import { AsyncBoundary } from '../..';
import { StateContext, ControllerContext } from '../../context';
import { users, payload } from '../test-fixtures';
import useFetch from '../useFetch';

async function testDispatchFetch(
  Component: React.FunctionComponent<any>,
  payloads: any[],
) {
  const dispatch = jest.fn();
  const controller = new Controller({ dispatch });

  const tree = (
    <ControllerContext.Provider value={controller}>
      <Suspense fallback={<Text></Text>}>
        <Component />
      </Suspense>
    </ControllerContext.Provider>
  );
  render(tree);
  expect(dispatch).toHaveBeenCalled();
  expect(dispatch.mock.calls.length).toBe(payloads.length);
  let i = 0;
  for (const call of dispatch.mock.calls) {
    delete call[0]?.meta?.fetchedAt;
    delete call[0]?.meta?.promise;
    expect(call[0]).toMatchSnapshot();
    const action = call[0];
    /*const res = await action.payload();
    expect(res).toEqual(payloads[i]);*/
    i++;
  }
}

function testDataClient(
  callback: () => void,
  state: State<unknown>,
  dispatch = (v: ActionTypes) => Promise.resolve(),
) {
  const controller = new Controller({ dispatch });

  return renderHook(callback, {
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <ControllerContext.Provider value={controller}>
          <StateContext.Provider value={state}>
            {children}
          </StateContext.Provider>
        </ControllerContext.Provider>
      );
    },
  });
}

let mynock: nock.Scope;

beforeAll(() => {
  nock(/.*/)
    .persist()
    .defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    })
    .options(/.*/)
    .reply(200);
  mynock = nock(/.*/).defaultReplyHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
});

afterAll(() => {
  nock.cleanAll();
});

describe('useFetch', () => {
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;
  beforeEach(() => {
    mynock.get(`/article-cooler/${payload.id}`).reply(200, payload);
    mynock.get(`/article-static/${payload.id}`).reply(200, payload);
    mynock.get(`/user/`).reply(200, users);
    renderDataClient = makeRenderDataClient(CacheProvider);
  });
  afterEach(() => {
    nock.cleanAll();
  });

  it('should dispatch singles', async () => {
    function FetchTester() {
      useFetch(CoolerArticleResource.get, { id: payload.id });
      return <Text></Text>;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should not dispatch will null params', () => {
    const dispatch = jest.fn();
    let params: any = null;
    const { rerender } = testDataClient(
      () => {
        useFetch(CoolerArticleResource.get, params);
      },
      initialState,
      dispatch,
    );
    expect(dispatch).toBeCalledTimes(0);
    params = payload;
    rerender();
    expect(dispatch).toBeCalled();
  });

  it('should dispatch with resource defined dataExpiryLength', async () => {
    function FetchTester() {
      useFetch(StaticArticleResource.get, { id: payload.id });
      return <Text></Text>;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should dispatch with fetch shape defined dataExpiryLength', async () => {
    function FetchTester() {
      useFetch(StaticArticleResource.longLiving, { id: payload.id });
      return <Text></Text>;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should dispatch with fetch shape defined errorExpiryLength', async () => {
    function FetchTester() {
      useFetch(StaticArticleResource.neverRetryOnError, { id: payload.id });
      return <Text></Text>;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should not refetch after expiry and render', async () => {
    let time = 1000;
    global.Date.now = jest.fn(() => time);
    nock.cleanAll();
    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-cooler/${payload.id}`).reply(200, fetchMock).persist();
    const initialFixtures: any[] = [
      {
        endpoint: CoolerArticleResource.get,
        args: [{ id: payload.id }],
        response: payload,
      },
    ];
    const { result, rerender } = renderDataClient(
      () => {
        return useFetch(CoolerArticleResource.get, { id: payload.id });
      },
      { initialFixtures },
    );
    await result.current;
    expect(fetchMock).toHaveBeenCalledTimes(0);
    time += 100;
    rerender();
    await result.current;
    expect(fetchMock).toHaveBeenCalledTimes(0);

    time += 610000000;
    rerender();
    await result.current;
    rerender();
    await result.current;
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  describe('result is stale and options.invalidIfStale is false', () => {
    const fbmock = jest.fn();
    function FetchTester() {
      useFetch(CoolerArticleResource.get, { id: payload.id });
      return <Text testID="stuff">stuff</Text>;
    }
    const { entities, result } = normalize(CoolerArticle, payload);
    const fetchKey = CoolerArticleResource.get.key({ id: payload.id });
    const state = {
      ...initialState,
      entities,
      entitiesMeta: createEntityMeta(entities),
      results: {
        [fetchKey]: result,
      },
      meta: {
        [fetchKey]: {
          date: 0,
          fetchedAt: 0,
          expiresAt: 0,
        },
      },
    };
    let thenavigation: any;
    function Home() {
      return <Text>Home</Text>;
    }
    function SyncArticleComponentTester({ navigation }: { navigation: any }) {
      thenavigation = navigation;
      return (
        <AsyncBoundary fallback={<Text testID="sus"></Text>}>
          <FetchTester />
        </AsyncBoundary>
      );
    }
    const dispatch = jest.fn(() => Promise.resolve());
    const controller = new Controller({ dispatch });
    const Stack = createNativeStackNavigator();

    const tree = (
      <StateContext.Provider value={state}>
        <ControllerContext.Provider value={controller}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Article">
              <Stack.Screen
                name="Article"
                component={SyncArticleComponentTester}
              />
              <Stack.Screen name="Home" component={Home} />
            </Stack.Navigator>
          </NavigationContainer>
        </ControllerContext.Provider>
      </StateContext.Provider>
    );
    it('should NOT suspend even when result is stale and options.invalidIfStale is false', () => {
      dispatch.mockClear();
      const { getByText, getByTestId } = render(tree);
      expect(fbmock).not.toBeCalled();
      // still should revalidate
      expect(dispatch.mock.calls.length).toBe(1);
    });
    it('should fetch when navigator refocuses and results are stale', async () => {
      await import('@react-navigation/native');
      dispatch.mockClear();

      const { getByText, getByTestId } = render(tree);
      expect(fbmock).not.toBeCalled();
      await new Promise(resolve =>
        InteractionManager.runAfterInteractions(() => {
          resolve(null);
        }),
      );
      // still should revalidate
      expect(dispatch.mock.calls.length).toBe(1);
      act(() => thenavigation.navigate('Home'));
      expect(getByText('Home')).toBeDefined();

      act(() => thenavigation.goBack());
      await new Promise(resolve =>
        InteractionManager.runAfterInteractions(() => {
          resolve(null);
        }),
      );

      // since we got focus back we should have called again
      expect(dispatch.mock.calls.length).toBe(2);
    });
  });
});
