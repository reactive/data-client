import { DataProvider } from '@data-client/react';
import { CoolerArticle } from '__tests__/new';
import nock from 'nock';

import { useQuery } from '../..';
import { makeRenderDataClient, act } from '../../../../../test';

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
let renderDataClient: ReturnType<typeof makeRenderDataClient>;
let mynock: nock.Scope;

beforeEach(() => {
  renderDataClient = makeRenderDataClient(DataProvider);
  mynock = nock(/.*/).defaultReplyHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
});
afterEach(() => {
  nock.cleanAll();
});

describe('set', () => {
  let errorspy: jest.MockInstance<typeof global.console.error, any>;
  beforeEach(() => {
    errorspy = jest
      .spyOn(global.console, 'error')
      .mockImplementation(() => {}) as any;
  });
  afterEach(() => {
    errorspy.mockRestore();
  });

  it('should update store when set is complete', async () => {
    const { result, controller } = renderDataClient(() => {
      return useQuery(CoolerArticle, { id: payload.id });
    });
    expect(result.current).toBeUndefined();
    let promise: any;
    act(() => {
      promise = controller.set(CoolerArticle, { id: 5 }, payload);
    });
    await act(() => promise);
    expect(result.current).toBeDefined();
    expect(result.current?.content).toEqual(payload.content);
    expect(result.current).toEqual(CoolerArticle.fromJS(payload));

    // type tests
    // TODO: move these to own unit tests if/when applicable
    () => {
      // @ts-expect-error
      controller.set(CoolerArticle, payload);
      controller.set(
        CoolerArticle,
        // @ts-expect-error
        payload.id,
        payload,
      );
    };
  });

  it('should update store with error', async () => {
    const { result, controller } = renderDataClient(() => {
      return useQuery(CoolerArticle, { id: payload.id });
    });
    expect(result.current).toBeUndefined();
    let promise: any;
    act(() => {
      promise = controller.set(CoolerArticle, { id: 5 }, 5);
    });
    expect(result.current).toBeUndefined();
    expect(errorspy.mock.calls.length).toBe(1);
    expect(errorspy.mock.calls).toMatchSnapshot();
  });
});
