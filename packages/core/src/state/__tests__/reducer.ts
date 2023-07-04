import { INVALID } from '@data-client/endpoint';
import {
  ArticleResource,
  PaginatedArticleResource,
  Article,
  PaginatedArticle,
} from '__tests__/new';

import { Controller } from '../..';
import {
  SET_TYPE,
  INVALIDATE_TYPE,
  FETCH_TYPE,
  RESET_TYPE,
  GC_TYPE,
} from '../../actionTypes';
import createSet from '../../controller/createSet';
import {
  UpdateFunction,
  State,
  ActionTypes,
  FetchAction,
  SetAction,
  ResetAction,
  InvalidateAction,
  GCAction,
} from '../../types';
import createReducer, { initialState } from '../reducer/createReducer';

describe('reducer', () => {
  let reducer: (
    state: State<unknown> | undefined,
    action: ActionTypes,
  ) => State<unknown>;

  beforeEach(() => {
    reducer = createReducer(new Controller());
  });

  describe('singles', () => {
    const id = 20;
    const payload = { id, title: 'hi', content: 'this is the content' };
    const action: SetAction = {
      type: SET_TYPE,
      payload,
      endpoint: ArticleResource.get,
      meta: {
        args: [{ id }],
        key: ArticleResource.get.url({ id }),
        date: 5000000000,
        expiresAt: 5000500000,
        fetchedAt: 5000000000,
      },
    };
    const partialResultAction = {
      ...action,
      payload: { id, title: 'hello' },
    };
    const iniState = initialState;
    let newState = initialState;
    it('should update state correctly', () => {
      newState = reducer(iniState, action);
      expect(newState).toMatchSnapshot();
    });
    it('should overwrite existing entity', () => {
      const getEntity = (state: any): Article =>
        state.entities[Article.key][`${Article.pk(action.payload)}`];
      const prevEntity = getEntity(newState);
      expect(prevEntity).toBeDefined();
      const nextState = reducer(newState, action);
      const nextEntity = getEntity(nextState);
      expect(nextEntity).not.toBe(prevEntity);
      expect(nextEntity).toBeDefined();
    });
    it('should merge partial entity with existing entity', () => {
      const getEntity = (state: any): Article =>
        state.entities[Article.key][`${Article.pk(action.payload)}`];
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

      expect(
        nextState.entityMeta[Article.key][`${Article.pk(action.payload)}`],
      ).toBeDefined();
      expect(
        nextState.entityMeta[Article.key][`${Article.pk(action.payload)}`].date,
      ).toBe(action.meta.date);
    });

    it('should have the latest entity date', () => {
      const localAction = {
        ...partialResultAction,
        meta: {
          ...partialResultAction.meta,
          expiresAt: partialResultAction.meta.expiresAt * 2,
          date: partialResultAction.meta.date * 2,
        },
      };
      const getMeta = (state: any): { expiresAt: number } =>
        state.entityMeta[Article.key][`${Article.pk(action.payload)}`];
      const prevMeta = getMeta(newState);
      expect(prevMeta).toBeDefined();
      const nextState = reducer(newState, localAction);
      const nextMeta = getMeta(nextState);

      expect(nextMeta).toBeDefined();
      expect(nextMeta.expiresAt).toBe(localAction.meta.expiresAt);
    });

    it('should use existing entity with older date', () => {
      const localAction = {
        ...partialResultAction,
        meta: {
          ...partialResultAction.meta,
          date: partialResultAction.meta.date / 2,
          expiresAt: partialResultAction.meta.expiresAt / 2,
          fetchedAt: partialResultAction.meta.date / 2,
        },
      };
      const getMeta = (state: any): { date: number } =>
        state.entityMeta[Article.key][`${Article.pk(action.payload)}`];
      const getEntity = (state: any): Article =>
        state.entities[Article.key][`${Article.pk(action.payload)}`];
      const prevEntity = getEntity(newState);
      const prevMeta = getMeta(newState);
      expect(prevMeta).toBeDefined();
      const nextState = reducer(newState, localAction);
      const nextMeta = getMeta(nextState);
      const nextEntity = getEntity(nextState);

      expect(prevEntity).toEqual(nextEntity);

      expect(nextMeta).toBeDefined();
      expect(nextMeta.date).toBe(action.meta.date);
    });

    it('should use entity.expiresAt()', () => {
      class ExpiresSoon extends Article {
        static get key() {
          return Article.key;
        }

        static expiresAt(
          { expiresAt, date }: { expiresAt: number; date: number },
          input: any,
        ): number {
          return input.content ? expiresAt : 0;
        }
      }
      const spy = jest.spyOn(ExpiresSoon, 'expiresAt');
      const localAction = {
        ...partialResultAction,
        endpoint: (partialResultAction.endpoint as any).extend({
          schema: ExpiresSoon,
        }),
        meta: {
          ...partialResultAction.meta,
          date: partialResultAction.meta.date * 2,
          expiresAt: partialResultAction.meta.expiresAt * 2,
          fetchedAt: partialResultAction.meta.date * 2,
        },
      };
      const getMeta = (state: any): { date: number; expiresAt: number } =>
        state.entityMeta[ExpiresSoon.key][`${ExpiresSoon.pk(action.payload)}`];
      const getEntity = (state: any): ExpiresSoon =>
        state.entities[ExpiresSoon.key][`${ExpiresSoon.pk(action.payload)}`];

      const prevEntity = getEntity(newState);
      const prevMeta = getMeta(newState);
      expect(prevMeta).toBeDefined();
      const nextState = reducer(newState, localAction);
      expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);

      const nextMeta = getMeta(nextState);
      const nextEntity = getEntity(nextState);

      expect(nextMeta).toBeDefined();
      // our new expires was larger, but custom function returned 0, so we keep old expires
      expect(nextMeta.expiresAt).toBe(prevMeta.expiresAt);

      expect(nextEntity.title).toBe('hello');
    });
  });

  it('mutate should never change results', () => {
    const id = 20;
    const payload = { id, title: 'hi', content: 'this is the content' };
    const action: SetAction = {
      type: SET_TYPE,
      payload,
      endpoint: ArticleResource.get,
      meta: {
        args: [{ id }],
        key: ArticleResource.get.key(payload),
        date: 0,
        fetchedAt: 0,
        expiresAt: 1000000000000,
      },
    };
    const iniState = {
      ...initialState,
      results: { abc: '5', [ArticleResource.get.key(payload)]: `${id}` },
    };
    const newState = reducer(iniState, action);
    expect(newState.results).toStrictEqual(iniState.results);
  });
  it('purge should delete entities', () => {
    const id = 20;
    const action: SetAction = {
      type: SET_TYPE,
      payload: { id },
      endpoint: ArticleResource.delete,
      meta: {
        args: [{ id }],
        key: ArticleResource.delete.key({ id }),
        fetchedAt: 0,
        date: 0,
        expiresAt: 0,
      },
    };
    const iniState: any = {
      ...initialState,
      entities: {
        [Article.key]: {
          '10': Article.fromJS({ id: 10 }),
          '20': Article.fromJS({ id: 20 }),
          '25': Article.fromJS({ id: 25 }),
        },
        [PaginatedArticle.key]: {
          hi: PaginatedArticle.fromJS({ id: 5 }),
        },
        '5': undefined,
      },
      results: { abc: '20' },
    };
    const newState = reducer(iniState, action);
    expect(newState.results.abc).toBe(iniState.results.abc);
    const expectedEntities = { ...iniState.entities[Article.key] };
    expectedEntities['20'] = INVALID;
    expect(newState.entities[Article.key]).toEqual(expectedEntities);
  });

  /* this is probably not needed and will eventually be deprecated
  describe('endpoint.update', () => {
    describe('Update on get (pagination use case)', () => {
      const endpoint = PaginatedArticleResource.getList;

      const iniState: any = {
        ...initialState,
        entities: {
          [PaginatedArticle.key]: {
            '10': PaginatedArticle.fromJS({ id: 10 }),
          },
        },
        results: {
          [PaginatedArticleResource.getList.key({})]: { results: ['10'] },
        },
      };

      it('should insert a new page of resources into a list request', () => {
        const action = createSet(
          { results: [{ id: 11 }, { id: 12 }] },
          {
            ...endpoint,
            key: endpoint.key({ cursor: 2 }),
            update: (nextpage: { results: string[] }) => ({
              [PaginatedArticleResource.getList.key({})]: (
                existing: { results: string[] } = { results: [] },
              ) => ({
                ...existing,
                results: [...existing.results, ...nextpage.results],
              }),
            }),
            dataExpiryLength: 600000,
          },
        );
        const newState = reducer(iniState, action);
        expect(
          newState.results[PaginatedArticleResource.getList.key({})],
        ).toStrictEqual({
          results: ['10', '11', '12'],
        });
      });

      it('should insert correctly into the beginning of the list request', () => {
        const newState = reducer(
          iniState,
          createSet(
            { results: [{ id: 11 }, { id: 12 }] },
            {
              ...endpoint,
              key: endpoint.key({ cursor: 2 }),
              update: (nextpage: { results: string[] }) => ({
                [PaginatedArticleResource.getList.key({})]: (
                  existing: { results: string[] } = { results: [] },
                ) => ({
                  ...existing,
                  results: [...nextpage.results, ...existing.results],
                }),
              }),
              dataExpiryLength: 600000,
            },
          ),
        );
        expect(
          newState.results[PaginatedArticleResource.getList.key({})],
        ).toStrictEqual({
          results: ['11', '12', '10'],
        });
      });

      it('should account for args', () => {
        const iniState: any = {
          ...initialState,
          entities: {
            [PaginatedArticle.key]: {
              '10': PaginatedArticle.fromJS({ id: 10 }),
            },
          },
          results: {
            [PaginatedArticleResource.getList.key({ admin: true })]: {
              results: ['10'],
            },
          },
        };
        const newState = reducer(
          iniState,
          createSet(
            { results: [{ id: 11 }, { id: 12 }] },
            {
              ...endpoint,
              key: endpoint.key({ cursor: 2, admin: true }),
              args: [{ cursor: 2, admin: true }],
              update: (nextpage: { results: string[] }, { admin }) => ({
                [PaginatedArticleResource.getList.key({ admin })]: (
                  existing: { results: string[] } = { results: [] },
                ) => ({
                  ...existing,
                  results: [...nextpage.results, ...existing.results],
                }),
              }),
              dataExpiryLength: 600000,
            },
          ),
        );
        expect(
          newState.results[
            PaginatedArticleResource.getList.key({ admin: true })
          ],
        ).toStrictEqual({
          results: ['11', '12', '10'],
        });
      });
    });
  });*/

  it('invalidates resources correctly', () => {
    const id = 20;
    const action: InvalidateAction = {
      type: INVALIDATE_TYPE,
      meta: {
        key: id.toString(),
      },
    };
    const iniState: any = {
      ...initialState,
      entities: {
        [Article.key]: {
          '10': Article.fromJS({ id: 10 }),
          '20': Article.fromJS({ id: 20 }),
          '25': Article.fromJS({ id: 25 }),
        },
        [PaginatedArticle.key]: {
          hi: PaginatedArticle.fromJS({ id: 5 }),
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
    expect(newState.results).toEqual(iniState.results);
    expect(newState.entities).toBe(iniState.entities);
    const expectedMeta = { ...iniState.meta };
    expectedMeta['20'] = { expiresAt: 0, invalidated: true };
    expect(newState.meta).toEqual(expectedMeta);
  });
  it('should set error in meta for "receive"', () => {
    const id = 20;
    const error = new Error('hi');
    const action: SetAction = {
      type: SET_TYPE,
      payload: error,
      endpoint: ArticleResource.get,
      meta: {
        args: [{ id }],
        key: ArticleResource.get.key({ id }),
        fetchedAt: 5000000000,
        date: 5000000000,
        expiresAt: 5000500000,
      },
      error: true,
    };
    const iniState = initialState;
    const newState = reducer(iniState, action);
    expect(newState).toMatchSnapshot();
  });
  it('should not modify state on error for "rpc"', () => {
    const id = 20;
    const error = new Error('hi');
    const action: SetAction = {
      type: SET_TYPE,
      payload: error,
      endpoint: ArticleResource.get,
      meta: {
        args: [{ id }],
        key: ArticleResource.get.key({ id }),
        fetchedAt: 0,
        date: 0,
        expiresAt: 10000000000000000000,
      },
      error: true,
    };
    const iniState = initialState;
    const newState = reducer(iniState, action);
    // ignore meta for this check
    expect({ ...newState, meta: {} }).toEqual(iniState);
  });
  it('should not delete on error for "purge"', () => {
    const id = 20;
    const error = new Error('hi');
    const action: SetAction = {
      type: SET_TYPE,
      payload: error,
      endpoint: ArticleResource.delete,
      meta: {
        args: [{ id }],
        key: ArticleResource.delete.key({ id }),
        fetchedAt: 0,
        date: 0,
        expiresAt: 0,
      },
      error: true,
    };
    const iniState = {
      ...initialState,
      entities: {
        [Article.key]: {
          [id]: Article.fromJS({}),
        },
      },
      results: {
        [ArticleResource.get.url({ id })]: id,
      },
    };
    const newState = reducer(iniState, action);
    expect(newState.entities).toBe(iniState.entities);
  });
  it('rest-hooks/fetch should console.warn()', () => {
    const warnspy = jest
      .spyOn(global.console, 'warn')
      .mockImplementation(() => {});
    try {
      const action: FetchAction = {
        type: FETCH_TYPE,
        payload: () => new Promise<any>(() => null),
        endpoint: ArticleResource.get,
        meta: {
          args: [{ id: 5 }],
          key: ArticleResource.get.url({ id: 5 }),
          throttle: true,
          reject: (v: any) => null,
          resolve: (v: any) => null,
          promise: new Promise((v: any) => null),
          createdAt: 0,
        },
      };
      const iniState = {
        ...initialState,
        results: { abc: '5' },
      };
      const newState = reducer(iniState, action);
      expect(newState).toBe(iniState);
      expect(warnspy.mock.calls.length).toBe(2);
    } finally {
      warnspy.mockRestore();
    }
  });
  it('other types should do nothing', () => {
    const action: any = {
      type: 'whatever',
    };
    const iniState = {
      ...initialState,
      results: { abc: '5' },
    };
    const newState = reducer(iniState, action);
    expect(newState).toBe(iniState);
  });
  describe('RESET', () => {
    let warnspy: jest.SpyInstance;
    beforeEach(() => {
      warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warnspy.mockRestore();
    });

    it('reset should delete all entries', () => {
      const action: ResetAction = {
        type: RESET_TYPE,
        date: Date.now(),
      };
      const iniState: any = {
        ...initialState,
        entities: {
          [Article.key]: {
            '10': Article.fromJS({ id: 10 }),
            '20': Article.fromJS({ id: 20 }),
            '25': Article.fromJS({ id: 25 }),
          },
          [PaginatedArticle.key]: {
            hi: PaginatedArticle.fromJS({ id: 5 }),
          },
          '5': undefined,
        },
        results: { abc: '20' },
      };
      const newState = reducer(iniState, action);
      expect(newState.results).toEqual({});
      expect(newState.meta).toEqual({});
      expect(newState.entities).toEqual({});
    });
  });

  describe('GC action', () => {
    let iniState: State<unknown>;

    beforeEach(() => {
      iniState = {
        ...initialState,
        entities: {
          [Article.key]: {
            '10': Article.fromJS({ id: 10 }),
            '20': Article.fromJS({ id: 20 }),
            '25': Article.fromJS({ id: 25 }),
            '250': Article.fromJS({ id: 250 }),
          },
          [PaginatedArticle.key]: {
            hi: PaginatedArticle.fromJS({ id: 5 }),
          },
          '5': undefined,
        },
        entityMeta: {
          [Article.key]: {
            '10': { date: 0, expiresAt: 10000, fetchedAt: 0 },
            '20': { date: 0, expiresAt: 10000, fetchedAt: 0 },
            '25': { date: 0, expiresAt: 10000, fetchedAt: 0 },
            '250': { date: 0, expiresAt: 10000, fetchedAt: 0 },
          },
        },
        results: { abc: '20' },
      };
    });

    it('empty targets should do nothing', () => {
      const action: GCAction = {
        type: GC_TYPE,
        entities: [],
        results: [],
      };

      const newState = reducer(iniState, action);
      expect(newState).toBe(iniState);
      expect(Object.keys(newState.entities[Article.key] ?? {}).length).toBe(4);
      expect(Object.keys(newState.results).length).toBe(1);
    });

    it('empty deleting entities should work', () => {
      const action: GCAction = {
        type: GC_TYPE,
        entities: [
          [Article.key, '10'],
          [Article.key, '250'],
        ],
        results: ['abc'],
      };

      const newState = reducer(iniState, action);
      expect(newState).toBe(iniState);
      expect(Object.keys(newState.entities[Article.key] ?? {}).length).toBe(2);
      expect(Object.keys(newState.entityMeta[Article.key] ?? {}).length).toBe(
        2,
      );
      expect(Object.keys(newState.results).length).toBe(0);
    });

    it('empty deleting nonexistant things should passthrough', () => {
      const action: GCAction = {
        type: GC_TYPE,
        entities: [
          [Article.key, '100000000'],
          ['sillythings', '10'],
        ],
        results: [],
      };

      const newState = reducer(iniState, action);
      expect(newState).toBe(iniState);
      expect(Object.keys(newState.entities[Article.key] ?? {}).length).toBe(4);
      expect(Object.keys(newState.results).length).toBe(1);
    });
  });
});
