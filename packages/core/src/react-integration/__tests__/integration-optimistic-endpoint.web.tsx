import {
  CoolerArticleResource,
  ArticleResourceWithOtherListUrl,
  FutureArticleResource,
  VisSettings,
  VisSettingsResource,
  VisEndpoint,
  CoolerArticle,
  Article,
} from '__tests__/new';
import nock from 'nock';
import { Endpoint, Entity } from '@rest-hooks/endpoint';
import { AbortOptimistic } from '@rest-hooks/endpoint';
import { act } from '@testing-library/react-hooks';
import { useContext } from 'react';
import { jest } from '@jest/globals';
import { SpyInstance } from 'jest-mock';

import {
  makeRenderRestHook,
  makeCacheProvider,
  makeExternalCacheProvider,
} from '../../../../test';
import { useCache, useController, useSuspense } from '../hooks';
import {
  payload,
  createPayload,
  users,
  nested,
  valuesFixture,
} from '../test-fixtures';
import { StateContext } from '../context';
import { useError } from '../newhooks';

function onError(e: any) {
  e.preventDefault();
}
beforeEach(() => {
  if (typeof addEventListener === 'function')
    addEventListener('error', onError);
});
afterEach(() => {
  if (typeof removeEventListener === 'function')
    removeEventListener('error', onError);
});

/*
  These tests cover 'getOptimisticResponse' property
*/
describe.each([
  ['CacheProvider', makeCacheProvider],
  ['ExternalCacheProvider', makeExternalCacheProvider],
] as const)(`%s`, (_, makeProvider) => {
  describe('Optimistic Updates', () => {
    let renderRestHook: ReturnType<typeof makeRenderRestHook>;
    let mynock: nock.Scope;

    beforeEach(() => {
      nock(/.*/)
        .persist()
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        })
        .options(/.*/)
        .reply(200)
        .get(`/article-cooler/${payload.id}`)
        .reply(200, payload)
        .delete(`/article-cooler/${payload.id}`)
        .reply(204, '')
        .delete(`/article/${payload.id}`)
        .reply(200, {})
        .delete(`/user/23`)
        .reply(204, '')
        .get(`/article-cooler/0`)
        .reply(403, {})
        .get(`/article-cooler/666`)
        .reply(200, '')
        .get(`/article-cooler`)
        .reply(200, nested)
        .get(`/article-cooler/values`)
        .reply(200, valuesFixture)
        .post(`/article-cooler`)
        .reply(200, createPayload)
        .get(`/user`)
        .reply(200, users);

      mynock = nock(/.*/).defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
    });

    afterEach(() => {
      nock.cleanAll();
      jest.useRealTimers().clearAllMocks();
    });
    afterAll(() => {
      jest.restoreAllMocks();
    });

    beforeEach(() => {
      renderRestHook = makeRenderRestHook(makeProvider);
    });

    it('works with partial update', async () => {
      const params = { id: payload.id };
      mynock.patch('/article-cooler/5').reply(200, {
        ...payload,
        title: 'some other title',
        content: 'real response',
      });

      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const { fetch } = useController();
          const article = useCache(CoolerArticleResource.get, params);
          // @ts-expect-error
          article.doesnotexist;
          return { fetch, article };
        },
        {
          results: [
            {
              endpoint: CoolerArticleResource.get,
              args: [params],
              response: payload,
            },
          ],
        },
      );
      expect(result.current.article).toEqual(CoolerArticle.fromJS(payload));
      const promise = act(async () => {
        await result.current.fetch(
          CoolerArticleResource.partialUpdate,
          params,
          {
            content: 'changed',
          },
        );
      });
      expect(result.current.article).toBeInstanceOf(CoolerArticle);
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          content: 'changed',
        }),
      );
      await promise;
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      );
    });

    it('works with deletes', async () => {
      const params = { id: payload.id };
      mynock.delete('/article-cooler/5').reply(200, '');

      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const { fetch } = useController();
          const articles = useCache(CoolerArticleResource.getList);
          return { fetch, articles };
        },
        {
          results: [
            {
              endpoint: CoolerArticleResource.getList,
              args: [{}],
              response: [payload],
            },
          ],
        },
      );
      expect(result.current.articles).toEqual([CoolerArticle.fromJS(payload)]);
      const promise = act(async () => {
        await result.current.fetch(CoolerArticleResource.delete, params);
      });
      expect(result.current.articles).toEqual([]);
      await promise;
      expect(result.current.articles).toEqual([]);
    });

    it('works with eager creates', async () => {
      const body = { id: -1111111111, content: 'hi' };
      const existingItem = Article.fromJS({
        id: 100,
        content: 'something',
      });

      mynock.post(`/article`).reply(201, {
        ...payload,
        title: 'some other title',
        content: 'real response',
      });

      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const { fetch } = useController();
          const listA = useCache(ArticleResourceWithOtherListUrl.getList);
          const listB = useCache(ArticleResourceWithOtherListUrl.otherList);
          return { fetch, listA, listB };
        },
        {
          results: [
            {
              endpoint: ArticleResourceWithOtherListUrl.otherList,
              args: [],
              response: [{ id: 100, content: 'something' }],
            },
          ],
        },
      );

      expect(result.current.listA).toEqual(undefined);
      expect(result.current.listB).toEqual([existingItem]);

      const promise = act(async () => {
        await result.current.fetch(
          ArticleResourceWithOtherListUrl.create,
          body,
        );
      });

      expect(result.current.listA).toEqual([CoolerArticle.fromJS(body)]);
      expect(result.current.listB).toEqual([
        existingItem,
        CoolerArticle.fromJS(body),
      ]);
      await promise;
      expect(result.current.listA).toEqual([
        CoolerArticle.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      ]);
      expect(result.current.listB).toEqual([
        existingItem,
        CoolerArticle.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      ]);
    });

    it('should update on create', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        const articles = useSuspense(FutureArticleResource.getList);
        const { fetch } = useController();
        return { articles, fetch };
      });

      await waitForNextUpdate();
      expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3]);

      const createOptimistic = FutureArticleResource.create.extend({
        getOptimisticResponse: (snap, body) => ({
          id: Math.random(),
          ...(body as any),
        }),
      });
      act(() => {
        result.current.fetch(createOptimistic, {
          id: 1,
          title: 'whatever',
        });
      });
      expect(result.current.articles.map(({ id }) => id)).toEqual([1, 5, 3]);
    });

    it('should clear only earlier optimistic updates when a promise resolves', async () => {
      const params = { id: payload.id };
      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const { fetch } = useController();
          const article = useCache(CoolerArticleResource.get, params);
          return { fetch, article };
        },
        {
          initialFixtures: [
            {
              endpoint: CoolerArticleResource.get,
              args: [params],
              response: payload,
            },
          ],
        },
      );

      const fetches: Promise<any>[] = [];
      const resolves: ((v: any) => void)[] = [];

      // first optimistic

      await act(async () => {
        fetches.push(
          result.current.fetch(
            CoolerArticleResource.partialUpdate.extend({
              fetch(...args: any[]) {
                return new Promise(resolve => {
                  resolves.push(resolve);
                });
              },
            }),
            params,
            {
              title: 'firstoptimistic',
              content: 'firstoptimistic',
            },
          ),
        );
      });
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'firstoptimistic',
          content: 'firstoptimistic',
        }),
      );
      await new Promise(resolve => setTimeout(resolve, 0));

      // second optimistic
      act(() => {
        fetches.push(
          result.current.fetch(
            CoolerArticleResource.partialUpdate.extend({
              fetch(...args: any[]) {
                return new Promise(resolve => {
                  resolves.push(resolve);
                });
              },
            }),
            params,
            {
              title: 'secondoptimistic',
            },
          ),
        );
      });
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'firstoptimistic',
        }),
      );
      await new Promise(resolve => setTimeout(resolve, 0));

      // third optimistic
      act(() => {
        fetches.push(
          result.current.fetch(
            CoolerArticleResource.partialUpdate.extend({
              fetch(...args: any[]) {
                return new Promise(resolve => {
                  resolves.push(resolve);
                });
              },
            }),
            params,
            {
              tags: ['thirdoptimistic'],
            },
          ),
        );
      });
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'firstoptimistic',
          tags: ['thirdoptimistic'],
        }),
      );

      // resolve second request while first is in flight
      act(() => {
        setTimeout(() => resolves[1]({ ...payload, title: 'second' }), 1);
      });
      await act(() => fetches[1]);

      // first and second optimistic should be cleared with only third optimistic left to be layerd
      // on top of second's network response
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'second',
          tags: ['thirdoptimistic'],
        }),
      );

      // resolve the first fetch; but the second fetch happened after so we use it first since this is default 'first fetchedAt' behavior
      // this can be solved by either canceling requests or having server send the total order
      act(() =>
        resolves[0]({
          ...payload,
          title: 'first',
          content: 'first',
        }),
      );
      await act(() => fetches[0]);
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'second',
          tags: ['thirdoptimistic'],
        }),
      );
    });

    it('should clear optimistic when server response resolves in order', async () => {
      const params = { id: payload.id };
      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const { fetch } = useController();
          const article = useCache(CoolerArticleResource.get, params);
          return { fetch, article };
        },
        {
          results: [
            {
              endpoint: CoolerArticleResource.get,
              args: [params],
              response: payload,
            },
          ],
        },
      );

      const fetches: Promise<any>[] = [];
      const resolves: ((v: any) => void)[] = [];

      // first optimistic

      await act(async () => {
        fetches.push(
          result.current.fetch(
            CoolerArticleResource.partialUpdate.extend({
              fetch(...args: any[]) {
                return new Promise(resolve => {
                  resolves.push(resolve);
                });
              },
            }),
            params,
            {
              title: 'firstoptimistic',
              content: 'firstoptimistic',
            },
          ),
        );
      });
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'firstoptimistic',
          content: 'firstoptimistic',
        }),
      );
      await new Promise(resolve => setTimeout(resolve, 0));

      // second optimistic
      act(() => {
        fetches.push(
          result.current.fetch(
            CoolerArticleResource.partialUpdate.extend({
              fetch(...args: any[]) {
                return new Promise(resolve => {
                  resolves.push(resolve);
                });
              },
            }),
            params,
            {
              title: 'secondoptimistic',
            },
          ),
        );
      });
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'firstoptimistic',
        }),
      );
      await new Promise(resolve => setTimeout(resolve, 0));

      // third optimistic
      act(() => {
        fetches.push(
          result.current.fetch(
            CoolerArticleResource.partialUpdate.extend({
              fetch(...args: any[]) {
                return new Promise(resolve => {
                  resolves.push(resolve);
                });
              },
            }),
            params,
            {
              tags: ['thirdoptimistic'],
            },
          ),
        );
      });
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'firstoptimistic',
          tags: ['thirdoptimistic'],
        }),
      );

      // resolve first request
      act(() => {
        setTimeout(() => resolves[0]({ ...payload, content: 'first' }), 1);
      });
      await act(() => fetches[0]);

      // replace optimistic with response
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'first',
          tags: ['thirdoptimistic'],
        }),
      );

      // resolve second request
      act(() =>
        resolves[1]({
          ...payload,
          title: 'second',
          content: 'first',
        }),
      );
      await act(() => fetches[0]);
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'second',
          content: 'first',
          tags: ['thirdoptimistic'],
        }),
      );

      // resolve third request
      act(() =>
        resolves[2]({
          ...payload,
          title: 'second',
          content: 'first',
          tags: ['third'],
        }),
      );
      await act(() => fetches[0]);
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'second',
          content: 'first',
          tags: ['third'],
        }),
      );
    });

    describe('race conditions', () => {
      let errorspy: SpyInstance<typeof global.console.error>;
      beforeEach(() => {
        errorspy = jest
          .spyOn(global.console, 'error')
          .mockImplementation(() => {});
      });
      afterEach(() => {
        errorspy.mockRestore();
      });

      class Toggle extends Entity {
        readonly id: number = 0;
        readonly visible: boolean = true;

        pk() {
          return `${this.id}`;
        }
      }
      const getbool = new Endpoint(
        (id: number): Promise<{ id: number; visible: boolean }> =>
          fetch(`/toggle/${id}`).then(res => res.json()),
        {
          name: 'gettoggle',
          schema: Toggle,
        },
      );
      const toggle = new Endpoint(
        (id: number): Promise<{ id: number; visible: boolean }> =>
          fetch(`/toggle/${id}`, { method: 'POST' }).then(res => res.json()),
        {
          name: 'toggle',
          schema: Toggle,
          sideEffect: true,
          getOptimisticResponse(snap, id) {
            const { data } = snap.getResponse(getbool, id);
            if (!data) throw new AbortOptimistic();
            return {
              id,
              visible: data.visible ? false : true,
            };
          },
        },
      );

      // Object.create(null) handles e.constructor is undefined case
      it.each(['failed string', Object.create(null)])(
        'should fail when %s is thrown in getOptimisticResponse',
        async toThrow => {
          const failToggle = toggle.extend({
            getOptimisticResponse(snap, id) {
              throw toThrow;
            },
          });
          // keeping state here allows the requests to flip flop each time
          let visible = false;
          mynock.get('/toggle/5').reply(200, () => {
            return { id: 5, visible };
          });
          mynock
            .persist()
            .post('/toggle/5')
            .delay(2000)
            .reply(200, () => {
              visible = visible ? false : true;
              return { id: 5, visible };
            });

          const { result, waitForNextUpdate } = renderRestHook(
            () => {
              const { fetch } = useController();
              const tog = useCache(getbool, 5);
              const err = useError(failToggle, 5);
              // @ts-expect-error
              tog.doesnotexist;
              return { fetch, tog, err };
            },
            {
              results: [
                {
                  endpoint: getbool,
                  args: [5],
                  response: { id: 5, visible },
                },
              ],
            },
          );
          expect(result.current.tog).toEqual({ id: 5, visible: false });

          const promise = act(async () => {
            await result.current.fetch(failToggle, 5);
          });
          // nothing should change since this failed
          expect(result.current.tog).toEqual({ id: 5, visible: false });
          expect(result.current.err).toEqual(toThrow);
          await promise;
        },
      );

      it('toggle should alternate with multiple optimistic updates', async () => {
        jest.useFakeTimers({ legacyFakeTimers: false });

        // keeping state here allows the requests to flip flop each time
        let visible = false;
        mynock.get('/toggle/5').reply(200, () => {
          return { id: 5, visible };
        });
        mynock
          .persist()
          .post('/toggle/5')
          .delay(2000)
          .reply(200, () => {
            visible = visible ? false : true;
            return { id: 5, visible };
          });

        const { result, waitForNextUpdate } = renderRestHook(
          () => {
            const { fetch } = useController();
            const tog = useCache(getbool, 5);
            // @ts-expect-error
            tog.doesnotexist;
            return { fetch, tog };
          },
          {
            results: [
              {
                endpoint: getbool,
                args: [5],
                response: { id: 5, visible },
              },
            ],
          },
        );

        expect(result.current.tog).toEqual({ id: 5, visible: false });

        const promises: Promise<any>[] = [];
        const promises2: Promise<any>[] = [];

        act(() => {
          promises.push(result.current.fetch(toggle, 5));
        });
        expect(result.current.tog).toEqual({ id: 5, visible: true });

        act(() => {
          promises.push(result.current.fetch(toggle, 5));
        });
        expect(result.current.tog).toEqual({ id: 5, visible: false });

        act(() => {
          promises.push(result.current.fetch(toggle, 5));
        });
        expect(result.current.tog).toEqual({ id: 5, visible: true });

        jest.advanceTimersByTime(300);

        act(() => {
          promises2.push(result.current.fetch(toggle, 5));
        });
        expect(result.current.tog).toEqual({ id: 5, visible: false });

        jest.advanceTimersByTime(2001);
        await act(async () => {
          await Promise.all(promises);
        });
        // now 3 of these should have resolved
        // we validate

        // after resolution this should not change the result
        expect(result.current.tog).toEqual({ id: 5, visible: false });

        await act(async () => {
          await Promise.all(promises2);
        });

        expect(result.current.tog).toEqual({ id: 5, visible: false });
      });

      it('toggle should handle when response is missing', async () => {
        jest.useFakeTimers({ legacyFakeTimers: false });

        // keeping state here allows the requests to flip flop each time
        let visible = false;
        mynock.get('/toggle/5').reply(200, () => {
          return { id: 5, visible };
        });
        mynock
          .persist()
          .post('/toggle/5')
          .reply(200, () => {
            visible = visible ? false : true;
            return { id: 5, visible };
          });

        const { result, waitForNextUpdate } = renderRestHook(() => {
          const { fetch, getError } = useController();
          const tog = useCache(getbool, 5);
          const state = useContext(StateContext);
          const toggleError = getError(toggle, 5, state);
          return { fetch, tog, toggleError };
        });

        expect(result.current.tog).toBeUndefined();
        expect(result.current.toggleError).toBeUndefined();

        act(() => {
          result.current.fetch(toggle, 5);
        });
        expect(result.current.tog).toBeUndefined();
        expect(result.current.toggleError).toBeUndefined();
      });

      it('should error when user error happens', async () => {
        jest.useFakeTimers({ legacyFakeTimers: false });

        const toggleError = new Endpoint(
          (id: number): Promise<{ id: number; visible: boolean }> =>
            fetch(`/toggle/${id}`, { method: 'POST' }).then(res => res.json()),
          {
            name: 'toggle',
            schema: Toggle,
            sideEffect: true,
            getOptimisticResponse(snap, id) {
              const getterError = snap.getError(getbool, id);
              if (getterError) throw getterError;
              throw new Error('this should fail');
            },
          },
        );

        // keeping state here allows the requests to flip flop each time
        let visible = false;
        mynock
          .persist()
          .post('/toggle/5')
          .delay(2000)
          .reply(200, () => {
            visible = visible ? false : true;
            return { id: 5, visible };
          });

        const { result } = renderRestHook(
          () => {
            const { fetch, getError } = useController();
            const tog = useCache(getbool, 5);
            const state = useContext(StateContext);
            const fetchError = getError(toggleError, 5, state);
            return { fetch, tog, fetchError };
          },
          {
            results: [
              {
                endpoint: getbool,
                args: [5],
                response: { id: 5, visible },
              },
            ],
          },
        );

        expect(result.current.tog).toBeDefined();
        expect(result.current.fetchError).toBeUndefined();

        act(() => {
          result.current.fetch(toggleError, 5);
        });
        expect(result.current.tog).toBeDefined();
        expect(result.current.fetchError).toBeDefined();
        expect(result.current.fetchError).toMatchSnapshot();
      });

      describe('with timestamps', () => {
        it('should handle out of order server responses', async () => {
          jest.useFakeTimers({ legacyFakeTimers: false });

          const initVis = {
            id: 5,
            visType: 'graph',
            numCols: 0,
            updatedAt: Date.now(),
          };

          const { result } = renderRestHook(
            () => {
              const { fetch } = useController();
              const vis = useCache(VisSettingsResource.get, { id: 5 });
              // @ts-expect-error
              vis.doesnotexist;
              return { fetch, vis };
            },
            {
              results: [
                {
                  endpoint: VisSettingsResource.get,
                  args: [{ id: 5 }],
                  response: initVis,
                },
              ],
            },
          );
          expect(result.current.vis).toEqual(initVis);

          let resolvePartial = (resolution: any) => {};
          let partialPromise: Promise<any>;
          let fetchSpy = jest.spyOn(VisSettingsResource.partialUpdate, 'fetch');
          fetchSpy.mockImplementationOnce(
            () =>
              (partialPromise = new Promise(resolve => {
                resolvePartial = (resolution: any) => {
                  resolve(resolution);
                };
              })),
          );
          jest.advanceTimersByTime(100);
          act(() => {
            result.current.fetch(
              VisSettingsResource.partialUpdate,
              { id: 5 },
              { visType: 'line' },
            );
          });
          expect(result.current.vis?.visType).toEqual('line');

          let resolveIncrement = (resolution: any) => {};
          let incrementPromise: Promise<any>;
          fetchSpy = jest.spyOn(VisSettingsResource.incrementCols, 'fetch');
          fetchSpy.mockImplementationOnce(
            () =>
              (incrementPromise = new Promise(resolve => {
                resolveIncrement = (resolution: any) => {
                  resolve(resolution);
                };
              })),
          );
          jest.advanceTimersByTime(100);
          act(() => {
            result.current.fetch(VisSettingsResource.incrementCols, { id: 5 });
          });
          expect(result.current.vis?.visType).toEqual('line');
          expect(result.current.vis?.numCols).toEqual(1);

          const betweenDate = Date.now();

          let resolveIncrement2 = (resolution: any) => {};
          let incrementPromise2: Promise<any>;

          fetchSpy.mockImplementationOnce(
            () =>
              (incrementPromise2 = new Promise(resolve => {
                resolveIncrement2 = (resolution: any) => {
                  resolve(resolution);
                };
              })),
          );
          jest.advanceTimersByTime(100);
          act(() => {
            result.current.fetch(VisSettingsResource.incrementCols, { id: 5 });
          });
          expect(result.current.vis?.visType).toEqual('line');
          expect(result.current.vis?.numCols).toEqual(2);

          const afterDate = Date.now();

          jest.advanceTimersByTime(100);
          await act(() => {
            resolvePartial({
              id: 5,
              visType: 'line',
              numCols: 5,
              updatedAt: betweenDate,
            });
            return partialPromise;
          });

          expect(result.current.vis?.visType).toEqual('line');
          // the server is not aware of our client's last increment, so we +1 to response
          expect(result.current.vis?.numCols).toEqual(7);

          jest.advanceTimersByTime(100);
          const finalObject = {
            id: 5,
            visType: 'graph',
            numCols: 100,
            updatedAt: afterDate,
          };
          await act(() => {
            resolveIncrement2(finalObject);
            return incrementPromise2;
          });

          expect(result.current.vis).toEqual(finalObject);

          await act(() => {
            resolveIncrement({
              id: 5,
              visType: 'line',
              numCols: 0,
              updatedAt: 0,
            });
            return incrementPromise;
          });
          expect(result.current.vis).toEqual(finalObject);

          fetchSpy.mockClear();
        });
      });
    });
  });
});
