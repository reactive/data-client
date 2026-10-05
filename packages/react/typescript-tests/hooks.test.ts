import type { ErrorTypes } from '@data-client/core';
import { Endpoint } from '@data-client/endpoint';
import { CoolerArticle, CoolerArticleResource } from '__tests__/new';

import useDLE from '../src/hooks/useDLE';
import useLive from '../src/hooks/useLive';
import useSuspense from '../src/hooks/useSuspense';

// Compile-time only (checked by tsconfig.test.json, not run by jest): these
// hooks' implementation signatures aren't visible to callers, so pin every
// public overload here. Each @ts-expect-error also guards against `any`: an
// `any` result would compile, failing the directive as unused.

const getPlain = new Endpoint(async (id: number) => ({ id, name: 'plain' }));
type Plain = { id: number; name: string };

// useSuspense()
() => {
  const article = useSuspense(CoolerArticleResource.get, { id: 5 });
  article satisfies CoolerArticle;
  // @ts-expect-error not undefined with non-null args
  article satisfies undefined;

  const maybeArticle = useSuspense(CoolerArticleResource.get, null);
  maybeArticle satisfies CoolerArticle | undefined;
  // @ts-expect-error may be undefined with null args
  maybeArticle.title;

  const plain = useSuspense(getPlain, 5);
  plain satisfies Plain;
  // @ts-expect-error not undefined with non-null args
  plain satisfies undefined;

  const maybePlain = useSuspense(getPlain, null);
  maybePlain satisfies Plain | undefined;
  // @ts-expect-error may be undefined with null args
  maybePlain.name;
};

// useLive()
() => {
  const article = useLive(CoolerArticleResource.get, { id: 5 });
  article satisfies CoolerArticle;
  // @ts-expect-error not undefined with non-null args
  article satisfies undefined;

  const maybeArticle = useLive(CoolerArticleResource.get, null);
  maybeArticle satisfies CoolerArticle | undefined;
  // @ts-expect-error may be undefined with null args
  maybeArticle.title;

  const plain = useLive(getPlain, 5);
  plain satisfies Plain;
  // @ts-expect-error not undefined with non-null args
  plain satisfies undefined;

  const maybePlain = useLive(getPlain, null);
  maybePlain satisfies Plain | undefined;
  // @ts-expect-error may be undefined with null args
  maybePlain.name;
};

// useDLE()
() => {
  const article = useDLE(CoolerArticleResource.get, { id: 5 });
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
  // @ts-expect-error data may be undefined until resolved
  plain.data.name;
  if (plain.loading) {
    plain.data satisfies undefined;
  } else if (!plain.error) {
    plain.data satisfies Plain;
  } else {
    plain.error satisfies ErrorTypes;
    plain.data satisfies undefined;
  }

  const maybeArticle = useDLE(CoolerArticleResource.get, null);
  maybeArticle.loading satisfies boolean;
  maybeArticle.error satisfies ErrorTypes | undefined;
  if (!maybeArticle.loading && !maybeArticle.error) {
    // @ts-expect-error may be undefined with null args
    maybeArticle.data.title;
  }
};
