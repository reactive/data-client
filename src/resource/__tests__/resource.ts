import nock from 'nock';

import { CoolerArticleResource } from '../../__tests__/common';

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
  it('should render url property', () => {
    const article = CoolerArticleResource.fromJS({
      id: 5,
      title: 'happy',
      author: 5,
    });
    expect(article.url).toBe('http://test.com/article-cooler/5');
  });
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
  it('should not include __ownerID when converting to JS', () => {
    const json = {...CoolerArticleResource.fromJS({})};
    expect(json).not.toHaveProperty('__ownerID');
  });
  it('should have __ownerID property on lookup', () => {
    const r = CoolerArticleResource.fromJS({});
    expect(r.hasOwnProperty('__ownerID')).toBe(true);
  });

  describe('Resource.fetch()', () => {
    const id = 5;
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
  });
});
