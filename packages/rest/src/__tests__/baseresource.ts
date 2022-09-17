import {
  CoolerArticleResource,
  UserResource,
  UrlArticleResource,
} from '__tests__/new';
import nock from 'nock';
import { schema } from '@rest-hooks/endpoint';

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

describe('BaseResource', () => {
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

  it('should not init Resource itself', () => {
    expect(() => Resource.fromJS({})).toThrow();
  });

  it('should throw with no urlRoot defined', () => {
    class NoUrlResource extends Resource {
      readonly id: string = '';
      pk() {
        return this.id;
      }
    }
    expect(() => NoUrlResource.key).toThrowErrorMatchingInlineSnapshot(`
      "urlRoot is not defined for Resource "NoUrlResource"

        Resources require a 'static urlRoot' or 'static get key()' defined.
        (See https://resthooks.io/docs/api/resource#static-urlroot-string)
      "
    `);
  });

  it('should work with `url` member', () => {
    expect(() => UrlArticleResource.fromJS({})).not.toThrow();
    expect(() => UrlArticleResource.fromJS({ url: 'five' })).not.toThrow();
    const urlArticle = UrlArticleResource.fromJS({ url: 'five' });
    expect(urlArticle.url).toBe('five');
  });

  it('should spread `url` member', () => {
    const entity = UrlArticleResource.fromJS({ url: 'five' });
    const spread = { ...entity };
    expect(spread.url).toBe('five');
    expect(Object.hasOwn(entity, 'url')).toBeTruthy();
  });

  it('should not spread `url` member if not a member', () => {
    const entity = CoolerArticleResource.fromJS({ id: 5, title: 'five' });
    expect(entity.url).toMatchInlineSnapshot(
      `"http://test.com/article-cooler/5"`,
    );
    const spread = { ...entity };
    expect(spread.url).toBeUndefined();
    expect(Object.hasOwn(entity, 'url')).toBeFalsy();
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
      author: UserResource.fromJS({ id: 5 }),
    });
    expect(article.url).toBe('http://test.com/article-cooler/5');
  });

  it('should render url property with non-trailing slash root', () => {
    // Remove trailing slash in url root
    CoolerArticleResource.urlRoot = 'http://test.com/article-cooler';
    const article = CoolerArticleResource.fromJS({
      id: 5,
      title: 'happy',
      author: UserResource.fromJS({ id: 5 }),
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
      author: UserResource.fromJS({ id: 5 }),
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

    it('should GET', async () => {
      const article = await CoolerArticleResource.fetch(
        CoolerArticleResource.url({
          id: payload.id,
        }),
        { method: 'GET' },
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
        CoolerArticleResource.listUrl(),
        { method: 'POST', body: JSON.stringify(payload2) },
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
        CoolerArticleResource.url({ id: '500' }),
        { method: 'PUT', body },
      );
      expect(lastRequest.headers['content-type']).toContain(
        'multipart/form-data',
      );
      expect(article).toMatchObject(payload2);
    });

    it('should DELETE', async () => {
      const res = await CoolerArticleResource.fetch(
        CoolerArticleResource.url({
          id: payload.id,
        }),
        { method: 'DELETE' },
      );
      expect(res).toEqual({});
    });

    it('should PUT', async () => {
      const response = await CoolerArticleResource.fetch(
        CoolerArticleResource.url(payload),
        {
          method: 'PUT',
          body: JSON.stringify(CoolerArticleResource.fromJS(payload)),
        },
      );
      expect(response).toEqual(putResponseBody);
    });

    it('should PATCH', async () => {
      const response = await CoolerArticleResource.fetch(
        CoolerArticleResource.url({ id }),
        {
          method: 'PATCH',
          body: JSON.stringify(patchPayload),
        },
      );
      expect(response).toEqual(patchResponseBody);
    });

    it('should throw if response is not json', async () => {
      let error: any;
      try {
        await CoolerArticleResource.fetch(
          CoolerArticleResource.url({ id: idHtml }),
          { method: 'GET' },
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
        await CoolerArticleResource.fetch(CoolerArticleResource.url({ id }), {
          method: 'GET',
        });
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
        CoolerArticleResource.url({ id: idNoContent }),
        { method: 'GET' },
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
        CoolerArticleResource.url({ id }),
        { method: 'GET' },
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
        CoolerArticleResource.url({ id }),
        { method: 'GET' },
      );
      expect(res).toBe(text);
    });
  });
});
