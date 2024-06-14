import { CacheProvider } from '@data-client/react';
import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import { TypedArticleResource } from '__tests__/new';
import nock from 'nock';

import { act, makeRenderDataClient } from '../../../test';
import { useController, useSuspense } from '../hooks';
import { payload, createPayload, users, nested } from '../test-fixtures';

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

describe('endpoint types', () => {
  describe.each([
    ['CacheProvider', CacheProvider],
    ['ExternalDataProvider', ExternalDataProvider],
  ] as const)(`%s should enforce defined types`, (_, makeProvider) => {
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
        .get(`/article-cooler/0`)
        .reply(403, {})
        .get(`/article-cooler/666`)
        .reply(200, '')
        .get(`/article-cooler/`)
        .reply(200, nested)
        .post(`/article-cooler/`)
        .reply(200, createPayload)
        .get(`/user/`)
        .reply(200, users)
        .get(/article-cooler\/.*/)
        .reply(404, 'not found')
        .put(`/article-cooler/${payload.id}`)
        .reply(200, (uri, body: any) => ({ ...payload, ...body }))
        .put(/article-cooler\/[^5].*/)
        .reply(404, 'not found');

      mynock = nock(/.*/).defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
    });

    beforeEach(() => {
      renderDataClient = makeRenderDataClient(makeProvider);
    });
    afterEach(() => {
      nock.cleanAll();
    });

    let errorSpy: jest.SpyInstance;
    afterEach(() => {
      errorSpy.mockRestore();
    });
    beforeEach(
      () => (errorSpy = jest.spyOn(console, 'error').mockImplementation()),
    );

    it('should pass with exact params', async () => {
      const { result, waitForNextUpdate } = renderDataClient(() => {
        return useSuspense(TypedArticleResource.get, {
          id: payload.id,
        });
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current.title).toBe(payload.title);
      expect(errorSpy.mock.calls).toEqual([]);
    });

    it('should fail with improperly typed param', async () => {
      const { result, waitForNextUpdate } = renderDataClient(() => {
        // @ts-expect-error
        return useSuspense(TypedArticleResource.get, {
          id: 'abc ' as any as Date,
        });
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.error).toBeDefined();
      expect((result.error as any).status).toBe(404);
    });

    it('should work with everything correct', async () => {
      const { result } = renderDataClient(() => {
        return useController().fetch;
      });
      await act(async () => {
        const a = await result.current(
          TypedArticleResource.update,
          { id: payload.id },
          { title: 'hi' },
        );
      });
      expect(errorSpy.mock.calls).toEqual([]);
    });

    it('types should strictly enforce with parameters that are any', async () => {
      const { result } = renderDataClient(() => {
        return useController().fetch;
      });
      () =>
        result.current(
          TypedArticleResource.anyparam,
          { id: payload.id },
          // @ts-expect-error
          { title: 'hi' },
        );
      () => result.current(TypedArticleResource.anyparam, { id: payload.id });
      expect(errorSpy.mock.calls).toEqual([]);
    });

    it('types should strictly enforce with body that are any', async () => {
      const { result, controller } = renderDataClient(() => {
        return useController().fetch;
      });
      () => TypedArticleResource.anybody({ id: payload.id }, { title: 'hi' });
      () =>
        controller.fetch(
          TypedArticleResource.anybody,
          { id: payload.id },
          {
            title: 'hi',
          },
        );

      () =>
        result.current(
          TypedArticleResource.anybody,
          { id: payload.id },
          {
            title: 'hi',
          },
        );
      // @ts-expect-error
      () => result.current(TypedArticleResource.anybody(), { id: payload.id });
      expect(errorSpy.mock.calls).toEqual([]);
    });

    it('should console.error on invalid payload', async () => {
      const { result } = renderDataClient(() => {
        return useController().fetch;
      });
      await result.current(
        TypedArticleResource.update,
        { id: payload.id },
        // @ts-expect-error
        { title2: 'hi' },
      );
      await result.current(
        TypedArticleResource.update,
        { id: payload.id },
        // @ts-expect-error
        { title: 5 },
      );
      expect(errorSpy.mock.calls).toMatchSnapshot();
    });

    it('should error on invalid params', async () => {
      const { result } = renderDataClient(() => {
        return useController().fetch;
      });

      let caught;
      await act(async () => {
        try {
          await result.current(
            TypedArticleResource.update,
            // @ts-expect-error
            'hi',
            { title: 'hi' },
          );
        } catch (error) {
          caught = error;
        }
      });

      expect(caught).toEqual(expect.any(Error));
    });
  });
});
