import { Entity } from '@data-client/endpoint';
import { INVALID } from '@data-client/normalizr';
import { ArticleResource, Article, PaginatedArticle } from '__tests__/new';

import { Controller } from '../..';
import {
  INVALIDATE,
  FETCH,
  RESET,
  GC,
  SET_RESPONSE,
  SET,
} from '../../actionTypes';
import {
  State,
  ActionTypes,
  FetchAction,
  SetResponseAction,
  ResetAction,
  InvalidateAction,
  GCAction,
  SetAction,
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
    const response = { id, title: 'hi', content: 'this is the content' };
    const action: SetResponseAction = {
      type: SET_RESPONSE,
      response,
      endpoint: ArticleResource.get,
      args: [{ id }],
      key: ArticleResource.get.url({ id }),
      meta: {
        date: 5000000000,
        expiresAt: 5000500000,
        fetchedAt: 5000000000,
      },
    };
    const partialResultAction: SetResponseAction = {
      ...action,
      response: { id, title: 'hello' },
    };
    const iniState = initialState;
    let newState = initialState;
    it('should update state correctly', () => {
      newState = reducer(iniState, action);
      expect(newState).toMatchSnapshot();
    });
    it('should overwrite existing entity', () => {
      const getEntity = (state: any): Article =>
        state.entities[Article.key][`${Article.pk(action.response)}`];
      const prevEntity = getEntity(newState);
      expect(prevEntity).toBeDefined();
      const nextState = reducer(newState, action);
      const nextEntity = getEntity(nextState);
      expect(nextEntity).not.toBe(prevEntity);
      expect(nextEntity).toBeDefined();
    });
    it('should merge partial entity with existing entity', () => {
      const getEntity = (state: any): Article =>
        state.entities[Article.key][`${Article.pk(action.response)}`];
      const prevEntity = getEntity(newState);
      expect(prevEntity).toBeDefined();
      const nextState = reducer(newState, partialResultAction);
      const nextEntity = getEntity(nextState);
      expect(nextEntity).not.toBe(prevEntity);
      expect(nextEntity).toBeDefined();

      expect(nextEntity.title).not.toBe(prevEntity.title);
      expect(nextEntity.title).toBe(partialResultAction.response.title);

      expect(nextEntity.content).toBe(prevEntity.content);
      expect(nextEntity.content).not.toBe(undefined);

      expect(
        nextState.entitiesMeta[Article.key][`${Article.pk(action.response)}`],
      ).toBeDefined();
      expect(
        nextState.entitiesMeta[Article.key][`${Article.pk(action.response)}`]
          .date,
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
        state.entitiesMeta[Article.key][`${Article.pk(action.response)}`];
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
        state.entitiesMeta[Article.key][`${Article.pk(action.response)}`];
      const getEntity = (state: any): Article =>
        state.entities[Article.key][`${Article.pk(action.response)}`];
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

    it('should use entity.mergeMetaWithStore()', () => {
      class ExpiresSoon extends Article {
        static get key() {
          return Article.key;
        }

        static mergeMetaWithStore(
          existingMeta: {
            expiresAt: number;
            date: number;
            fetchedAt: number;
          },
          incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
          existing: any,
          incoming: any,
        ) {
          return (
              this.shouldReorder(existingMeta, incomingMeta, existing, incoming)
            ) ?
              existingMeta
            : {
                ...incomingMeta,
                expiresAt:
                  incoming.content ?
                    incomingMeta.expiresAt
                  : existingMeta.expiresAt,
              };
        }
      }
      const spy = jest.spyOn(ExpiresSoon, 'mergeMetaWithStore');
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
        state.entitiesMeta[ExpiresSoon.key][
          `${ExpiresSoon.pk(action.response)}`
        ];
      const getEntity = (state: any): ExpiresSoon =>
        state.entities[ExpiresSoon.key][`${ExpiresSoon.pk(action.response)}`];

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

  it('set(function) should do nothing when entity does not exist', () => {
    const id = 20;
    const value = (previous: { counter: number }) => ({
      counter: previous.counter + 1,
    });
    class Counter extends Entity {
      id = 0;
      counter = 0;

      static key = 'Counter';
    }
    const action: SetAction = {
      type: SET,
      value,
      schema: Counter,
      args: [{ id }],
      meta: {
        date: 0,
        fetchedAt: 0,
        expiresAt: 1000000000000,
      },
    };
    const newState = reducer(initialState, action);
    expect(newState).toBe(initialState);
  });

  it('set(function) should increment when it is found', () => {
    const id = 20;
    const value = (previous: { id: number; counter: number }) => ({
      id: previous.id,
      counter: previous.counter + 1,
    });
    class Counter extends Entity {
      id = 0;
      counter = 0;

      static key = 'Counter';
    }
    const action: SetAction = {
      type: SET,
      value,
      schema: Counter,
      args: [{ id }],
      meta: {
        date: 0,
        fetchedAt: 0,
        expiresAt: 1000000000000,
      },
    };
    const state = {
      ...initialState,
      entities: {
        [Counter.key]: {
          [id]: { id, counter: 5 },
        },
      },
      entitiesMeta: {
        [Counter.key]: {
          [id]: { date: 0, fetchedAt: 0, expiresAt: 0 },
        },
      },
    };
    const newState = reducer(state, action);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(newState.entities[Counter.key]?.[id]?.counter).toBe(6);
  });

  it('set should add entity when it does not exist', () => {
    const id = 20;
    const value = { id, title: 'hi', content: 'this is the content' };
    const action: SetAction = {
      type: SET,
      value,
      schema: Article,
      args: [{ id }],
      meta: {
        date: 0,
        fetchedAt: 0,
        expiresAt: 1000000000000,
      },
    };
    const iniState = {
      ...initialState,
      endpoints: { abc: '5', [ArticleResource.get.key(value)]: `${id}` },
    };
    const newState = reducer(iniState, action);
    expect(newState.entities[Article.key]?.[id]).toEqual(value);
  });

  it('set should never change endpoints', () => {
    const id = 20;
    const value = { id, title: 'hi', content: 'this is the content' };
    const action: SetAction = {
      type: SET,
      value,
      schema: Article,
      args: [{ id }],
      meta: {
        date: 0,
        fetchedAt: 0,
        expiresAt: 1000000000000,
      },
    };
    const iniState = {
      ...initialState,
      endpoints: { abc: '5', [ArticleResource.get.key(value)]: `${id}` },
    };
    const newState = reducer(iniState, action);
    expect(newState.endpoints).toStrictEqual(iniState.endpoints);
  });

  it('mutate should never change endpoints', () => {
    const id = 20;
    const response = { id, title: 'hi', content: 'this is the content' };
    const action: SetResponseAction = {
      type: SET_RESPONSE,
      response,
      endpoint: ArticleResource.get,
      args: [{ id }],
      key: ArticleResource.get.key(response),
      meta: {
        date: 0,
        fetchedAt: 0,
        expiresAt: 1000000000000,
      },
    };
    const iniState = {
      ...initialState,
      endpoints: { abc: '5', [ArticleResource.get.key(response)]: `${id}` },
    };
    const newState = reducer(iniState, action);
    expect(newState.endpoints).toStrictEqual(iniState.endpoints);
  });
  it('purge should delete entities', () => {
    const id = 20;
    const action: SetResponseAction = {
      type: SET_RESPONSE,
      response: { id },
      endpoint: ArticleResource.delete,
      args: [{ id }],
      key: ArticleResource.delete.key({ id }),
      meta: {
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
      endpoints: { abc: '20' },
    };
    const newState = reducer(iniState, action);
    expect(newState.endpoints.abc).toBe(iniState.endpoints.abc);
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
        endpoints: {
          [PaginatedArticleResource.getList.key({})]: { endpoints: ['10'] },
        },
      };

      it('should insert a new page of resources into a list request', () => {
        const action = createSetResponse(
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
          newState.endpoints[PaginatedArticleResource.getList.key({})],
        ).toStrictEqual({
          results: ['10', '11', '12'],
        });
      });

      it('should insert correctly into the beginning of the list request', () => {
        const newState = reducer(
          iniState,
          createSetResponse(
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
          newState.endpoints[PaginatedArticleResource.getList.key({})],
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
          endpoints: {
            [PaginatedArticleResource.getList.key({ admin: true })]: {
              results: ['10'],
            },
          },
        };
        const newState = reducer(
          iniState,
          createSetResponse(
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
          newState.endpoints[
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
      type: INVALIDATE,
      key: id.toString(),
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
      endpoints: { abc: '20' },
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
    expect(newState.endpoints).toEqual(iniState.endpoints);
    expect(newState.entities).toBe(iniState.entities);
    const expectedMeta = { ...iniState.meta };
    expectedMeta['20'] = { expiresAt: 0, invalidated: true };
    expect(newState.meta).toEqual(expectedMeta);
  });
  it('should set error in meta for "set"', () => {
    const id = 20;
    const error = new Error('hi');
    const action: SetResponseAction = {
      type: SET_RESPONSE,
      response: error,
      endpoint: ArticleResource.get,
      args: [{ id }],
      key: ArticleResource.get.key({ id }),
      meta: {
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
    const action: SetResponseAction = {
      type: SET_RESPONSE,
      response: error,
      endpoint: ArticleResource.get,
      args: [{ id }],
      key: ArticleResource.get.key({ id }),
      meta: {
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
    const action: SetResponseAction = {
      type: SET_RESPONSE,
      response: error,
      endpoint: ArticleResource.delete,
      args: [{ id }],
      key: ArticleResource.delete.key({ id }),
      meta: {
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
      endpoints: {
        [ArticleResource.get.url({ id })]: id,
      },
    };
    const newState = reducer(iniState, action);
    expect(newState.entities).toBe(iniState.entities);
  });
  it('rdc/fetch should not console.warn()', () => {
    const warnspy = jest
      .spyOn(global.console, 'warn')
      .mockImplementation(() => {});
    try {
      const action: FetchAction = {
        type: FETCH,
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        key: ArticleResource.get.url({ id: 5 }),
        meta: {
          reject: (v: any) => null,
          resolve: (v: any) => null,
          promise: new Promise((v: any) => null),
          fetchedAt: 0,
        },
      };
      const iniState = {
        ...initialState,
        endpoints: { abc: '5' },
      };
      const newState = reducer(iniState, action);
      expect(newState).toBe(iniState);
      // moved warns to applyManager() vv
      expect(warnspy.mock.calls.length).toBe(0);
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
      endpoints: { abc: '5' },
    };
    const newState = reducer(iniState, action);
    expect(newState).toBe(iniState);
  });
  describe('RESET', () => {
    let warnspy: jest.Spied<any>;
    beforeEach(() => {
      warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warnspy.mockRestore();
    });

    it('reset should delete all entries', () => {
      const action: ResetAction = {
        type: RESET,
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
        endpoints: { abc: '20' },
      };
      const newState = reducer(iniState, action);
      expect(newState.endpoints).toEqual({});
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
        entitiesMeta: {
          [Article.key]: {
            '10': { date: 0, expiresAt: 10000, fetchedAt: 0 },
            '20': { date: 0, expiresAt: 10000, fetchedAt: 0 },
            '25': { date: 0, expiresAt: 10000, fetchedAt: 0 },
            '250': { date: 0, expiresAt: 10000, fetchedAt: 0 },
          },
        },
        endpoints: { abc: '20' },
      };
    });

    it('empty targets should do nothing', () => {
      const action: GCAction = {
        type: GC,
        entities: [],
        endpoints: [],
      };

      const newState = reducer(iniState, action);
      expect(newState).toBe(iniState);
      expect(Object.keys(newState.entities[Article.key] ?? {}).length).toBe(4);
      expect(Object.keys(newState.endpoints).length).toBe(1);
    });

    it('empty deleting entities should work', () => {
      const action: GCAction = {
        type: GC,
        entities: [
          { key: Article.key, pk: '10' },
          { key: Article.key, pk: '250' },
        ],
        endpoints: ['abc'],
      };

      const newState = reducer(iniState, action);
      expect(newState).toBe(iniState);
      expect(Object.keys(newState.entities[Article.key] ?? {}).length).toBe(2);
      expect(Object.keys(newState.entitiesMeta[Article.key] ?? {}).length).toBe(
        2,
      );
      expect(Object.keys(newState.endpoints).length).toBe(0);
    });

    it('empty deleting nonexistant things should passthrough', () => {
      const action: GCAction = {
        type: GC,
        entities: [
          { key: Article.key, pk: '100000000' },
          { key: 'sillythings', pk: '10' },
        ],
        endpoints: [],
      };

      const newState = reducer(iniState, action);
      expect(newState).toBe(iniState);
      expect(Object.keys(newState.entities[Article.key] ?? {}).length).toBe(4);
      expect(Object.keys(newState.endpoints).length).toBe(1);
    });
  });
});
