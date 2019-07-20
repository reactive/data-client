import nock from 'nock';

import {
  CoolerArticleResource,
  UserResource,
  UrlArticleResource,
} from '../../__tests__/common';
import { Resource, normalize } from '..';

describe('Resource', () => {
  it('should init', () => {
    const resource = CoolerArticleResource.fromJS({
      id: 5,
      title: 'happy',
      author: 5,
    });
    expect(resource.pk()).toBe(5);
    expect(CoolerArticleResource.pk(resource)).toBe(5);
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
          "tags": Array [],
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
          "tags": Array [],
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
        Object {
          "title": "great",
        }
      `);
      expect(CoolerArticleResource.toObjectDefined(coolB))
        .toMatchInlineSnapshot(`
        Object {
          "id": 5,
        }
      `);
    });
  });
  describe('keysDefined()', () => {
    it('works', () => {
      expect(CoolerArticleResource.keysDefined(coolA)).toMatchInlineSnapshot(`
        Array [
          "title",
        ]
      `);
      expect(CoolerArticleResource.keysDefined(coolB)).toMatchInlineSnapshot(`
        Array [
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
  it('should not include __ownerID when converting to JS', () => {
    const json = { ...CoolerArticleResource.fromJS({}) };
    expect(json).not.toHaveProperty('__ownerID');
  });
  it('should have __ownerID property on lookup', () => {
    const r = CoolerArticleResource.fromJS({});
    expect(r.hasOwnProperty('__ownerID')).toBe(true);
  });

  describe('static url', () => {
    it('should use provided url parameter as value', () => {
      const url = 'this is the url';
      expect(UserResource.url({ url })).toBe(url);
    });
  });

  describe('Resource.fetch()', () => {
    const id = 5;
    const idHtml = 6;
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
      nock('http://test.com')
        .get(`/article-cooler/${payload.id}`)
        .reply(200, payload);
      nock('http://test.com')
        .get(`/article-cooler/${idHtml}`)
        .reply(200, '<body>this is html</body>');

      nock('http://test.com')
        .post('/article-cooler/')
        .reply((uri, requestBody) => [
          201,
          requestBody,
          { 'content-type': 'application/json' },
        ]);
      nock('http://test.com')
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
        });
      nock('http://test.com')
        .patch('/article-cooler/5')
        .reply(() => [
          200,
          patchResponseBody,
          { 'content-type': 'application/json' },
        ]);
      nock('http://test.com')
        .intercept('/article-cooler/5', 'DELETE')
        .reply(200, {});
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
        CoolerArticleResource.url(),
        payload2,
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
        CoolerArticleResource.fromJS(payload),
      );

      expect(response).toEqual(putResponseBody);
    });
    it('should PATCH', async () => {
      const response = await CoolerArticleResource.fetch(
        'patch',
        CoolerArticleResource.url({ id }),
        patchPayload,
      );

      expect(response).toEqual(patchResponseBody);
    });

    it('should throw if response is not json', async () => {
      await expect(
        CoolerArticleResource.fetch(
          'get',
          CoolerArticleResource.url({ id: idHtml }),
        ),
      ).rejects.toMatchSnapshot();
    });

    it('should use fetchPlugin if defined', async () => {
      class FetchResource extends CoolerArticleResource {
        static fetchPlugin = jest.fn(a => a);
      }
      const article = await FetchResource.fetch(
        'get',
        FetchResource.url({
          id: payload.id,
        }),
      );
      expect(article).toBeDefined();
      expect(FetchResource.fetchPlugin.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('getEntitySchema()', () => {
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
      const user: any = normalized.entities[UserResource.getKey()]['23'];
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
        expect(normalized).toMatchSnapshot();
      });
    });

    it('should throw a custom error if data does not include pk', () => {
      const schema = CoolerArticleResource.getEntitySchema();
      function normalizeBad() {
        normalize({}, schema);
      }
      expect(normalizeBad).toThrowErrorMatchingInlineSnapshot(`
"Missing usable resource key when normalizing response.

This is likely due to a malformed response.
Try inspecting the network response or fetch() return value.
"
`);
    });
  });
});
