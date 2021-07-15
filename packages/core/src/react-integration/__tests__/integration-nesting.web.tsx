import { CoauthoredArticleResource, UserResource } from '__tests__/new';
import nock from 'nock';
import { act } from '@testing-library/react-hooks';

import {
  makeRenderRestHook,
  makeCacheProvider,
  makeExternalCacheProvider,
} from '../../../../test';
import { useResource, useFetcher, useCache } from '../hooks';
import { coAuthored } from '../test-fixtures';

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

for (const makeProvider of [makeCacheProvider, makeExternalCacheProvider]) {
  describe(`${makeProvider.name} => <Provider />`, () => {
    // TODO: add nested resource test case that has multiple partials to test merge functionality

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
        .get(`/article-cooler/${coAuthored.id}`)
        .reply(200, coAuthored)
        .delete(`/article-cooler/${coAuthored.id}`)
        .reply(204, '')
        .delete(`/user/51`)
        .reply(204, '')
        .put(`/user/42`)
        .reply(200, (uri, body: any) => ({ id: 42, ...body }));

      mynock = nock(/.*/).defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    beforeEach(() => {
      renderRestHook = makeRenderRestHook(makeProvider);
    });

    it('should update nested lists inside entities', async () => {
      const expectedUser = coAuthored.coAuthors[0];
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return {
          article: useResource(
            CoauthoredArticleResource.detail(),
            coAuthored.id,
          ),
          user: useCache(UserResource.detail(), { id: 42 }),
          updateUser: useFetcher(UserResource.update()),
          deleteUser: useFetcher(UserResource.delete()),
        };
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current.article instanceof CoauthoredArticleResource).toBe(
        true,
      );
      expect(result.current.article.title).toBe(coAuthored.title);
      expect(result.current.article.coAuthors.length).toBe(2);
      expect(result.current.article.coAuthors[0].email).toBe(
        expectedUser.email,
      );
      // now check updates
      await act(async () => {
        await result.current.updateUser(
          { id: expectedUser.id },
          {
            id: 42,
            username: 'charles',
            email: 'new-email@gmail.com',
          },
        );
      });
      expect(result.current.article.coAuthors[0].email).toBe(
        'new-email@gmail.com',
      );
      // global referntial equality maintained
      expect(result.current.article.coAuthors[0]).toBe(result.current.user);
      // now check deletes
      await act(async () => {
        await result.current.deleteUser({ id: 51 });
      });
      expect(result.current.article.coAuthors.length).toBe(1);
    });
  });
}
