// eslint-env jest
import {
  NetworkManager,
  actionTypes,
  SubscriptionManager,
  Controller,
  SetAction,
} from '@data-client/core';
import { act, render, screen } from '@testing-library/react-native';
import { CoolerArticle, CoolerArticleResource } from '__tests__/new';
import nock from 'nock';
import React, { useContext, Suspense } from 'react';
import { Text } from 'react-native';

import { ControllerContext, StateContext } from '../../context';
import { useController, useSuspense } from '../../hooks';
import { payload } from '../../test-fixtures';
import CacheProvider from '../CacheProvider';

const { SET_TYPE } = actionTypes;

describe('<CacheProvider />', () => {
  let warnspy: jest.SpyInstance;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn');
  });
  afterEach(() => {
    warnspy.mockRestore();
    try {
      screen.unmount();
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

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
      .reply(200, payload);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('should warn users about missing Suspense', () => {
    const Component = () => {
      const article = useSuspense(CoolerArticleResource.get, { id: 7 });
      return <Text testID="article">{article.title}</Text>;
    };
    const tree = (
      <CacheProvider>
        <Component />
      </CacheProvider>
    );
    const { getByText, unmount } = render(tree);
    const msg = getByText('Uncaught Suspense.');
    expect(msg).toBeDefined();
    expect(warnspy).toHaveBeenCalled();
    expect(warnspy.mock.calls).toMatchSnapshot();
  });

  it('should not warn if Suspense is provided', async () => {
    const Component = () => {
      const article = useSuspense(CoolerArticleResource.get, { id: 5 });
      return <Text testID="article">{article.title}</Text>;
    };
    const tree = (
      <CacheProvider>
        <Suspense fallback={<Text>loading</Text>}>
          <Component />
        </Suspense>
      </CacheProvider>
    );
    const { getByText, unmount } = render(tree);
    const msg = getByText('loading');
    expect(msg).toBeDefined();
    expect(warnspy).not.toHaveBeenCalled();
    const articleOutput = await screen.findByTestId('article');
    expect(articleOutput).toBeDefined();
    //expect(articleOutput.toJSON()).toMatchInlineSnapshot();
  });

  it('should not change dispatch function on re-render', () => {
    let dispatch;
    let count = 0;
    function DispatchTester() {
      dispatch = useController().dispatch;
      count++;
      return null;
    }
    const chil = <DispatchTester />;
    const tree = <CacheProvider>{chil}</CacheProvider>;
    const { rerender } = render(tree);
    expect(dispatch).toBeDefined();
    let curDisp = dispatch;
    rerender(tree);
    expect(curDisp).toBe(dispatch);
    expect(count).toBe(1);
    rerender(<CacheProvider>{chil}</CacheProvider>);
    expect(curDisp).toBe(dispatch);
    expect(count).toBe(1);
    const managers: any[] = [new NetworkManager()];
    rerender(<CacheProvider managers={managers}>{chil}</CacheProvider>);
    expect(count).toBe(1);
    curDisp = dispatch;
    rerender(<CacheProvider managers={managers}>{chil}</CacheProvider>);
    expect(curDisp).toBe(dispatch);
    expect(count).toBe(1);
    rerender(
      <ControllerContext.Provider
        value={new Controller({ dispatch: () => Promise.resolve() })}
      >
        {chil}
      </ControllerContext.Provider>,
    );
    expect(curDisp).not.toBe(dispatch);
    expect(count).toBe(2);
  });
  it('should change state', () => {
    let dispatch: any, state;
    let count = 0;
    function ContextTester() {
      dispatch = useController().dispatch;
      state = useContext(StateContext);
      count++;
      return null;
    }
    const chil = <ContextTester />;
    const tree = <CacheProvider>{chil}</CacheProvider>;
    render(tree);
    expect(dispatch).toBeDefined();
    expect(state).toBeDefined();
    const action: SetAction = {
      type: SET_TYPE,
      payload: { id: 5, title: 'hi', content: 'more things here' },
      endpoint: CoolerArticleResource.get,
      meta: {
        args: [{ id: 5 }],
        key: CoolerArticleResource.get.key({ id: 5 }),
        fetchedAt: 50,
        date: 50,
        expiresAt: 55,
      },
    };
    act(() => {
      dispatch(action);
    });
    expect(count).toBe(2);
    expect(state).toMatchSnapshot();
  });

  it('should have SubscriptionManager in default managers', () => {
    const subManagers = CacheProvider.defaultProps.managers.filter(
      manager => manager instanceof SubscriptionManager,
    );
    expect(subManagers.length).toBe(1);
  });
});
