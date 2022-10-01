import {
  CoolerArticleResource,
  ArticleResource,
  PaginatedArticleResource,
  UserResource,
  ArticleResourceWithOtherListUrl,
  ListPaginatedArticle,
  CoolerArticleDetail,
  TypedArticleResource,
  IndexedUserResource,
  UnionResource,
  FutureArticleResource,
  User,
} from '__tests__/new';
import nock from 'nock';
import { act } from '@testing-library/react-hooks';
import { useContext } from 'react';

// relative imports to avoid circular dependency in tsconfig references
import {
  makeRenderRestHook,
  makeCacheProvider,
  makeExternalCacheProvider,
} from '../../../../test';
import { useCache, useSuspense, useController } from '../hooks';
import {
  payload,
  createPayload,
  users,
  nested,
  paginatedFirstPage,
  paginatedSecondPage,
  valuesFixture,
} from '../test-fixtures';
import { StateContext } from '../context';

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

describe('indexes', () => {
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
      .get(`/article-cooler/`)
      .reply(200, nested)
      .get(`/article-cooler/values`)
      .reply(200, valuesFixture)
      .post(`/article-cooler/`)
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
  });

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should resolve parallel useSuspense() request', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      const { fetch } = useController();
      useSuspense(IndexedUserResource.getList);
      return {
        bob: useCache(IndexedUserResource.getIndex, {
          username: 'bob',
        }),
        charlie: useCache(IndexedUserResource.getIndex, {
          username: 'charlie',
        }),
        fetch,
        state: useContext(StateContext),
      };
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    const bob = result.current.bob;
    expect(bob).toBeDefined();
    expect(bob instanceof User).toBe(true);
    expect(bob?.username).toBe('bob');
    expect(bob).toMatchSnapshot();
    expect(result.current.charlie).toBeUndefined();

    const renamed = { ...users[0] };
    renamed.username = 'charlie';
    mynock.get(`/user/23`).reply(200, renamed);
    result.current.fetch(IndexedUserResource.get, { id: '23' });
    await waitForNextUpdate();

    const charlie = result.current.charlie;
    expect(charlie).toBeDefined();
    expect(charlie instanceof User).toBe(true);
    expect(charlie?.username).toBe('charlie');
    expect(charlie).toMatchSnapshot();
    expect(result.current.bob).toBeUndefined();

    // deletes should roll through to indexes
    await act(async () => {
      await result.current.fetch(IndexedUserResource.delete, { id: '23' });
    });
    expect(result.current.charlie).toBeUndefined();
  });
});
