import { ArticleResourceWithOtherListUrl } from '../../__tests__/common';
import applyUpdatersToResults from '../applyUpdatersToResults';

describe('applyUpdatersToResults', () => {
  const results = {
    [ArticleResourceWithOtherListUrl.listShape().getFetchKey({})]: ['1', '2'],
  };

  it('returns results if updaters is not defined', () => {
    expect(applyUpdatersToResults(results, '3', undefined)).toStrictEqual(
      results,
    );
  });

  it('handles a single updater', () => {
    const newResults = applyUpdatersToResults(results, '3', {
      [ArticleResourceWithOtherListUrl.listShape().getFetchKey({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [article, ...(articles || [])],
    });
    expect(newResults).toStrictEqual({
      ...results,
      [ArticleResourceWithOtherListUrl.listShape().getFetchKey({})]: [
        '3',
        '1',
        '2',
      ],
    });
  });

  it('handles multiple updaters sequentially', () => {
    const newResults = applyUpdatersToResults(results, '3', {
      [ArticleResourceWithOtherListUrl.listShape().getFetchKey({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [article, ...(articles || [])],
      [ArticleResourceWithOtherListUrl.otherListShape().getFetchKey({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [...(articles || []), article],
    });
    expect(newResults).toStrictEqual({
      ...results,
      [ArticleResourceWithOtherListUrl.listShape().getFetchKey({})]: [
        '3',
        '1',
        '2',
      ],
      [ArticleResourceWithOtherListUrl.otherListShape().getFetchKey({})]: ['3'],
    });
  });
});
