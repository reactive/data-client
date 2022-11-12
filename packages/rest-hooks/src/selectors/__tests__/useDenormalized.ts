import {
  CoolerArticleResource,
  PaginatedArticleResource,
  NestedArticleResource,
  UserResource,
  IndexedUserResource,
  photoShape,
} from '__tests__/legacy-3';
import { createEntityMeta } from '__tests__/utils';
import { normalize, NormalizedIndex } from '@rest-hooks/normalizr';
import { initialState } from '@rest-hooks/core';
import { renderHook, act } from '@testing-library/react-hooks';
import { useState } from 'react';
import { ExpiryStatus } from '@rest-hooks/normalizr';

import useDenormalized from '../useDenormalized';

describe('useDenormalized()', () => {
  describe('Single', () => {
    const params = { id: 5, title: 'bob', content: 'head' };
    const article = CoolerArticleResource.fromJS(params);
    describe('state is empty', () => {
      const state = initialState;
      const { result } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), { id: 5 }, state),
      );

      it('expiryStatus should be InvalidIfStale', () => {
        expect(result.current.expiryStatus).toBe(ExpiryStatus.InvalidIfStale);
      });

      it('should provide inferred results with undefined', () => {
        expect(result.current.data).toMatchInlineSnapshot(`undefined`);
      });
    });
    describe('state is populated just not with our query', () => {
      const state = {
        ...initialState,
        entities: {
          [CoolerArticleResource.key]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
      };
      const { result } = renderHook(() =>
        useDenormalized(
          CoolerArticleResource.detailShape(),
          {
            id: 543345345345453,
          },
          state,
        ),
      );

      it('expiryStatus should be InvalidIfStale', () => {
        expect(result.current.expiryStatus).toBe(ExpiryStatus.InvalidIfStale);
      });

      it('should provide inferred results with undefined', () => {
        expect(result.current.data).toMatchInlineSnapshot(`undefined`);
      });
    });
    describe('when state exists', () => {
      const state = {
        ...initialState,
        entities: {
          [CoolerArticleResource.key]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
      };
      state.entityMeta = createEntityMeta(state.entities);
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('expiryStatus should be Valid', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should provide inferred results', () => {
        expect(data).toStrictEqual(article);
        expect(data).toBeInstanceOf(CoolerArticleResource);
      });
    });
    describe('without entity with defined results', () => {
      const state = {
        ...initialState,
        entities: { [CoolerArticleResource.key]: {} },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
      };
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('expiryStatus should be Valid', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should provide inferred results with undefined', () => {
        expect(data).toMatchInlineSnapshot(`undefined`);
      });
    });
    describe('no result exists but primary key is used', () => {
      const state = {
        ...initialState,
        entities: {
          [CoolerArticleResource.key]: {
            [params.id]: article,
          },
        },
      };
      state.entityMeta = createEntityMeta(state.entities);
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('expiryStatus should be Valid', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should provide inferred results', () => {
        expect(data).toStrictEqual(article);
        expect(data).toBeInstanceOf(CoolerArticleResource);
      });
    });
    describe('no result exists but primary key is used when using nested schema', () => {
      const pageArticle = PaginatedArticleResource.fromJS(article);
      const state = {
        ...initialState,
        entities: {
          [PaginatedArticleResource.key]: {
            [params.id]: pageArticle,
          },
        },
      };
      state.entityMeta = createEntityMeta(state.entities);
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.detailShape(), params, state),
      );

      it('expiryStatus should be Valid', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should provide inferred results', () => {
        expect(data.data).toStrictEqual(pageArticle);
        expect(data.data).toBeInstanceOf(PaginatedArticleResource);
      });
    });

    describe('no result exists but index is used when using nested schema', () => {
      const pageArticle = PaginatedArticleResource.fromJS({
        ...params,
        author: IndexedUserResource.fromJS({ id: 23, username: 'anne' }),
      });
      const user = IndexedUserResource.fromJS({ id: 23, username: 'anne' });
      const IndexShape = {
        type: 'read' as const,
        getFetchKey({ username }: { username: string }) {
          return username;
        },
        schema: {
          pagination: { next: '', previous: '' },
          data: IndexedUserResource,
        },
      };

      it('should find value on index updates', () => {
        let localstate = {
          ...initialState,
          entities: {
            [PaginatedArticleResource.key]: {
              [`${pageArticle.pk()}`]: pageArticle,
            },
            [UserResource.key]: { [`${user.pk()}`]: user },
          },
        };
        localstate.entityMeta = createEntityMeta(localstate.entities);

        const { result, rerender } = renderHook(
          ({ state }) =>
            useDenormalized(IndexShape, { username: user.username }, state),
          { initialProps: { state: localstate } },
        );
        expect(result.current.expiryStatus).toBe(ExpiryStatus.InvalidIfStale);
        localstate = {
          ...localstate,
          indexes: {
            [IndexedUserResource.key]: {
              username: {
                [user.username]: user.pk(),
              },
            },
          } as NormalizedIndex,
        };
        rerender({ state: localstate });
        expect(result.current.expiryStatus).toBe(ExpiryStatus.Valid);
        expect(result.current.data.data).toStrictEqual(user);
      });
    });

    describe('not using primary key as param', () => {
      const urlParams = { title: 'bob' };
      const state = {
        ...initialState,
        entities: {
          [CoolerArticleResource.key]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(urlParams)]:
            params.id,
        },
      };
      state.entityMeta = createEntityMeta(state.entities);
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('expiryStatus should be Valid', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should provide inferred results', () => {
        expect(data).toStrictEqual(article);
        expect(data).toBeInstanceOf(CoolerArticleResource);
      });
    });
    it('should throw when results are Array', () => {
      const params = { title: 'bob' };
      const state = {
        ...initialState,
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: [5, 6, 7],
        },
      };
      const { result } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );
      expect(result.error).toBeDefined();
    });
    it('should throw when results are Object', () => {
      const params = { title: 'bob' };
      const state = {
        ...initialState,
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: {
            results: [5, 6, 7],
          },
        },
      };
      const { result } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );
      expect(result.error).toBeDefined();
    });
    describe('nested resources', () => {
      const nestedArticle = NestedArticleResource.fromJS({
        ...params,
        user: 23,
      });
      const user = UserResource.fromJS({ id: 23, username: 'anne' });

      const state = {
        ...initialState,
        entities: {
          [NestedArticleResource.key]: {
            [`${nestedArticle.pk()}`]: nestedArticle,
          },
          [UserResource.key]: { [`${user.pk()}`]: user },
        },
      };
      state.entityMeta = createEntityMeta(state.entities);
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(NestedArticleResource.detailShape(), params, state),
      );
      it('expiryStatus should be Valid', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should provide inferred results', () => {
        expect(data).toMatchInlineSnapshot(`
          NestedArticleResource {
            "author": null,
            "content": "head",
            "id": 5,
            "tags": [],
            "title": "bob",
            "user": UserResource {
              "email": "",
              "id": 23,
              "isAdmin": false,
              "username": "anne",
            },
          }
        `);
      });
    });
  });

  describe('List', () => {
    const params = { things: 5 };
    const articles = [
      CoolerArticleResource.fromJS({ id: 5 }),
      CoolerArticleResource.fromJS({ id: 6 }),
      CoolerArticleResource.fromJS({ id: 34, title: 'five' }),
    ];
    describe('state is empty', () => {
      const state = initialState;
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), {}, state),
      );

      it('expiryStatus should be InvalidIfStale', () => {
        expect(expiryStatus).toBe(ExpiryStatus.InvalidIfStale);
      });

      it('should provide inferred results with undefined for entity', () => {
        expect(data).toMatchInlineSnapshot(`
          {
            "nextPage": "",
            "prevPage": "",
            "results": undefined,
          }
        `);
      });
    });
    describe('state is partial', () => {
      const { entities } = normalize(
        articles,
        CoolerArticleResource.listShape().schema,
      );
      const state = initialState;
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), {}, state),
      );

      it('expiryStatus should be InvalidIfStale', () => {
        expect(expiryStatus).toBe(ExpiryStatus.InvalidIfStale);
      });

      it('should provide inferred results with undefined for entity', () => {
        expect(data).toMatchInlineSnapshot(`undefined`);
      });
    });
    describe('state exists', () => {
      const { entities, result: resultState } = normalize(
        articles,
        CoolerArticleResource.listShape().schema,
      );
      const state = {
        ...initialState,
        entities,
        entityMeta: createEntityMeta(entities),
        results: {
          [CoolerArticleResource.listShape().getFetchKey(params)]: resultState,
        },
      };
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), params, state),
      );

      it('found should be true', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should provide inferred results', () => {
        expect(data).toStrictEqual(articles);
      });
    });
    describe('missing some ids in entities table', () => {
      const { entities, result: resultState } = normalize(
        articles,
        CoolerArticleResource.listShape().schema,
      );
      delete entities[CoolerArticleResource.key]['5'];
      const state = {
        ...initialState,
        entities,
        entityMeta: createEntityMeta(entities),
        results: {
          [CoolerArticleResource.listShape().getFetchKey(params)]: resultState,
        },
      };
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), params, state),
      );

      const expectedArticles = articles.slice(1);

      it('expiryStatus should be Valid', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should simply ignore missing entities', () => {
        expect(data).toEqual(expectedArticles);
      });
    });
    describe('paginated results + missing some ids in entities table', () => {
      const { entities, result: resultState } = normalize(
        { results: articles },
        PaginatedArticleResource.listShape().schema,
      );
      delete entities[PaginatedArticleResource.key]['5'];
      const state = {
        ...initialState,
        entities,
        entityMeta: createEntityMeta(entities),
        results: {
          [PaginatedArticleResource.listShape().getFetchKey(params)]:
            resultState,
        },
      };
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), params, state),
      );

      it('expiryStatus should be Valid', () => {
        expect(expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should match normalized articles', () => {
        const expectedArticles = articles.slice(1);
        expect(data.results).toEqual(expectedArticles);
      });
    });
    describe('paginated results', () => {
      const { entities, result: resultState } = normalize(
        { results: articles },
        PaginatedArticleResource.listShape().schema,
      );
      const state = {
        ...initialState,
        entities,
        entityMeta: createEntityMeta(entities),
        results: {
          [PaginatedArticleResource.listShape().getFetchKey(params)]:
            resultState,
        },
      };
      let result: any;
      const denormalizeCache = {
        entities: {},
        results: {},
      };

      beforeEach(() => {
        const v = renderHook(() => {
          const [usedState, setState] = useState(state);
          return {
            ret: useDenormalized(
              PaginatedArticleResource.listShape(),
              params,
              usedState,
              denormalizeCache,
            ),
            setState,
          };
        });
        result = v.result;
      });

      it('expiryStatus should be Valid', () => {
        expect(result.current.ret.expiryStatus).toBe(ExpiryStatus.Valid);
      });

      it('should match normalized articles', () => {
        expect(result.current.ret.data.results).toEqual(articles);
      });

      it('should stay referentially equal with external entity changes', () => {
        const prevValue = result.current.ret.data;
        act(() =>
          result.current.setState((state: any) => ({
            ...state,
            entities: { ...state.entities, whatever: {} },
          })),
        );
        expect(result.current.ret.data).toBe(prevValue);
        expect(result.current.ret.data.results).toBe(prevValue.results);

        act(() =>
          result.current.setState((state: any) => {
            const ret = {
              ...state,
              entities: {
                ...state.entities,
                [PaginatedArticleResource.key]: {
                  1430: 'fake2',
                  ...state.entities[PaginatedArticleResource.key],
                  100000: 'fake',
                },
              },
            };
            return { ...ret, entityMeta: createEntityMeta(state.entities) };
          }),
        );
        expect(result.current.ret.data).toBe(prevValue);
        expect(result.current.ret.data.results).toBe(prevValue.results);
      });

      it('should referentially change when an entity changes', () => {
        const prevValue = result.current.ret.data;
        act(() =>
          result.current.setState((state: any) => ({
            ...state,
            entities: {
              ...state.entities,
              [PaginatedArticleResource.key]: {
                ...state.entities[PaginatedArticleResource.key],
                '5': CoolerArticleResource.fromJS({ id: 5, title: 'five' }),
              },
            },
          })),
        );
        expect(result.current.ret.data).not.toBe(prevValue);
      });

      it('should referentially change when the result extends', () => {
        const prevValue = result.current.ret.data;
        act(() =>
          result.current.setState((state: any) => ({
            ...state,
            results: {
              ...state.results,
              [PaginatedArticleResource.listShape().getFetchKey(params)]: {
                results: [...(resultState.results ?? []), '5'],
              },
            },
          })),
        );
        expect(result.current.ret.data).not.toBe(prevValue);
        expect(result.current.ret.data).toMatchSnapshot();
      });
    });

    describe('paginated results still loading', () => {
      const { entities, result: resultState } = normalize(
        { results: articles },
        PaginatedArticleResource.listShape().schema,
      );
      const state = {
        ...initialState,
        entities,
        entityMeta: createEntityMeta(entities),
      };
      const {
        result: {
          current: { data, expiryStatus, expiresAt },
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), params, state),
      );

      it('expiryStatus should be InvalidIfStale', () => {
        expect(expiryStatus).toBe(ExpiryStatus.InvalidIfStale);
      });

      it('value should be inferred for pagination primitives', () => {
        expect(data).toMatchInlineSnapshot(`
          {
            "nextPage": "",
            "prevPage": "",
            "results": undefined,
          }
        `);
      });
    });

    it('should not infer with schemas that have no entities', () => {
      const userId = '5';
      const { result } = renderHook(() => {
        return useDenormalized(photoShape, { userId }, initialState as any);
      });
      expect(result.current).toStrictEqual({
        data: null,
        expiresAt: 0,
        expiryStatus: ExpiryStatus.InvalidIfStale,
      });
    });

    it('should return results as-is for schemas with no entities', () => {
      const userId = '5';
      const results = new ArrayBuffer(10);
      const state = {
        ...initialState,
        results: {
          ...initialState.results,
          [photoShape.getFetchKey({ userId })]: results,
        },
      };
      const { result } = renderHook(() => {
        return useDenormalized(photoShape, { userId }, state);
      });
      expect(result.current).toStrictEqual({
        data: results,
        expiresAt: 0,
        expiryStatus: ExpiryStatus.Valid,
      });
    });

    it('should throw with invalid schemas', () => {
      const shape = PaginatedArticleResource.listShape();
      shape.schema = { happy: { go: { lucky: 5 } } } as any;
      const { result } = renderHook(() =>
        useDenormalized(shape, params, {} as any),
      );
      expect(result.error).toBeDefined();
    });
  });
});
