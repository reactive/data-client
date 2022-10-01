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
        endpoint: TypedArticleResource.get,
        args: [{ id: payload.id }],
        response: new Error('broken'),
        error: true,
      },
    ];
    const { result } = renderRestHook(
      () => {
        // @ts-expect-error
        () => useMeta(TypedArticleResource.get, 500);
        // @ts-expect-error
        () => useMeta(TypedArticleResource.get);
        // @ts-expect-error
        () => useMeta(TypedArticleResource.get, '5');
        // @ts-expect-error
        () => useMeta(TypedArticleResource.get, payload, { a: 5 });

        return useMeta(TypedArticleResource.get, { id: payload.id });
      },
      { results },
    );

    expect(result.current).toBeDefined();
    expect(result.current?.error).toBeDefined();
    expect(result.current?.expiresAt).toBeDefined();
  });
});
