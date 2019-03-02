import { ArticleResource, PaginatedArticleResource } from '../../__tests__/common';
import reducer from '../reducer';
import { FetchAction, RPCAction, ReceiveAction, PurgeAction, State } from '../../types';

describe('reducer', () => {
  it('handle get single', () => {
    const id = 20;
    const action: ReceiveAction = {
      type: 'receive',
      payload: { id, title: 'hi', content: 'this is the content' },
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id }),
        date: 5000000000,
        expiresAt: 5000500000,
      },
    };
    const iniState = {
      entities: {},
      results: {},
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toMatchSnapshot();
  });
  it('mutate should never change results', () => {
    const id = 20;
    const action: RPCAction = {
      type: 'rpc',
      payload: { id, title: 'hi', content: 'this is the content' },
      meta: {
        schema: ArticleResource.getEntitySchema(),
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
      type: 'purge',
      payload: { },
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
          'hi': PaginatedArticleResource.fromJS({id: 5}),
        },
        '5': undefined,
      },
      results: { abc: '20' },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState.results).toBe(iniState.results);
    expect(newState.meta).toBe(iniState.meta);
    const expectedEntities = {...iniState.entities[ArticleResource.getKey()]};
    delete expectedEntities['20'];
    expect(newState.entities[ArticleResource.getKey()]).toEqual(expectedEntities);

  });
  it('should set error in meta', () => {
    const id = 20;
    const error = new Error('hi');
    const action: ReceiveAction = {
      type: 'receive',
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
  it('other types should do nothing', () => {
    const action: FetchAction = {
      type: 'fetch',
      payload: () => new Promise<any>(() => null),
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id: 5 }),
        responseType: 'rpc',
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
  });
});
