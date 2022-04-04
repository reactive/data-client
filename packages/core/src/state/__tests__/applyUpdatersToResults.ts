import { ArticleResourceWithOtherListUrl } from '__tests__/common';

import applyUpdatersToResults from '../applyUpdatersToResults';

describe('applyUpdatersToResults', () => {
  const results = {
    [ArticleResourceWithOtherListUrl.list().key({})]: ['1', '2'],
  };

  it('handles a single updater', () => {
    const newResults = applyUpdatersToResults(results, '3', {
      [ArticleResourceWithOtherListUrl.list().key({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [article, ...(articles || [])],
    });
    expect(newResults).toStrictEqual({
      ...results,
      [ArticleResourceWithOtherListUrl.list().key({})]: ['3', '1', '2'],
    });
  });

  it('handles multiple updaters sequentially', () => {
    const newResults = applyUpdatersToResults(results, '3', {
      [ArticleResourceWithOtherListUrl.list().key({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [article, ...(articles || [])],
      [ArticleResourceWithOtherListUrl.otherList().key({})]: (
        article: string,
        articles: string[] | undefined,
      ) => [...(articles || []), article],
    });
    expect(newResults).toStrictEqual({
      ...results,
      [ArticleResourceWithOtherListUrl.list().key({})]: ['3', '1', '2'],
      [ArticleResourceWithOtherListUrl.otherList().key({})]: ['3'],
    });
  });
});
