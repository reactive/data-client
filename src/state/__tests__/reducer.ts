import {
  ArticleResource,
  PaginatedArticleResource,
} from '../../__tests__/common';
import reducer from '../reducer';
import {
  FetchAction,
  RPCAction,
  ReceiveAction,
  PurgeAction,
  ResetAction,
  InvalidateAction,
} from '../../types';

describe('reducer', () => {
  describe('singles', () => {
    const id = 20;
    const payload = { id, title: 'hi', content: 'this is the content' };
    const action: ReceiveAction<typeof payload> = {
      type: 'rest-hooks/receive',
      payload,
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id }),
        date: 5000000000,
        expiresAt: 5000500000,
      },
    };
    const partialResultAction = {
      ...action,
      payload: { id, title: 'hello' },
    };
    const iniState = {
      entities: {},
      results: {},
      meta: {},
    };
    const newState = reducer(iniState, action);
    it('should update state correctly', () => {
      expect(newState).toMatchSnapshot();
    });
    it('should overwrite existing entity', () => {
      const getEntity = (state: any): ArticleResource =>
        state.entities[ArticleResource.getKey()][
          `${ArticleResource.pk(action.payload)}`
        ];
      const prevEntity = getEntity(newState);
      expect(prevEntity).toBeDefined();
      const nextState = reducer(newState, action);
      const nextEntity = getEntity(nextState);
      expect(nextEntity).not.toBe(prevEntity);
      expect(nextEntity).toBeDefined();
    });
    it('should merge partial entity with existing entity', () => {
      const getEntity = (state: any): ArticleResource =>
        state.entities[ArticleResource.getKey()][
          `${ArticleResource.pk(action.payload)}`
        ];
      const prevEntity = getEntity(newState);
      expect(prevEntity).toBeDefined();
      const nextState = reducer(newState, partialResultAction);
      const nextEntity = getEntity(nextState);
      expect(nextEntity).not.toBe(prevEntity);
      expect(nextEntity).toBeDefined();

      expect(nextEntity.title).not.toBe(prevEntity.title);
      expect(nextEntity.title).toBe(partialResultAction.payload.title);

      expect(nextEntity.content).toBe(prevEntity.content);
      expect(nextEntity.content).not.toBe(undefined);
    });
  });
  it('mutate should never change results', () => {
    const id = 20;
    const payload = { id, title: 'hi', content: 'this is the content' };
    const action: RPCAction = {
      type: 'rest-hooks/rpc',
      payload,
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.listUrl(payload),
      },
    };
    const iniState = {
      entities: {},
      results: { abc: '5' },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState.results).toBe(iniState.results);
  });
  it('purge should delete entities', () => {
    const id = 20;
    const action: PurgeAction = {
      type: 'rest-hooks/purge',
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: id.toString(),
      },
    };
    const iniState: any = {
      entities: {
        [ArticleResource.getKey()]: {
          '10': ArticleResource.fromJS({ id: 10 }),
          '20': ArticleResource.fromJS({ id: 20 }),
          '25': ArticleResource.fromJS({ id: 25 }),
        },
        [PaginatedArticleResource.getKey()]: {
          hi: PaginatedArticleResource.fromJS({ id: 5 }),
        },
        '5': undefined,
      },
      results: { abc: '20' },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState.results).toBe(iniState.results);
    expect(newState.meta).toBe(iniState.meta);
    const expectedEntities = { ...iniState.entities[ArticleResource.getKey()] };
    delete expectedEntities['20'];
    expect(newState.entities[ArticleResource.getKey()]).toEqual(
      expectedEntities,
    );
  });
  // describe('rest-hooks/optimistic-update', () => {
  //   it('it should run inserts', () => {
  //     const id = 20;
  //     function makeOptimisticAction(
  //       url: string,
  //       items: string[],
  //     ): OptimisticUpdateAction {
  //       return {
  //         type: 'rest-hooks/optimistic-update',
  //         payload: {
  //           [url]: ((result: string[] | undefined) => [
  //             ...items,
  //             ...(result || []),
  //           ]) as any,
  //         },
  //       };
  //     }
  //     const iniState: any = {
  //       entities: {
  //         [ArticleResource.getKey()]: {
  //           '10': ArticleResource.fromJS({ id: 10 }),
  //           '20': ArticleResource.fromJS({ id: 20 }),
  //           '25': ArticleResource.fromJS({ id: 25 }),
  //         },
  //       },
  //       results: {},
  //       meta: {},
  //     };
  //     const newState = reducer(
  //       iniState,
  //       makeOptimisticAction(ArticleResource.listUrl(), ['10']),
  //     );
  //     expect(newState.results[ArticleResource.listUrl()]).toStrictEqual(['10']);
  //     const newState2 = reducer(
  //       newState,
  //       makeOptimisticAction(ArticleResource.listUrl(), ['20', '25']),
  //     );
  //     expect(newState2.results[ArticleResource.listUrl()]).toStrictEqual([
  //       '20',
  //       '25',
  //       '10',
  //     ]);
  //   });
  // });
  it('invalidates resources correctly', () => {
    const id = 20;
    const action: InvalidateAction = {
      type: 'rest-hooks/invalidate',
      meta: {
        url: id.toString(),
      },
    };
    const iniState: any = {
      entities: {
        [ArticleResource.getKey()]: {
          '10': ArticleResource.fromJS({ id: 10 }),
          '20': ArticleResource.fromJS({ id: 20 }),
          '25': ArticleResource.fromJS({ id: 25 }),
        },
        [PaginatedArticleResource.getKey()]: {
          hi: PaginatedArticleResource.fromJS({ id: 5 }),
        },
        '5': undefined,
      },
      results: { abc: '20' },
      meta: {
        '20': {
          expiresAt: 500,
        },
        '25': {
          expiresAt: 1000,
        },
      },
    };
    const newState = reducer(iniState, action);
    expect(newState.results).toBe(iniState.results);
    expect(newState.entities).toBe(iniState.entities);
    const expectedMeta = { ...iniState.meta };
    expectedMeta['20'] = { expiresAt: 0 };
    expect(newState.meta).toEqual(expectedMeta);
  });
  it('should set error in meta for "receive"', () => {
    const id = 20;
    const error = new Error('hi');
    const action: ReceiveAction = {
      type: 'rest-hooks/receive',
      payload: error,
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id }),
        date: 5000000000,
        expiresAt: 5000500000,
      },
      error: true,
    };
    const iniState = {
      entities: {},
      results: {},
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toMatchSnapshot();
  });
  it('should not modify state on error for "rpc"', () => {
    const id = 20;
    const error = new Error('hi');
    const action: RPCAction = {
      type: 'rest-hooks/rpc',
      payload: error,
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id }),
      },
      error: true,
    };
    const iniState = {
      entities: {},
      results: {},
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toEqual(iniState);
  });
  it('should not delete on error for "purge"', () => {
    const id = 20;
    const error = new Error('hi');
    const action: PurgeAction = {
      type: 'rest-hooks/purge',
      payload: error,
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id }),
      },
      error: true,
    };
    const iniState = {
      entities: {
        [ArticleResource.getKey()]: {
          [id]: ArticleResource.fromJS({}),
        },
      },
      results: {
        [ArticleResource.url({ id })]: id,
      },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toEqual(iniState);
  });
  it('rest-hooks/fetch should console.warn()', () => {
    global.console.warn = jest.fn();
    const action: FetchAction = {
      type: 'rest-hooks/fetch',
      payload: () => new Promise<any>(() => null),
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id: 5 }),
        responseType: 'rest-hooks/rpc',
        throttle: true,
        reject: (v: any) => null,
        resolve: (v: any) => null,
      },
    };
    const iniState = {
      entities: {},
      results: { abc: '5' },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toBe(iniState);
    expect((global.console.warn as jest.Mock).mock.calls.length).toBe(2);
  });
  it('other types should do nothing', () => {
    const action: any = {
      type: 'whatever',
    };
    const iniState = {
      entities: {},
      results: { abc: '5' },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toBe(iniState);
  });
  it('reset should delete all entries', () => {
    const action: ResetAction = {
      type: 'rest-hooks/reset',
    };
    const iniState: any = {
      entities: {
        [ArticleResource.getKey()]: {
          '10': ArticleResource.fromJS({ id: 10 }),
          '20': ArticleResource.fromJS({ id: 20 }),
          '25': ArticleResource.fromJS({ id: 25 }),
        },
        [PaginatedArticleResource.getKey()]: {
          hi: PaginatedArticleResource.fromJS({ id: 5 }),
        },
        '5': undefined,
      },
      results: { abc: '20' },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState.results).toEqual({});
    expect(newState.meta).toEqual({});
    expect(newState.entities).toEqual({});
  });
});
