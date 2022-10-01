import { ArticleResourceWithOtherListUrl } from '__tests__/new';

import applyUpdatersToResults from '../applyUpdatersToResults';

describe('applyUpdatersToResults', () => {
  const results = {
    [ArticleResourceWithOtherListUrl.getList.key({})]: ['1', '2'],
  };

  it('handles a single updater', () => {
    const newResults = applyUpdatersToResults(results, '3', {
      [ArticleResourceWithOtherListUrl.getList.key({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [article, ...(articles || [])],
    });
    expect(newResults).toStrictEqual({
      ...results,
      [ArticleResourceWithOtherListUrl.getList.key({})]: ['3', '1', '2'],
    });
  });

  it('handles multiple updaters sequentially', () => {
    const newResults = applyUpdatersToResults(results, '3', {
      [ArticleResourceWithOtherListUrl.getList.key({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [article, ...(articles || [])],
      [ArticleResourceWithOtherListUrl.otherList.key({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [...(articles || []), article],
    });
    expect(newResults).toStrictEqual({
      ...results,
      [ArticleResourceWithOtherListUrl.getList.key({})]: ['3', '1', '2'],
      [ArticleResourceWithOtherListUrl.otherList.key({})]: ['3'],
    });
  });
});
