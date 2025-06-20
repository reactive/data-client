// eslint-env jest
import {
  NetworkManager,
  actionTypes,
  Controller,
  SetResponseAction,
} from '@data-client/core';
import { MockResolver } from '@data-client/test';
import { act, render, screen } from '@testing-library/react-native';
import { CoolerArticleResource } from '__tests__/new';
import React, { useContext, Suspense } from 'react';
import { Text } from 'react-native';

import { ControllerContext, StateContext } from '../../context';
import { useController, useSuspense } from '../../hooks';
import { payload } from '../../test-fixtures';
import DataProvider from '../DataProvider';

const { SET_RESPONSE } = actionTypes;

describe('<DataProvider />', () => {
  let warnspy: jest.Spied<any>;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnspy.mockRestore();
    try {
      screen.unmount();
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  it('should warn users about missing Suspense', () => {
    const Component = () => {
      const article = useSuspense(CoolerArticleResource.get, { id: 7 });
      return <Text testID="article">{article.title}</Text>;
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

  it('should not warn if Suspense is provided', async () => {
    const Component = () => {
      const article = useSuspense(CoolerArticleResource.get, { id: 5 });
      return <Text testID="article">{article.title}</Text>;
    };
    const tree = (
      <DataProvider>
        <MockResolver
          fixtures={[
            {
              endpoint: CoolerArticleResource.get,
              args: [{ id: 5 }],
              response: payload,
            },
          ]}
        >
          <Suspense fallback={<Text>loading</Text>}>
            <Component />
          </Suspense>
        </MockResolver>
      </DataProvider>
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
    let controller;
    let count = 0;
    function DispatchTester() {
      controller = useController();
      dispatch = useController().dispatch;
      count++;
      return null;
    }
    const chil = <DispatchTester />;
    const tree = <DataProvider>{chil}</DataProvider>;
    const { rerender } = render(tree);
    expect(dispatch).toBeDefined();
    let curDisp = dispatch;
    let curController = controller;
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
    curController = controller;
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
    expect(curController).not.toBe(controller);
    expect(count).toBe(2);
  });

  it('should change state', () => {
    let controller: any, state;
    let count = 0;
    function ContextTester() {
      controller = useController();
      state = useContext(StateContext);
      count++;
      return null;
    }
    const chil = <ContextTester />;
    const tree = <DataProvider>{chil}</DataProvider>;
    render(tree);
    expect(controller.dispatch).toBeDefined();
    expect(state).toBeDefined();
    const action: SetResponseAction = {
      type: SET_RESPONSE,
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
      controller.dispatch(action);
    });
    expect(count).toBe(2);
    expect(state).toMatchSnapshot();
  });
});
