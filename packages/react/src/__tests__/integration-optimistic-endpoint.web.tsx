import { CacheProvider } from '@data-client/react';
import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import { Endpoint, Entity } from '@data-client/rest';
import {
  OptimisticArticleResource,
  ArticleResourceWithOtherListUrl,
  FutureArticleResource,
  VisSettingsResource,
  CoolerArticle,
  Article,
  VisSettingsResourceFromMixin,
} from '__tests__/new';
import nock from 'nock';
import { useContext } from 'react';

import { makeRenderDataClient, act } from '../../../test';
import { StateContext } from '../context';
import { useCache, useSuspense } from '../hooks';
import { useError } from '../hooks';
import {
  payload,
  createPayload,
  users,
  nested,
  valuesFixture,
} from '../test-fixtures';

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
  ['CacheProvider', CacheProvider],
  ['ExternalDataProvider', ExternalDataProvider],
] as const)(`%s`, (_, makeProvider) => {
  describe('Optimistic Updates', () => {
    let renderDataClient: ReturnType<typeof makeRenderDataClient>;
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

    beforeEach(() => {
      renderDataClient = makeRenderDataClient(makeProvider);
    });

    it('works with partial update', async () => {
      const params = { id: payload.id };
      mynock.patch('/article-cooler/5').reply(200, {
        ...payload,
        title: 'some other title',
        content: 'real response',
      });

      const { result, controller } = renderDataClient(
        () => {
          const article = useCache(OptimisticArticleResource.get, params);
          // @ts-expect-error
          article.doesnotexist;
          return article;
        },
        {
          initialFixtures: [
            {
              endpoint: OptimisticArticleResource.get,
              args: [params],
              response: payload,
            },
          ],
        },
      );
      expect(result.current).toEqual(CoolerArticle.fromJS(payload));
      let promise: any;
      act(() => {
        promise = controller.fetch(
          OptimisticArticleResource.partialUpdate,
          params,
          {
            content: 'changed',
          },
        );
      });

      expect(result.current).toBeInstanceOf(CoolerArticle);
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          content: 'changed',
        }),
      );
      await act(() => promise);
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      );
    });

    it('partial update does nothing but doesnt crash with no existing data', async () => {
      const params = { id: payload.id };
      mynock.patch('/article-cooler/5').reply(200, {
        ...payload,
        title: 'some other title',
        content: 'real response',
      });

      const { result, controller } = renderDataClient(() => {
        return useCache(OptimisticArticleResource.get, params);
      });
      expect(result.current).toBeUndefined();
      let promise: any;
      act(() => {
        promise = controller.fetch(
          OptimisticArticleResource.partialUpdate,
          params,
          {
            content: 'changed',
          },
        );
      });
      expect(result.current).toBeUndefined();

      await act(() => promise);
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      );
    });

    it('works with update', async () => {
      const params = { id: payload.id };
      mynock.put('/article-cooler/5').reply(200, {
        ...payload,
        title: 'some other title',
        content: 'real response',
      });

      const { result, controller } = renderDataClient(
        () => {
          const article = useCache(OptimisticArticleResource.get, params);
          // @ts-expect-error
          article.doesnotexist;
          return { article };
        },
        {
          initialFixtures: [
            {
              endpoint: OptimisticArticleResource.get,
              args: [params],
              response: payload,
            },
          ],
        },
      );
      expect(result.current.article).toEqual(CoolerArticle.fromJS(payload));
      let promise: any;
      act(() => {
        promise = controller.fetch(OptimisticArticleResource.update, params, {
          ...result.current.article,
          content: 'changed',
        });
      });

      expect(result.current.article).toBeInstanceOf(CoolerArticle);
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          content: 'changed',
        }),
      );
      await act(() => promise);
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      );
    });

    it('works with update using FormData', async () => {
      const params = { id: payload.id };
      mynock.put('/article-cooler/5').reply(200, {
        ...payload,
        title: 'some other title',
        content: 'real response',
      });

      const { result, controller } = renderDataClient(
        () => {
          const article = useCache(OptimisticArticleResource.get, params);
          // @ts-expect-error
          article.doesnotexist;
          return article;
        },
        {
          initialFixtures: [
            {
              endpoint: OptimisticArticleResource.get,
              args: [params],
              response: payload,
            },
          ],
        },
      );
      expect(result.current).toEqual(CoolerArticle.fromJS(payload));
      if (!result.current) throw new Error('no result');
      let promise: any;
      const formPayload = new FormData();
      Object.keys(result.current).forEach(k => {
        if (!result.current || k === 'author' || k === 'tags' || k === 'id')
          return;
        formPayload.set(k, (result.current as any)[k]);
      });
      formPayload.set('content', 'changed');
      act(() => {
        promise = controller.fetch(
          OptimisticArticleResource.update,
          params,
          formPayload,
        );
      });

      expect(result.current).toBeInstanceOf(CoolerArticle);
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          content: 'changed',
        }),
      );
      await act(() => promise);
      expect(result.current).toEqual(
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

      const { result, controller } = renderDataClient(
        () => {
          const articles = useCache(OptimisticArticleResource.getList);
          return { articles };
        },
        {
          initialFixtures: [
            {
              endpoint: OptimisticArticleResource.getList,
              args: [{}],
              response: [payload],
            },
          ],
        },
      );
      expect(result.current.articles).toEqual([CoolerArticle.fromJS(payload)]);
      let promise: any;
      act(() => {
        promise = controller.fetch(OptimisticArticleResource.delete, params);
      });
      expect(result.current.articles).toEqual([]);
      await act(() => promise);
      expect(result.current.articles).toEqual([]);
    });

    it('works with eager creates (legacy)', async () => {
      // legacy creates (non-collection) do not support id inference
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

      const { result, controller } = renderDataClient(
        () => {
          const listA = useCache(ArticleResourceWithOtherListUrl.getList);
          const listB = useCache(ArticleResourceWithOtherListUrl.otherList);
          return { listA, listB };
        },
        {
          initialFixtures: [
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

      let promise: any;
      act(() => {
        promise = controller.fetch(
          ArticleResourceWithOtherListUrl.create,
          body,
        );
      });

      expect(result.current.listA).toEqual([CoolerArticle.fromJS(body)]);
      expect(result.current.listB).toEqual([
        existingItem,
        CoolerArticle.fromJS(body),
      ]);
      await act(() => promise);
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

    it('should update on create (legacy)', async () => {
      const { result, controller, waitForNextUpdate } = renderDataClient(() => {
        const articles = useSuspense(
          FutureArticleResource.getList.extend({ schema: [CoolerArticle] }),
        );
        return { articles };
      });

      await waitForNextUpdate();
      expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3]);

      const createOptimistic = FutureArticleResource.create
        .extend({ schema: CoolerArticle })
        .extend({
          update: newid => ({
            [OptimisticArticleResource.getList.key()]: (
              existing: string[] = [],
            ) => [newid, ...existing],
          }),
          getOptimisticResponse: (snap, body) => ({
            id: Math.random(),
            ...(body as any),
          }),
        });
      act(() => {
        controller.fetch(createOptimistic, {
          id: 1,
          title: 'whatever',
        });
      });
      expect(result.current.articles.map(({ id }) => id)).toEqual([1, 5, 3]);
    });

    it('should update on create', async () => {
      const { result, controller, waitForNextUpdate } = renderDataClient(() => {
        const articles = useSuspense(FutureArticleResource.getList);
        return { articles };
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
        controller.fetch(createOptimistic, {
          id: 1,
          title: 'whatever',
        });
      });
      expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 1]);
    });

    it('should clear only earlier optimistic updates when a promise resolves', async () => {
      jest.useFakeTimers({ legacyFakeTimers: false });
      const params = { id: payload.id };
      const { result, controller } = renderDataClient(
        () => {
          const article = useCache(OptimisticArticleResource.get, params);
          return { article };
        },
        {
          initialFixtures: [
            {
              endpoint: OptimisticArticleResource.get,
              args: [params],
              response: payload,
            },
          ],
        },
      );
      jest.advanceTimersByTime(23);

      const fetches: Promise<any>[] = [];
      const resolves: ((v: any) => void)[] = [];

      // first optimistic
      act(() => {
        fetches.push(
          controller.fetch(
            OptimisticArticleResource.partialUpdate.extend({
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
      jest.advanceTimersByTime(23);

      // second optimistic
      act(() => {
        fetches.push(
          controller.fetch(
            OptimisticArticleResource.partialUpdate.extend({
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
      jest.advanceTimersByTime(23);

      // third optimistic
      act(() => {
        fetches.push(
          controller.fetch(
            OptimisticArticleResource.partialUpdate.extend({
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
      resolves[1]({ ...payload, title: 'second' });
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
      resolves[0]({
        ...payload,
        title: 'first',
        content: 'first',
      });
      await act(() => fetches[0]);
      expect(result.current.article).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'second',
          tags: ['thirdoptimistic'],
        }),
      );
      jest.useRealTimers();
      await renderDataClient.allSettled();
    });

    it('should clear optimistic when server response resolves in order', async () => {
      jest.useFakeTimers({ legacyFakeTimers: false });
      const params = { id: payload.id };
      const { result, controller } = renderDataClient(
        () => {
          return useCache(OptimisticArticleResource.get, params);
        },
        {
          initialFixtures: [
            {
              endpoint: OptimisticArticleResource.get,
              args: [params],
              response: payload,
            },
          ],
        },
      );
      jest.advanceTimersByTime(23);

      const fetches: Promise<any>[] = [];
      const resolves: ((v: any) => void)[] = [];

      // first optimistic
      act(() => {
        fetches.push(
          controller.fetch(
            OptimisticArticleResource.partialUpdate.extend({
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
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'firstoptimistic',
          content: 'firstoptimistic',
        }),
      );
      jest.advanceTimersByTime(23);

      // second optimistic
      act(() => {
        fetches.push(
          controller.fetch(
            OptimisticArticleResource.partialUpdate.extend({
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
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'firstoptimistic',
        }),
      );
      jest.advanceTimersByTime(23);

      // third optimistic
      act(() => {
        fetches.push(
          controller.fetch(
            OptimisticArticleResource.partialUpdate.extend({
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
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'firstoptimistic',
          tags: ['thirdoptimistic'],
        }),
      );
      jest.advanceTimersByTime(23);

      // resolve first request
      resolves[0]({ ...payload, content: 'first' });
      await act(() => fetches[0]);

      // replace optimistic with response
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'first',
          tags: ['thirdoptimistic'],
        }),
      );

      // resolve second request
      resolves[1]({
        ...payload,
        title: 'second',
        content: 'first',
      });
      await act(() => fetches[1]);
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'second',
          content: 'first',
          tags: ['thirdoptimistic'],
        }),
      );

      // resolve third request
      resolves[2]({
        ...payload,
        title: 'second',
        content: 'first',
        tags: ['third'],
      });
      await act(() => fetches[2]);
      expect(result.current).toEqual(
        CoolerArticle.fromJS({
          ...payload,
          title: 'second',
          content: 'first',
          tags: ['third'],
        }),
      );
      jest.useRealTimers();
      await renderDataClient.allSettled();
    });

    describe('race conditions', () => {
      let errorspy: jest.Spied<typeof global.console.error>;
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
            const data = snap.get(Toggle, { id });
            if (!data) throw snap.abort;
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
            .delay(500)
            .reply(200, () => {
              visible = visible ? false : true;
              return { id: 5, visible };
            });

          const { result, controller } = renderDataClient(
            () => {
              const tog = useCache(getbool, 5);
              const err = useError(failToggle, 5);
              // @ts-expect-error
              tog.doesnotexist;
              return { tog, err };
            },
            {
              initialFixtures: [
                {
                  endpoint: getbool,
                  args: [5],
                  response: { id: 5, visible },
                },
              ],
            },
          );
          expect(result.current.tog).toEqual({ id: 5, visible: false });

          let promise: any;
          act(() => {
            promise = controller.fetch(failToggle, 5);
          });
          // nothing should change since this failed
          expect(result.current.tog).toEqual({ id: 5, visible: false });
          expect(result.current.err).toEqual(toThrow);
          renderDataClient.cleanup();
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
          .delay(700)
          .reply(200, () => {
            visible = visible ? false : true;
            return { id: 5, visible };
          });

        const { result, controller } = renderDataClient(
          () => {
            const tog = useCache(getbool, 5);
            // @ts-expect-error
            tog.doesnotexist;
            return { tog };
          },
          {
            initialFixtures: [
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
          promises.push(controller.fetch(toggle, 5));
        });
        jest.runOnlyPendingTimers();
        expect(result.current.tog).toEqual({ id: 5, visible: true });

        act(() => {
          promises.push(controller.fetch(toggle, 5));
        });
        jest.runOnlyPendingTimers();
        expect(result.current.tog).toEqual({ id: 5, visible: false });

        act(() => {
          promises.push(controller.fetch(toggle, 5));
        });
        jest.runOnlyPendingTimers();
        expect(result.current.tog).toEqual({ id: 5, visible: true });

        jest.advanceTimersByTime(300);

        act(() => {
          promises2.push(controller.fetch(toggle, 5));
        });
        jest.runOnlyPendingTimers();
        expect(result.current.tog).toEqual({ id: 5, visible: false });

        jest.advanceTimersByTime(701);
        jest.runOnlyPendingTimers();
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

        renderDataClient.cleanup();
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

        const { result, controller } = renderDataClient(() => {
          const tog = useCache(getbool, 5);
          return { tog };
        });

        expect(result.current.tog).toBeUndefined();
        expect(
          controller.getError(toggle, 5, controller.getState()),
        ).toBeUndefined();

        act(() => {
          controller.fetch(toggle, 5);
        });
        expect(result.current.tog).toBeUndefined();
        expect(
          controller.getError(toggle, 5, controller.getState()),
        ).toBeUndefined();
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

        const { result, controller } = renderDataClient(
          () => {
            const tog = useCache(getbool, 5);
            const state = useContext(StateContext);
            return { tog, state };
          },
          {
            initialFixtures: [
              {
                endpoint: getbool,
                args: [5],
                response: { id: 5, visible },
              },
            ],
          },
        );

        expect(result.current.tog).toBeDefined();
        expect(
          controller.getError(toggleError, 5, result.current.state),
        ).toBeUndefined();

        act(() => {
          controller.fetch(toggleError, 5);
        });
        expect(result.current.tog).toBeDefined();
        expect(
          controller.getError(toggleError, 5, result.current.state),
        ).toBeDefined();
        expect(
          controller.getError(toggleError, 5, result.current.state),
        ).toMatchSnapshot();
      });

      describe('with timestamps', () => {
        beforeEach(() => {
          jest.useFakeTimers({ legacyFakeTimers: false });
        });
        afterEach(() => {
          jest.useRealTimers();
        });
        afterEach;
        it.each([VisSettingsResource, VisSettingsResourceFromMixin])(
          'should handle out of order server responses (%#)',
          async VisResource => {
            const initVis = {
              id: 5,
              visType: 'graph',
              numCols: 0,
              updatedAt: Date.now(),
            };

            const { result, controller } = renderDataClient(
              () => {
                const vis = useCache(VisResource.get, { id: 5 });
                // @ts-expect-error
                vis.doesnotexist;
                return { vis };
              },
              {
                initialFixtures: [
                  {
                    endpoint: VisResource.get,
                    args: [{ id: 5 }],
                    response: initVis,
                  },
                ],
              },
            );
            expect(result.current.vis).toEqual(initVis);

            let resolvePartial = (resolution: any) => {};
            let partialPromise: Promise<any>;
            let fetchSpy = jest.spyOn(VisResource.partialUpdate, 'fetch');
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
              controller.fetch(
                VisResource.partialUpdate,
                { id: 5 },
                { visType: 'line' },
              );
            });
            expect(result.current.vis?.visType).toEqual('line');

            let resolveIncrement = (resolution: any) => {};
            let incrementPromise: Promise<any>;
            fetchSpy = jest.spyOn(VisResource.incrementCols, 'fetch');
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
              controller.fetch(VisResource.incrementCols, { id: 5 });
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
              controller.fetch(VisResource.incrementCols, { id: 5 });
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
            await renderDataClient.allSettled();
          },
        );
      });
    });
  });
});
