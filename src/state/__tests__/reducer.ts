import {
  ArticleResource,
  PaginatedArticleResource,
} from '../../__tests__/common';
import reducer, { resourceCustomizer } from '../reducer';
import {
  FetchAction,
  RPCAction,
  ReceiveAction,
  PurgeAction,
} from '../../types';
import { mergeWith } from 'lodash';

describe('resourceCustomizer', () => {
  it('should merge two Resource instances', () => {
    const id = 20;
    const a = ArticleResource.fromJS({
      id,
      title: 'hi',
      content: 'this is the content',
    });
    const b = ArticleResource.fromJS({ id, title: 'hello' });

    const merged = resourceCustomizer(a, b);
    expect(merged).toBeInstanceOf(ArticleResource);
    expect(merged).toEqual(
      ArticleResource.fromJS({
        id,
        title: 'hello',
        content: 'this is the content',
      }),
    );
  });
  it('should handle merging of Resource instances when used with lodash.mergeWith()', () => {
    const id = 20;
    const entitiesA = {
      [ArticleResource.getKey()]: {
        [id]: ArticleResource.fromJS({
          id,
          title: 'hi',
          content: 'this is the content',
        }),
      },
    };
    const entitiesB = {
      [ArticleResource.getKey()]: {
        [id]: ArticleResource.fromJS({ id, title: 'hello' }),
      },
    };

    const merged = mergeWith({ ...entitiesA }, entitiesB, resourceCustomizer);
    expect(merged[ArticleResource.getKey()][id]).toBeInstanceOf(
      ArticleResource,
    );
    expect(merged[ArticleResource.getKey()][id]).toEqual(
      ArticleResource.fromJS({
        id,
        title: 'hello',
        content: 'this is the content',
      }),
    );
  });
  it('should not affect merging of plain objects when used with lodash.mergeWith()', () => {
    const id = 20;
    const entitiesA = {
      [ArticleResource.getKey()]: {
        [id]: ArticleResource.fromJS({
          id,
          title: 'hi',
          content: 'this is the content',
        }),
        [42]: ArticleResource.fromJS({
          id: 42,
          title: 'dont touch me',
          content: 'this is mine',
        }),
      },
    };
    const entitiesB = {
      [ArticleResource.getKey()]: {
        [id]: ArticleResource.fromJS({
          id,
          title: 'hi',
          content: 'this is the content',
        }),
      },
    };

    const merged = mergeWith({ ...entitiesA }, entitiesB, resourceCustomizer);
    expect(merged[ArticleResource.getKey()][42]).toBe(
      entitiesA[ArticleResource.getKey()][42],
    );
  });
});

describe('reducer', () => {
  describe('singles', () => {
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
    const partialResultAction: ReceiveAction = {
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
      expect(nextEntity.content).not.toBe(partialResultAction.payload.content);
    });
  });
  it('mutate should never change results', () => {
    const id = 20;
    const payload = { id, title: 'hi', content: 'this is the content' };
    const action: RPCAction = {
      type: 'rpc',
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
      type: 'purge',
      payload: {},
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
  it('should set error in meta for "receive"', () => {
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
  it('should not modify state on error for "rpc"', () => {
    const id = 20;
    const error = new Error('hi');
    const action: RPCAction = {
      type: 'rpc',
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
      type: 'purge',
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
