import { CoolerArticleResource, UserResource } from '__tests__/new';
import nock from 'nock';
import { schema } from '@rest-hooks/endpoint';
import { normalize } from '@rest-hooks/normalizr';

import Resource from '../Resource';
import BaseResource from '../BaseResource';

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

describe('Resource', () => {
  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('should implement schema.EntityInterface', () => {
    class A extends Resource {
      readonly id: string = '';
      pk() {
        return this.id;
      }
    }
    const a: schema.EntityInterface = A;
  });

  it('should init', () => {
    const author = UserResource.fromJS({ id: 5 });
    const resource = CoolerArticleResource.fromJS({
      id: 5,
      title: 'happy',
      author,
    });
    expect(resource.pk()).toBe('5');
    expect(CoolerArticleResource.pk(resource)).toBe('5');
    expect(resource.title).toBe('happy');
    expect(resource.things).toBe('happy five');
    expect(resource.url).toBe('http://test.com/article-cooler/5');
    expect(resource.author).toBe(author);
    expect(resource.author?.pk()).toBe('5');
  });

  describe('Resource.fetch()', () => {
    const id = 5;
    const payload = {
      id,
      title: 'happy',
      author: UserResource.fromJS({ id: 5 }),
    };

    beforeEach(() => {
      nock(/.*/)
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        })
        .get(`/article-cooler/${payload.id}`)
        .reply(200, payload);
    });

    it('should use getFetchInit if defined (upon fetch)', async () => {
      class FetchResource extends CoolerArticleResource {
        static getFetchInit = jest.fn(a => a);
      }
      const articleDetail = FetchResource.detail();
      expect(articleDetail).toBeDefined();
      expect(FetchResource.getFetchInit.mock.calls.length).toBe(0);

      const article = await articleDetail(payload);
      expect(article).toBeDefined();
      expect(FetchResource.getFetchInit.mock.calls.length).toBeGreaterThan(0);
    });
  });

  it('should build urls with different numbers of args', () => {
    class UserResource extends Resource {
      readonly id: number | undefined = undefined;
      readonly username: string = '';
      readonly email: string = '';
      readonly isAdmin: boolean = false;

      pk() {
        return this.id?.toString();
      }

      static urlRoot = 'http://test.com/users';
    }
    expect(UserResource.create().url({ group: 'big' }, { bob: '100' })).toBe(
      'http://test.com/users?group=big',
    );
    expect(UserResource.create().url({ bob: '100' })).toBe(
      'http://test.com/users',
    );
    expect(
      UserResource.update().url({ id: '100' }, { id: '100', username: 'bob' }),
    ).toBe('http://test.com/users/100');
  });

  describe('nested schema', () => {
    describe('merging', () => {
      const nested = [
        {
          id: 5,
          title: 'hi ho',
          content: 'whatever',
          tags: ['a', 'best', 'react'],
          author: {
            id: 23,
            username: 'bob',
            email: 'bob@bob.com',
          },
        },
        {
          id: 3,
          title: 'the next time',
          content: 'whatever',
          author: {
            id: 23,
            username: 'charles',
          },
        },
      ];
      const { schema } = CoolerArticleResource.listWithUser();
      const normalized = normalize(nested, schema);

      // TODO: fix normalize types so we know this is actuaally multiple things
      const user: any = normalized.entities[UserResource.key]['23'];
      it('should include nested user', () => {
        expect(user).toBeDefined();
      });

      it('should take property of first if not set in second', () => {
        expect(user.email).toBe('bob@bob.com');
      });
      it('should overwrite second properties over first', () => {
        expect(user.username).toBe('charles');
      });

      it('should match snapshot', () => {
        expect(normalized).toMatchSnapshot({ entityMeta: expect.any(Object) });
      });
    });

    it('should throw a custom error if data does not include pk', () => {
      const schema = CoolerArticleResource;
      function normalizeBad() {
        normalize({ content: 'hi' }, schema);
      }
      expect(normalizeBad).toThrowErrorMatchingSnapshot();
    });
  });
});
