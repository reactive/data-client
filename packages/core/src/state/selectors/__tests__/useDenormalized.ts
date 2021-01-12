import {
  CoolerArticleResource,
  PaginatedArticleResource,
  NestedArticleResource,
  UserResource,
  IndexedUserResource,
  photoShape,
} from '__tests__/common';
import { denormalize, normalize, NormalizedIndex } from '@rest-hooks/normalizr';
import { initialState } from '@rest-hooks/core/state/reducer';
import { renderHook, act } from '@testing-library/react-hooks';
import { useRef, useState } from 'react';

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

      it('found should be false', () => {
        expect(result.current[1]).toBe(false);
      });

      it('deleted should be false', () => {
        expect(result.current[2]).toBe(false);
      });

      it('should provide inferred results with undefined', () => {
        expect(result.current[0]).toMatchInlineSnapshot(`undefined`);
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

      it('found should be false', () => {
        expect(result.current[1]).toBe(false);
      });

      it('deleted should be false', () => {
        expect(result.current[2]).toBe(false);
      });

      it('should provide inferred results with undefined', () => {
        expect(result.current[0]).toMatchInlineSnapshot(`undefined`);
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
      const {
        result: {
          current: [value, found, deleted],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('deleted should be false', () => {
        expect(deleted).toBe(false);
      });

      it('should provide inferred results', () => {
        expect(value).toStrictEqual(article);
        expect(value).toBeInstanceOf(CoolerArticleResource);
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
          current: [value, found, deleted],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('found should be false', () => {
        expect(found).toBe(false);
      });

      it('deleted should be false', () => {
        expect(deleted).toBe(false);
      });

      it('should provide inferred results with undefined', () => {
        expect(value).toMatchInlineSnapshot(`undefined`);
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
      const {
        result: {
          current: [value, found, deleted],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('deleted should be false', () => {
        expect(deleted).toBe(false);
      });

      it('should provide inferred results', () => {
        expect(value).toStrictEqual(article);
        expect(value).toBeInstanceOf(CoolerArticleResource);
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
      const {
        result: {
          current: [value, found, deleted],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.detailShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('deleted should be false', () => {
        expect(deleted).toBe(false);
      });

      it('should provide inferred results', () => {
        expect(value.data).toStrictEqual(pageArticle);
        expect(value.data).toBeInstanceOf(PaginatedArticleResource);
      });
    });

    describe('no result exists but index is used when using nested schema', () => {
      const pageArticle = PaginatedArticleResource.fromJS({
        ...params,
        author: 23,
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

        const { result, rerender } = renderHook(
          ({ state }) =>
            useDenormalized(IndexShape, { username: user.username }, state),
          { initialProps: { state: localstate } },
        );
        expect(result.current[1]).toBe(false);
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
        expect(result.current[1]).toBe(true);
        expect(result.current[2]).toBe(false);
        expect(result.current[0].data).toStrictEqual(user);
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
          [CoolerArticleResource.detailShape().getFetchKey(
            urlParams,
          )]: params.id,
        },
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value).toStrictEqual(article);
        expect(value).toBeInstanceOf(CoolerArticleResource);
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
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(NestedArticleResource.detailShape(), params, state),
      );
      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value).toMatchInlineSnapshot(`
          NestedArticleResource {
            "author": null,
            "content": "head",
            "id": 5,
            "tags": Array [],
            "title": "bob",
            "user": 23,
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
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), {}, state),
      );

      it('found should be false', () => {
        expect(found).toBe(false);
      });

      it('should provide inferred results with undefined for entity', () => {
        expect(value).toMatchInlineSnapshot(`
          Object {
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
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), {}, state),
      );

      it('found should be false', () => {
        expect(found).toBe(false);
      });

      it('should provide inferred results with undefined for entity', () => {
        expect(value).toMatchInlineSnapshot(`undefined`);
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
        results: {
          [CoolerArticleResource.listShape().getFetchKey(params)]: resultState,
        },
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value).toStrictEqual(articles);
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
        results: {
          [CoolerArticleResource.listShape().getFetchKey(params)]: resultState,
        },
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), params, state),
      );

      const expectedArticles = articles.slice(1);

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should simply ignore missing entities', () => {
        expect(value).toEqual(expectedArticles);
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
        results: {
          [PaginatedArticleResource.listShape().getFetchKey(
            params,
          )]: resultState,
        },
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should match normalized articles', () => {
        const expectedArticles = articles.slice(1);
        expect(value.results).toEqual(expectedArticles);
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
        results: {
          [PaginatedArticleResource.listShape().getFetchKey(
            params,
          )]: resultState,
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

      it('found should be true', () => {
        expect(result.current.ret[1]).toBe(true);
      });

      it('should match normalized articles', () => {
        expect(result.current.ret[0].results).toEqual(articles);
      });

      it('should stay referentially equal with external entity changes', () => {
        const prevValue = result.current.ret[0];
        act(() =>
          result.current.setState((state: any) => ({
            ...state,
            entities: { ...state.entities, whatever: {} },
          })),
        );
        expect(result.current.ret[0]).toBe(prevValue);
        expect(result.current.ret[0].results).toBe(prevValue.results);

        act(() =>
          result.current.setState((state: any) => ({
            ...state,
            entities: {
              ...state.entities,
              [PaginatedArticleResource.key]: {
                1430: 'fake2',
                ...state.entities[PaginatedArticleResource.key],
                100000: 'fake',
              },
            },
          })),
        );
        expect(result.current.ret[0]).toBe(prevValue);
        expect(result.current.ret[0].results).toBe(prevValue.results);
      });

      it('should referentially change when an entity changes', () => {
        const prevValue = result.current.ret[0];
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
        expect(result.current.ret[0]).not.toBe(prevValue);
      });

      it('should referentially change when the result extends', () => {
        const prevValue = result.current.ret[0];
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
        expect(result.current.ret[0]).not.toBe(prevValue);
        expect(result.current.ret[0]).toMatchSnapshot();
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
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), params, state),
      );

      it('found should be false', () => {
        expect(found).toBe(false);
      });

      it('value should be inferred for pagination primitives', () => {
        expect(value).toMatchInlineSnapshot(`
          Object {
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
      expect(result.current).toStrictEqual([undefined, false, false]);
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
      expect(result.current).toStrictEqual([results, true, false]);
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
