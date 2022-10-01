import { denormalize, normalize, DELETED } from '@rest-hooks/normalizr';

import { Entity, SimpleRecord } from '..';

let dateSpy: jest.SpyInstance;
beforeAll(() => {
  dateSpy = jest
    // eslint-disable-next-line no-undef
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

class Article extends SimpleRecord {
  readonly id: string = '';
  readonly title: string = '';
  readonly author: string = '';
  readonly content: string = '';
}
class ArticleEntity extends Entity {
  readonly id: string = '';
  readonly title: string = '';
  readonly author: string = '';
  readonly content: string = '';
  pk() {
    return this.id;
  }
}

class Pagination extends SimpleRecord {
  readonly data = ArticleEntity.fromJS();
  readonly nextPage: string = '';
  readonly lastPage: string = '';

  get title() {
    return this.data.title;
  }

  static schema = {
    data: ArticleEntity,
  };
}

class WithOptional extends SimpleRecord {
  readonly article: ArticleEntity | null = null;
  readonly requiredArticle = ArticleEntity.fromJS();
  readonly nextPage = '';
  readonly createdAt: Date | null = null;

  static schema = {
    article: ArticleEntity,
    requiredArticle: ArticleEntity,
    createdAt: Date,
  };
}

describe('SimpleRecord', () => {
  it('should init', () => {
    const resource = Article.fromJS({
      id: '5',
      title: 'happy',
      author: '5',
    });
    expect(resource.title).toBe('happy');
    expect(resource.author).toBe('5');
  });

  it('should not allow init with wrong types', () => {
    Article.fromJS({
      // @ts-expect-error
      id: 5,
      title: 'happy',
      // @ts-expect-error
      author: 5,
    });
  });

  describe('normalize', () => {
    it('should normalize into plain object', () => {
      const schema = Article;
      const normalized = normalize(
        {
          id: '5',
          title: 'happy',
          author: '5',
        },
        schema,
      );
      expect(normalized.result).toEqual({
        id: '5',
        title: 'happy',
        author: '5',
      });
    });

    it('should work on nested', () => {
      const schema = Pagination;
      const normalized = normalize(
        {
          data: {
            id: '5',
            title: 'happy',
            author: '5',
          },
          lastPage: 'abc',
          nextPage: 'slksfd',
        },
        schema,
      );
      expect(normalized).toMatchSnapshot();
    });

    it('should deserialize Date', () => {
      const normalized = normalize(
        {
          requiredArticle: { id: '5' },
          nextPage: 'blob',
          createdAt: '2020-06-07T02:00:15.000Z',
        },
        WithOptional,
      );
      expect(normalized.result.createdAt.getTime()).toBe(
        normalized.result.createdAt.getTime(),
      );
      expect(normalized).toMatchSnapshot();
    });

    it('should use default when Date not provided', () => {
      const normalized = normalize(
        {
          requiredArticle: { id: '5' },
          nextPage: 'blob',
        },
        WithOptional,
      );
      expect(normalized.result.createdAt).toBeUndefined();
      expect(normalized).toMatchSnapshot();
    });
  });

  describe('denormalize', () => {
    it('should denormalize with defaults', () => {
      const schema = Article;
      const denormalized = denormalize(
        {
          id: '5',
          title: 'happy',
          author: '5',
        },
        schema,
        {},
      );
      const article = denormalized[0];
      expect(article).toBeDefined();
      expect(article).toBeInstanceOf(Article);
      expect(article).toEqual({
        id: '5',
        title: 'happy',
        author: '5',
        content: '',
      });
      // typing of members that it has
      article?.content;
      article?.author;
      // @ts-expect-error - fails when it doesn't
      article?.bob;
    });

    it('should work with nested and default correctly', () => {
      const schema = Pagination;
      const denormalized = denormalize(
        {
          data: '5',
          nextPage: 'blob',
        },
        schema,
        {
          [ArticleEntity.key]: {
            ['5']: {
              id: '5',
              title: 'happy',
              author: '5',
            },
          },
        },
      );
      expect(denormalized[1]).toBe(true);
      const pagination = denormalized[0];
      expect(pagination).toBeDefined();
      expect(pagination).toBeInstanceOf(Pagination);
      expect(pagination).toEqual({
        data: {
          id: '5',
          title: 'happy',
          author: '5',
          content: '',
        },
        nextPage: 'blob',
        lastPage: '',
      });
      // check getters
      expect(pagination.title).toBe('happy');
      // typing of members that it has
      pagination.data?.content;
      pagination.data?.title;
      // @ts-expect-error - fails when it doesn't have member
      pagination?.bob;
    });
  });

  it('should have undefined member when entity is not found', () => {
    const schema = Pagination;
    const denormalized = denormalize(
      {
        data: '5',
        nextPage: 'blob',
      },
      schema,
      {},
    );
    expect(denormalized[1]).toBe(false);
    const pagination = denormalized[0];
    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Pagination);
    expect(pagination).toEqual({
      data: undefined,
      nextPage: 'blob',
      lastPage: '',
    });
  });

  describe('optional entities', () => {
    it('should be marked as found even when optional is not there', () => {
      const denormalized = denormalize(
        {
          requiredArticle: '5',
          nextPage: 'blob',
          createdAt: new Date('2020-06-07T02:00:15+0000'),
        },
        WithOptional,
        {
          [ArticleEntity.key]: {
            5: ArticleEntity.fromJS({ id: '5' }),
          },
        },
      );
      expect(denormalized[1]).toBe(true);
      const response = denormalized[0];
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(WithOptional);
      expect(response).toEqual({
        article: null,
        requiredArticle: ArticleEntity.fromJS({ id: '5' }),
        nextPage: 'blob',
        createdAt: new Date('2020-06-07T02:00:15+0000'),
      });
      // @ts-expect-error
      response.createdAt.toISOString();
      expect(response.createdAt?.toISOString()).toBe(
        '2020-06-07T02:00:15.000Z',
      );
    });

    it('should be marked as not found when required entity is missing', () => {
      const denormalized = denormalize(
        {
          article: '5',
          nextPage: 'blob',
        },
        WithOptional,
        {
          [ArticleEntity.key]: {
            5: ArticleEntity.fromJS({ id: '5' }),
          },
        },
      );
      expect(denormalized[1]).toBe(false);
      expect(denormalized[2]).toBe(false);
      const response = denormalized[0];
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(WithOptional);
      expect(response).toEqual({
        article: ArticleEntity.fromJS({ id: '5' }),
        requiredArticle: ArticleEntity.fromJS(),
        nextPage: 'blob',
        createdAt: null,
      });
      expect(response.createdAt).toBeNull();
    });

    it('should be marked as deleted when required entity is deleted symbol', () => {
      const denormalized = denormalize(
        {
          article: '5',
          requiredArticle: '6',
          nextPage: 'blob',
        },
        WithOptional,
        {
          [ArticleEntity.key]: {
            5: ArticleEntity.fromJS({ id: '5' }),
            6: DELETED,
          },
        },
      );
      expect(denormalized[1]).toBe(true);
      expect(denormalized[2]).toBe(true);
      const response = denormalized[0];
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(WithOptional);
      expect(response).toEqual({
        article: ArticleEntity.fromJS({ id: '5' }),
        requiredArticle: undefined,
        nextPage: 'blob',
        createdAt: null,
      });
      expect(response.createdAt).toBeNull();
    });
  });
});
