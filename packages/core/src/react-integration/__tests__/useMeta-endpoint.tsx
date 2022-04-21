import { TypedArticleResource } from '__tests__/new';

// relative imports to avoid circular dependency in tsconfig references
import {
  makeRenderRestHook,
  makeCacheProvider,
  Fixture,
} from '@rest-hooks/test';

import { useMeta } from '../hooks';
import { payload } from '../test-fixtures';

describe('useMeta()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should contain error', () => {
    const results: Fixture[] = [
      {
        request: TypedArticleResource.detail().bind(undefined, payload),
        result: new Error('broken'),
        error: true,
      },
    ];
    const { result } = renderRestHook(
      () => {
        // @ts-expect-error
        useMeta(TypedArticleResource.detail(), 500);
        // @ts-expect-error
        useMeta(TypedArticleResource.detail());
        // @ts-expect-error
        useMeta(TypedArticleResource.detail(), { id: '5' });
        // @ts-expect-error
        useMeta(TypedArticleResource.detail(), payload, { a: 5 });

        return useMeta(TypedArticleResource.detail(), payload);
      },
      { results },
    );

    expect(result.current).toBeDefined();
    expect(result.current?.error).toBeDefined();
    expect(result.current?.expiresAt).toBeDefined();
  });
});
