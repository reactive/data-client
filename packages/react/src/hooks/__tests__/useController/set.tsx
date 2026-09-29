import { DataProvider } from '@data-client/react';
import { schema } from '@data-client/rest';
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
      controller.set(CoolerArticle, { id: 5 }, article => ({
        id: 5,
        title: `${article.title}!`,
      }));
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

  it('should batch set entities with an array schema', async () => {
    const { controller } = renderDataClient(() => null);
    let promise: any;
    act(() => {
      controller.set(CoolerArticle, { id: 5 }, { ...payload, content: 'kept' });
      controller.set(CoolerArticle, { id: 1 }, createPayload);
      promise = controller.set(
        [CoolerArticle],
        [
          { id: 5, title: 'merged' },
          { id: 6, title: 'new' },
        ],
      );
    });
    await act(() => promise);
    const state = controller.getState();
    expect(controller.get(CoolerArticle, { id: 5 }, state)).toMatchObject({
      title: 'merged',
      content: 'kept',
    });
    expect(controller.get(CoolerArticle, { id: 6 }, state)?.title).toBe('new');
    expect(controller.get(CoolerArticle, { id: 1 }, state)?.title).toBe(
      createPayload.title,
    );

    act(() => {
      promise = controller.set(new schema.Array(CoolerArticle), [
        { id: 6, title: 'array class' },
      ]);
    });
    await act(() => promise);
    expect(
      controller.get(CoolerArticle, { id: 6 }, controller.getState())?.title,
    ).toBe('array class');

    // type tests
    () => {
      // @ts-expect-error array schemas have no args
      controller.set([CoolerArticle], { id: 5 }, [payload]);
      // @ts-expect-error array schemas have no previous value to update
      controller.set([CoolerArticle], (articles: any) => articles);
      // @ts-expect-error value must be an array
      controller.set([CoolerArticle], payload);
      // @ts-expect-error entities need args, even with an array value
      controller.set(CoolerArticle, [payload]);
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
