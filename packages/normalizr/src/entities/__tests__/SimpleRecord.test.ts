import { SimpleRecord, denormalize, Entity } from '../..';
import { normalize } from '../../normalize';

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
  static schema = {
    data: ArticleEntity,
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
  });
});
