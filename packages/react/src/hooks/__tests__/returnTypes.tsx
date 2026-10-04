import type { ErrorTypes } from '@data-client/core';
import { Endpoint } from '@data-client/endpoint';
import { CoolerArticle, CoolerArticleResource } from '__tests__/new';

import useDLE from '../useDLE';
import useLive from '../useLive';
import useSuspense from '../useSuspense';

// Compile-time only: these hooks' implementation signatures aren't visible to
// callers, so pin every public overload here. The closures are never invoked.

type IsAny<T> = 0 extends 1 & T ? true : false;
function notAny<T>(value: T, ..._: IsAny<T> extends true ? [never] : []) {
  return value;
}

const getPlain = new Endpoint(async (id: number) => ({ id, name: 'plain' }));
type Plain = { id: number; name: string };

describe('hook return types', () => {
  it('useSuspense()', () => {
    () => {
      const article = notAny(useSuspense(CoolerArticleResource.get, { id: 5 }));
      article satisfies CoolerArticle;
      // @ts-expect-error not undefined with non-null args
      article satisfies undefined;

      const maybeArticle = useSuspense(CoolerArticleResource.get, null);
      maybeArticle satisfies CoolerArticle | undefined;
      // @ts-expect-error may be undefined with null args
      maybeArticle.title;

      const plain = notAny(useSuspense(getPlain, 5));
      plain satisfies Plain;
      // @ts-expect-error not undefined with non-null args
      plain satisfies undefined;

      const maybePlain = useSuspense(getPlain, null);
      maybePlain satisfies Plain | undefined;
      // @ts-expect-error may be undefined with null args
      maybePlain.name;
    };
  });

  it('useLive()', () => {
    () => {
      const article = notAny(useLive(CoolerArticleResource.get, { id: 5 }));
      article satisfies CoolerArticle;
      // @ts-expect-error not undefined with non-null args
      article satisfies undefined;

      const maybeArticle = useLive(CoolerArticleResource.get, null);
      maybeArticle satisfies CoolerArticle | undefined;
      // @ts-expect-error may be undefined with null args
      maybeArticle.title;

      const plain = notAny(useLive(getPlain, 5));
      plain satisfies Plain;

      const maybePlain = useLive(getPlain, null);
      // @ts-expect-error may be undefined with null args
      maybePlain.name;
    };
  });

  it('useDLE()', () => {
    () => {
      const article = useDLE(CoolerArticleResource.get, { id: 5 });
      notAny(article.data);
      article.loading satisfies boolean;
      article.error satisfies ErrorTypes | undefined;
      // @ts-expect-error data may be undefined until resolved
      article.data.title;
      if (!article.loading && !article.error) {
        article.data satisfies CoolerArticle;
      }
      if (article.loading) {
        article.error satisfies undefined;
      }

      const plain = useDLE(getPlain, 5);
      notAny(plain.data);
      if (plain.loading) {
        plain.data satisfies undefined;
      } else if (!plain.error) {
        plain.data satisfies Plain;
      } else {
        plain.error satisfies ErrorTypes;
        plain.data satisfies undefined;
      }

      const maybeArticle = useDLE(CoolerArticleResource.get, null);
      notAny(maybeArticle.data);
      maybeArticle.loading satisfies boolean;
      maybeArticle.error satisfies ErrorTypes | undefined;
      if (!maybeArticle.loading && !maybeArticle.error) {
        // @ts-expect-error may be undefined with null args
        maybeArticle.data.title;
      }
    };
  });
});
