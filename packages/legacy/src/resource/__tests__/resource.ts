import {
  CoolerArticleResource,
  UserResource,
  UrlArticleResource,
} from '__tests__/legacy';
import nock from 'nock';
import { normalize } from '@rest-hooks/normalizr';
import { schema } from '@rest-hooks/endpoint';

import Resource from '../Resource';
import SimpleResource from '../SimpleResource';

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
    const resource = CoolerArticleResource.fromJS({
      id: 5,
      title: 'happy',
      author: 5,
    });
    expect(resource.pk()).toBe('5');
    expect(CoolerArticleResource.pk(resource)).toBe('5');
    expect(resource.title).toBe('happy');
    expect(resource.things).toBe('happy five');
    expect(resource.url).toBe('http://test.com/article-cooler/5');
    expect(resource.author).toBe(5);
  });

  it('should not init Resource itself', () => {
    expect(() => Resource.fromJS({})).toThrow();
  });

  it('should work with `url` member', () => {
    expect(() => UrlArticleResource.fromJS({})).not.toThrow();
    expect(() => UrlArticleResource.fromJS({ url: 'five' })).not.toThrow();
    const urlArticle = UrlArticleResource.fromJS({ url: 'five' });
    expect(urlArticle.url).toBe('five');
  });

  it('should convert class to string', () => {
    expect(CoolerArticleResource.toString()).toBeDefined();
    expect(CoolerArticleResource.toString()).toMatchInlineSnapshot(
      `"CoolerArticleResource::http://test.com/article-cooler/"`,
    );
  });

  it('should render url property', () => {
    const article = CoolerArticleResource.fromJS({
      id: 5,
      title: 'happy',
      author: 5,
    });
    expect(article.url).toBe('http://test.com/article-cooler/5');
  });

  it('should render url property with non-trailing slash root', () => {
    // Remove trailing slash in url root
    CoolerArticleResource.urlRoot = 'http://test.com/article-cooler';
    const article = CoolerArticleResource.fromJS({
      id: 5,
      title: 'happy',
      author: 5,
    });
    expect(article.url).toBe('http://test.com/article-cooler/5');
    // Reset for future tests
    CoolerArticleResource.urlRoot = 'http://test.com/article-cooler/';
  });

  const [coolA, coolB, coolC] = [
    CoolerArticleResource.fromJS({ title: 'great' }),
    CoolerArticleResource.fromJS({ id: 5 }),
    CoolerArticleResource.fromJS({}),
  ];

  describe('merge()', () => {
    const c = CoolerArticleResource.merge(coolA, coolB);
    it('works with partial', () => {
      expect(c.things).toBeDefined();
      expect(c.id).toBe(5);
      expect(c.content).toBe('');
      expect(c.title).toBe('great');
      expect(c).toMatchInlineSnapshot(`
        CoolerArticleResource {
          "author": null,
          "content": "",
          "id": 5,
          "tags": [],
          "title": "great",
        }
      `);
    });
    it('works with definedObjects()', () => {
      expect(c).toMatchInlineSnapshot(`
        CoolerArticleResource {
          "author": null,
          "content": "",
          "id": 5,
          "tags": [],
          "title": "great",
        }
      `);
    });
    it('does nothing with empty arg', () => {
      expect(CoolerArticleResource.merge(c, coolC)).toEqual(c);
    });
  });

  describe('hasDefined()', () => {
    it('works ', () => {
      expect(CoolerArticleResource.hasDefined(coolA, 'title')).toBe(true);
      expect(CoolerArticleResource.hasDefined(coolA, 'author')).toBe(false);
    });
  });

  describe('toObjectDefined()', () => {
    it('works', () => {
      expect(CoolerArticleResource.toObjectDefined(coolA))
        .toMatchInlineSnapshot(`
        {
          "title": "great",
        }
      `);
      expect(CoolerArticleResource.toObjectDefined(coolB))
        .toMatchInlineSnapshot(`
        {
          "id": 5,
        }
      `);
    });
  });

  describe('keysDefined()', () => {
    it('works', () => {
      expect(CoolerArticleResource.keysDefined(coolA)).toMatchInlineSnapshot(`
        [
          "title",
        ]
      `);
      expect(CoolerArticleResource.keysDefined(coolB)).toMatchInlineSnapshot(`
        [
          "id",
        ]
      `);
    });
  });

  describe('listUrl', () => {
    it('should listUrl with an arg', () => {
      expect(CoolerArticleResource.listUrl({ author: 5 })).toBe(
        'http://test.com/article-cooler/?author=5',
      );
    });
    it('should listUrl with no args', () => {
      expect(CoolerArticleResource.listUrl({})).toBe(
        'http://test.com/article-cooler/',
      );
    });
    it('should sort consistently', () => {
      expect(
        CoolerArticleResource.listUrl({
          z: 'alpha',
          y: 'beta',
          m: 'never',
          a: 'sometimes',
          c: 'again',
        }),
      ).toBe(
        'http://test.com/article-cooler/?a=sometimes&c=again&m=never&y=beta&z=alpha',
      );
    });
  });

  describe('static url', () => {
    it('should use provided url parameter as value', () => {
      const url = 'this is the url';
      expect(UserResource.url({ url })).toBe(url);
    });
    it('should return root if cannot find params with url', () => {
      expect(UserResource.url({})).toMatchInlineSnapshot(
        `"http://test.com/user/"`,
      );
    });
  });

  describe('Resource.fetch()', () => {
    const id = 5;
    const idHtml = 6;
    const idNoContent = 7;
    const payload = {
      id,
      title: 'happy',
      author: 5,
    };
    const putResponseBody = {
      id,
      title: 'happy',
      completed: true,
    };
    const patchPayload = {
      title: 'happy',
    };
    const patchResponseBody = {
      id,
      title: 'happy',
      completed: false,
    };

    beforeEach(() => {
      nock(/.*/)
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        })
        .get(`/article-cooler/${payload.id}`)
        .reply(200, payload)
        .get(`/article-cooler/${idHtml}`)
        .reply(200, '<body>this is html</body>')
        .get(`/article-cooler/${idNoContent}`)
        .reply(204, '')
        .post('/article-cooler/')
        .reply((uri, requestBody) => [
          201,
          requestBody,
          { 'content-type': 'application/json' },
        ])
        .put('/article-cooler/5')
        .reply((uri, requestBody) => {
          let body = requestBody as any;
          if (typeof requestBody === 'string') {
            body = JSON.parse(requestBody);
          }
          for (const key of Object.keys(CoolerArticleResource.fromJS({}))) {
            if (key !== 'id' && !(key in body)) {
              return [400, {}, { 'content-type': 'application/json' }];
            }
          }
          return [200, putResponseBody, { 'content-type': 'application/json' }];
        })
        .patch('/article-cooler/5')
        .reply(() => [
          200,
          patchResponseBody,
          { 'content-type': 'application/json' },
        ])
        .intercept('/article-cooler/5', 'DELETE')
        .reply(200, {});
    });

    it('should throw with SimpleResource', () => {
      expect(() =>
        SimpleResource.fetch(
          'get',
          CoolerArticleResource.url({
            id: payload.id,
          }),
        ),
      ).toThrow();
    });

    it('fetchResponse() should throw with SimpleResource', () => {
      expect(() =>
        SimpleResource.fetchResponse(
          'get',
          CoolerArticleResource.url({
            id: payload.id,
          }),
        ),
      ).toThrow();
    });

    it('should GET', async () => {
      const article = await CoolerArticleResource.fetch(
        'get',
        CoolerArticleResource.url({
          id: payload.id,
        }),
      );
      expect(article).toBeDefined();
      if (!article) {
        throw new Error('ahh');
      }
      expect(article.title).toBe(payload.title);
    });

    it('should POST', async () => {
      const payload2 = { id: 20, content: 'better task' };
      const article = await CoolerArticleResource.fetch(
        'post',
        CoolerArticleResource.listUrl(),
        JSON.stringify(payload2),
      );
      expect(article).toMatchObject(payload2);
    });

    it('should PUT with multipart form data', async () => {
      const payload2 = { id: 500, content: 'another' };
      let lastRequest: any;
      nock(/.*/)
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
        })
        .put('/article-cooler/500')
        .reply(function (uri, requestBody) {
          lastRequest = this.req;
          return [201, payload2, { 'Content-Type': 'application/json' }];
        });
      const newPhoto = new Blob();
      const body = new FormData();
      body.append('photo', newPhoto);

      const article = await CoolerArticleResource.fetch(
        'put',
        CoolerArticleResource.url({ id: '500' }),
        body,
      );
      expect(lastRequest.headers['content-type']).toContain(
        'multipart/form-data',
      );
      expect(article).toMatchObject(payload2);
    });

    it('should DELETE', async () => {
      const res = await CoolerArticleResource.fetch(
        'delete',
        CoolerArticleResource.url({
          id: payload.id,
        }),
      );
      expect(res).toEqual({});
    });

    it('should PUT', async () => {
      const response = await CoolerArticleResource.fetch(
        'put',
        CoolerArticleResource.url(payload),
        { ...CoolerArticleResource.fromJS(payload) },
      );
      expect(response).toEqual(putResponseBody);
    });

    it('should PATCH', async () => {
      const response = await CoolerArticleResource.fetch(
        'patch',
        CoolerArticleResource.url({ id }),
        JSON.stringify(patchPayload),
      );
      expect(response).toEqual(patchResponseBody);
    });

    it('should throw if response is not json', async () => {
      let error: any;
      try {
        await CoolerArticleResource.fetch(
          'get',
          CoolerArticleResource.url({ id: idHtml }),
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      // This is very weird, but we're forced to use node-fetch for react native
      // node-fetch doesn't handle errors consistently with normal fetch implementations, so this won't work
      // react-native itself should match this correctly however.
      if (typeof window !== 'undefined') expect(error.status).toBe(400);
    });

    it('should throw if network is down', async () => {
      const oldError = console.error;
      console.error = () => {};

      const id = 10;
      nock(/.*/)
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        })
        .get(`/article-cooler/${id}`)
        .replyWithError(new TypeError('Network Down'));

      let error: any;
      try {
        await CoolerArticleResource.fetch(
          'get',
          CoolerArticleResource.url({ id }),
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.status).toBe(400);

      // eslint-disable-next-line require-atomic-updates
      console.error = oldError;
    });

    it('should return raw response if status is 204 No Content', async () => {
      const res = await CoolerArticleResource.fetch(
        'get',
        CoolerArticleResource.url({ id: idNoContent }),
      );
      expect(res).toBe('');
    });

    it('should return text if content-type is not json', async () => {
      const id = 8;
      const text = '<body>this is html</body>';
      nock(/.*/)
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        })
        .get(`/article-cooler/${id}`)
        .reply(200, text, { 'content-type': 'html/text' });

      const res = await CoolerArticleResource.fetch(
        'get',
        CoolerArticleResource.url({ id }),
      );
      expect(res).toBe('<body>this is html</body>');
    });

    it('should return text if content-type does not exist', async () => {
      const id = 10;
      const text = '<body>this is html</body>';
      nock(/.*/)
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
        })
        .get(`/article-cooler/${id}`)
        .reply(200, text, {});

      const res = await CoolerArticleResource.fetch(
        'get',
        CoolerArticleResource.url({ id }),
      );
      expect(res).toBe(text);
    });
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
      const { schema } = CoolerArticleResource.listWithUserRequest();
      const normalized = normalize(nested, schema);

      // TODO: fix normalize types so we know this is actuaally multiple things
      const user: any = normalized.entities[UserResource.key]['23'];
      it('should include nested user', () => {
        expect(user).toBeDefined();
      });
      it('should have user be UserResource type', () => {
        expect(user).toBeInstanceOf(UserResource);
      });
      it('should take property of first if not set in second', () => {
        expect(user.email).toBe('bob@bob.com');
      });
      it('should overwrite second properties over first', () => {
        expect(user.username).toBe('charles');
      });
      it('should use default for unset propreties', () => {
        expect(UserResource.hasDefined(user, 'isAdmin')).toBe(false);
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
