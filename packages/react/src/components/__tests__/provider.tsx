// eslint-env jest
import {
  NetworkManager,
  actionTypes,
  Manager,
  Middleware,
  Controller,
  SetResponseAction,
} from '@data-client/core';
import { act, render } from '@testing-library/react';
import { CoolerArticleResource } from '__tests__/new';
import nock from 'nock';
import React, { useContext, Suspense, StrictMode } from 'react';

import { ControllerContext, StateContext } from '../../context';
import { useController, useSuspense } from '../../hooks';
import { payload } from '../../test-fixtures';
import DataProvider from '../DataProvider';
import { getDefaultManagers } from '../getDefaultManagers';

const { SET_RESPONSE_TYPE } = actionTypes;

describe('<DataProvider />', () => {
  let warnspy: jest.SpyInstance;
  let debugspy: jest.SpyInstance;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    debugspy = jest.spyOn(global.console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    warnspy.mockRestore();
    debugspy.mockRestore();
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
      const article = useSuspense(CoolerArticleResource.get, { id: 5 });
      return <div>{article.title}</div>;
    };
    const tree = (
      <DataProvider>
        <Component />
      </DataProvider>
    );
    const { getByText } = render(tree);
    const msg = getByText('Uncaught Suspense.');
    expect(msg).toBeDefined();
    expect(warnspy).toHaveBeenCalled();
    expect(warnspy.mock.calls).toMatchSnapshot();
  });

  it('should not warn if Suspense is provided', () => {
    const Component = () => {
      const article = useSuspense(CoolerArticleResource.get, { id: 5 });
      return <div>{article.title}</div>;
    };
    const tree = (
      <StrictMode>
        <DataProvider>
          <Suspense fallback="loading">
            <Component />
          </Suspense>
        </DataProvider>
      </StrictMode>
    );
    const { getByText } = render(tree);
    const msg = getByText('loading');
    expect(msg).toBeDefined();
    expect(warnspy).not.toHaveBeenCalled();
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
    const tree = <DataProvider>{chil}</DataProvider>;
    const { rerender } = render(tree);
    expect(dispatch).toBeDefined();
    let curDisp = dispatch;
    rerender(tree);
    expect(curDisp).toBe(dispatch);
    expect(count).toBe(1);
    rerender(<DataProvider>{chil}</DataProvider>);
    expect(curDisp).toBe(dispatch);
    expect(count).toBe(1);
    const managers: any[] = [new NetworkManager()];
    rerender(<DataProvider managers={managers}>{chil}</DataProvider>);
    expect(count).toBe(1);
    curDisp = dispatch;
    rerender(<DataProvider managers={managers}>{chil}</DataProvider>);
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
    const tree = <DataProvider>{chil}</DataProvider>;
    render(tree);
    expect(dispatch).toBeDefined();
    expect(state).toBeDefined();
    const action: SetResponseAction = {
      type: SET_RESPONSE_TYPE,
      response: { id: 5, title: 'hi', content: 'more things here' },
      endpoint: CoolerArticleResource.get,
      args: [{ id: 5 }],
      key: CoolerArticleResource.get.key({ id: 5 }),
      meta: {
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

  it('should ignore dispatches after unmount', async () => {
    class InjectorManager implements Manager {
      declare controller: Controller;

      cleanup() {}

      middleware: Middleware = controller => {
        this.controller = controller;
        return next => async action => {
          await next(action);
        };
      };
    }
    const injector = new InjectorManager();
    const managers = [injector, ...getDefaultManagers()];
    let resolve: (r: any) => void = () => {};
    const endpoint = CoolerArticleResource.get.extend({
      fetch() {
        return new Promise(res => {
          resolve = res;
        });
      },
    });
    const Component = () => {
      const article = useSuspense(endpoint, { id: 5 });
      return <div>{article.title}</div>;
    };
    const tree = (
      <DataProvider managers={managers}>
        <Suspense fallback="loading">
          <Component />
        </Suspense>
      </DataProvider>
    );
    const { getByText, unmount } = render(tree);
    const msg = getByText('loading');
    expect(msg).toBeDefined();
    unmount();
    expect(debugspy).not.toHaveBeenCalled();
    await injector.controller.setResponse(
      endpoint,
      { id: 5 },
      { id: 5, title: 'hi' },
    );
    expect(debugspy).toHaveBeenCalled();
    expect(debugspy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "Action dispatched after unmount. This will be ignored.",
      ]
    `);
  });
});
