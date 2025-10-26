import nock from 'nock';
import { computed, nextTick, reactive } from 'vue';

import {
  CoolerArticle,
  CoolerArticleResource,
  InvalidIfStaleArticleResource,
  PaginatedArticleResource,
  TypedArticleResource,
} from '../../../../__tests__/new';
import useDLE from '../consumers/useDLE';
import { renderDataCompose } from '../test';

// Minimal shared fixtures (copied from React test fixtures)
const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

const payload2 = {
  id: 6,
  title: 'next',
  content: 'my best content yet',
  tags: ['b'],
};

const users = [
  { id: 23, username: 'bob' },
  { id: 24, username: 'alice' },
];

const nested = [
  {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
    author: {
      id: 23,
      username: 'bob',
    },
  },
  {
    id: 3,
    title: 'the next time',
    content: 'whatever',
    author: {
      id: 23,
      username: 'charles',
      email: 'bob@bob.com',
    },
  },
];

describe('vue useDLE()', () => {
  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload)
      .get(`/article-cooler/${payload2.id}`)
      .reply(200, payload2)
      .delete(`/article-cooler/${payload.id}`)
      .reply(204, '')
      .delete(`/article/${payload.id}`)
      .reply(200, {})
      .get(`/article-cooler/0`)
      .reply(403, {})
      .get(`/article-cooler/666`)
      .reply(200, '')
      .get(`/article-cooler`)
      .reply(200, nested)
      .get(/article-cooler\/.*/)
      .reply(404, 'not found')
      .put(/article-cooler\/[^5].*/)
      .reply(404, 'not found')
      .get(`/user`)
      .reply(200, users);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('should work on good network', async () => {
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      () => {
        return useDLE(CoolerArticleResource.get, { id: payload.id });
      },
    );

    expect(result.data.value).toBe(undefined);
    expect(result.error.value).toBe(undefined);
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeUndefined();
    expect(result.data.value).toEqual(CoolerArticle.fromJS(payload));

    cleanup();
  });

  it('should work with no schema', async () => {
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      () => {
        return useDLE(CoolerArticleResource.get.extend({ schema: undefined }), {
          id: payload.id,
        });
      },
    );

    expect(result.data.value).toBe(undefined);
    expect(result.error.value).toBe(undefined);
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeUndefined();
    expect(result.data.value).toEqual(payload);

    cleanup();
  });

  it('should work on good network with endpoint', async () => {
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      () => {
        return useDLE(TypedArticleResource.get, { id: payload.id });
      },
    );

    expect(result.data.value).toBe(undefined);
    expect(result.error.value).toBe(undefined);
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeUndefined();
    expect(result.data.value).toEqual(CoolerArticle.fromJS(payload));

    cleanup();
  });

  it('should properly discriminate null args types', () => {
    () => {
      const result = useDLE(
        TypedArticleResource.get,
        (true as boolean) ? { id: payload.id } : null,
      );
      if (!result.loading.value && !result.error.value) {
        // @ts-expect-error
        result.data.value.title;

        result.data.value && result.data.value.title;
      }
    };
    () => {
      const result = useDLE(TypedArticleResource.get, { id: payload.id });
      if (!result.loading.value && !result.error.value) {
        result.data.value && result.data.value.title;
      }
    };
  });

  it('should return errors on bad network', async () => {
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      () => {
        return useDLE(CoolerArticleResource.get, { title: '0' });
      },
    );

    expect(result.data.value).toBe(undefined);
    expect(result.error.value).toBe(undefined);
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeDefined();
    expect((result.error.value as any).status).toBe(403);

    cleanup();
  });

  it('should pass with exact params', async () => {
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      () => {
        return useDLE(TypedArticleResource.get, { id: payload.id });
      },
    );

    expect(result.data.value).toBeUndefined();

    await waitForNextUpdate();

    // type discrimination forces it to be resolved
    if (
      !result.loading.value &&
      result.error.value === undefined &&
      result.data.value
    ) {
      expect(result.data.value.title).toBe(payload.title);
      // @ts-expect-error ensure this isn't "any"
      result.data.value.doesnotexist;
    }

    cleanup();
  });

  it('should fail with improperly typed param', async () => {
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      () => {
        // @ts-expect-error
        return useDLE(TypedArticleResource.get, {
          id: "{ a: 'five' }" as any as Date,
        });
      },
    );

    expect(result.data.value).toBeUndefined();
    expect(result.error.value).toBeUndefined();
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeDefined();
    if (result.error.value) {
      expect((result.error.value as any).status).toBe(404);
    }

    cleanup();
  });

  it('should fetch anew with param changes', async () => {
    const props = reactive({ id: payload.id });
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      (props: { id: number }) => {
        return useDLE(
          CoolerArticleResource.get,
          computed(() => ({ id: props.id })),
        );
      },
      { props },
    );

    expect(result.data.value).toBe(undefined);
    expect(result.error.value).toBe(undefined);
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeUndefined();
    expect(result.data.value).toEqual(CoolerArticle.fromJS(payload));

    props.id = payload2.id;
    await nextTick();

    expect(result.data.value).toBe(undefined);
    expect(result.error.value).toBe(undefined);
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeUndefined();
    expect(result.data.value).toEqual(CoolerArticle.fromJS(payload2));

    cleanup();
  });

  it('should not be loading with null params', async () => {
    const { result, cleanup } = await renderDataCompose(() => {
      return useDLE(CoolerArticleResource.get, null);
    });

    await nextTick();
    expect(result.loading.value).toBe(false);

    cleanup();
  });

  it('should maintain schema structure even with null params', async () => {
    const { result, cleanup } = await renderDataCompose(() => {
      return useDLE(PaginatedArticleResource.getList, null);
    });

    await nextTick();
    expect(result.loading.value).toBe(false);
    expect(result.data.value.results).toBeUndefined();
    expect(result.data.value.nextPage).toBe('');
    // ensure this isn't 'any'
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _typeCheck: PaginatedArticleResource[] = result.data.value.results;

    cleanup();
  });

  it('should not select when results are stale and invalidIfStale is true', async () => {
    const realDate = global.Date.now;
    Date.now = jest.fn(() => 999999999);

    const props = reactive({ id: payload.id as number | null });
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      (props: { id: number | null }) => {
        return useDLE(
          InvalidIfStaleArticleResource.get,
          computed(() => (props.id !== null ? { id: props.id } : null)),
        );
      },
      { props },
    );

    await waitForNextUpdate();
    expect(result.data.value).toBeDefined();

    Date.now = jest.fn(() => 999999999 * 3);

    props.id = null;
    await nextTick();
    expect(result.data.value).toBeUndefined();

    props.id = payload.id;
    await nextTick();
    expect(result.data.value).toBeUndefined();
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();
    expect(result.data.value).toBeDefined();
    expect(result.loading.value).toBe(false);

    global.Date.now = realDate;
    cleanup();
  });

  it('should reactively update data when controller.setResponse() is called', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(() => {
        return useDLE(CoolerArticleResource.get, { id: payload.id });
      });

    await waitForNextUpdate();

    expect(result.data.value).toEqual(CoolerArticle.fromJS(payload));
    expect(result.loading.value).toBe(false);

    // Update the store using controller.setResponse
    const newTitle = payload.title + ' updated';
    const newContent = payload.content + ' v2';
    controller.setResponse(
      CoolerArticleResource.get,
      { id: payload.id },
      { ...payload, title: newTitle, content: newContent },
    );

    // Wait a tick for Vue reactivity to propagate
    await nextTick();

    // The ComputedRef should now have updated values (it's reactive!)
    expect(result.data.value!.title).toBe(newTitle);
    expect(result.data.value!.content).toBe(newContent);
    expect(result.loading.value).toBe(false);

    cleanup();
  });

  it('should be reactive with prop changes', async () => {
    const props = reactive({ id: payload.id });
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      (props: { id: number }) => {
        return useDLE(
          CoolerArticleResource.get,
          computed(() => ({ id: props.id })),
        );
      },
      {
        props,
        initialFixtures: [
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload.id }],
            response: payload,
          },
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload2.id }],
            response: payload2,
          },
        ],
      },
    );

    await waitForNextUpdate();
    expect(result.data.value?.title).toBe(payload.title);

    // Change props - result automatically updates
    props.id = payload2.id;
    await nextTick();
    await waitForNextUpdate();

    expect(result.data.value?.title).toBe(payload2.title);

    cleanup();
  });

  it('should handle conditional null arguments', async () => {
    const props = reactive({ id: payload.id as number | null });
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      (props: { id: number | null }) =>
        useDLE(
          CoolerArticleResource.get,
          computed(() => (props.id !== null ? { id: props.id } : null)),
        ),
      {
        props,
        initialFixtures: [
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      },
    );

    await waitForNextUpdate();
    expect(result.data.value).toBeDefined();
    expect(result.data.value?.title).toBe(payload.title);

    // Set to null - becomes undefined
    props.id = null;
    await nextTick();
    expect(result.data.value).toBeUndefined();
    expect(result.loading.value).toBe(false);

    cleanup();
  });

  it('should not be loading when data is valid and not expired', async () => {
    const { result, cleanup } = await renderDataCompose(
      () => {
        return useDLE(CoolerArticleResource.get, { id: payload.id });
      },
      {
        initialFixtures: [
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      },
    );

    // Should not be loading since data is valid (fixture provides fresh data)
    expect(result.loading.value).toBe(false);
    expect(result.data.value).toBeDefined();
    expect(result.data.value?.title).toBe(payload.title);

    cleanup();
  });

  it('should refetch when data becomes stale after time passes', async () => {
    const realDate = global.Date.now;
    Date.now = jest.fn(() => 1000000);

    const props = reactive({ id: payload.id });
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      (props: { id: number }) => {
        return useDLE(
          CoolerArticleResource.get,
          computed(() => ({ id: props.id })),
        );
      },
      { props },
    );

    await waitForNextUpdate();
    expect(result.data.value).toBeDefined();
    expect(result.loading.value).toBe(false);

    // Advance time beyond expiry
    Date.now = jest.fn(() => 1000000 + 999999999);

    // Trigger re-evaluation by changing and reverting props
    props.id = payload2.id;
    await nextTick();

    // Should trigger new fetch for payload2 (and it will be stale)
    expect(result.loading.value).toBe(true);

    global.Date.now = realDate;
    cleanup();
  });

  it('should handle force fetch with invalidIfStale', async () => {
    const realDate = global.Date.now;
    Date.now = jest.fn(() => 1000000);

    const { result, waitForNextUpdate, cleanup, controller } =
      await renderDataCompose(() => {
        return useDLE(InvalidIfStaleArticleResource.get, { id: payload.id });
      });

    await waitForNextUpdate();
    expect(result.data.value).toBeDefined();
    expect(result.loading.value).toBe(false);

    // Invalidate to trigger forceFetch
    controller.invalidate(InvalidIfStaleArticleResource.get, {
      id: payload.id,
    });

    await nextTick();

    // Should be loading due to invalidation (force fetch)
    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.data.value).toBeDefined();

    global.Date.now = realDate;
    cleanup();
  });

  it('should handle switching from null to valid args', async () => {
    const props = reactive({ id: null as number | null });
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      (props: { id: number | null }) =>
        useDLE(
          CoolerArticleResource.get,
          computed(() => (props.id !== null ? { id: props.id } : null)),
        ),
      { props },
    );

    // Initially with null args
    expect(result.loading.value).toBe(false);
    expect(result.data.value).toBeUndefined();

    // Switch to valid args
    props.id = payload.id;
    await nextTick();

    expect(result.loading.value).toBe(true);

    await waitForNextUpdate();

    expect(result.loading.value).toBe(false);
    expect(result.data.value).toBeDefined();
    expect(result.data.value?.title).toBe(payload.title);

    cleanup();
  });

  it('should handle data when expires condition is met but not force fetch', async () => {
    const realDate = global.Date.now;
    // Set initial time
    Date.now = jest.fn(() => 100000);

    const { result, cleanup } = await renderDataCompose(
      () => {
        return useDLE(CoolerArticleResource.get, { id: payload.id });
      },
      {
        initialFixtures: [
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      },
    );

    // Data should be available and not loading (fixture provides fresh data)
    expect(result.loading.value).toBe(false);
    expect(result.data.value?.title).toBe(payload.title);

    global.Date.now = realDate;
    cleanup();
  });

  it('should handle data when data is valid (not expired)', async () => {
    const { result, cleanup } = await renderDataCompose(
      () => {
        return useDLE(CoolerArticleResource.get, { id: payload.id });
      },
      {
        initialFixtures: [
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      },
    );

    // With valid cached data, should not be loading
    expect(result.loading.value).toBe(false);
    expect(result.data.value?.title).toBe(payload.title);
    expect(result.error.value).toBeUndefined();

    cleanup();
  });

  it('should cover forceFetch branch when data is not expired', async () => {
    const realDate = global.Date.now;
    Date.now = jest.fn(() => 1000000);

    const { result, waitForNextUpdate, cleanup, controller } =
      await renderDataCompose(() => {
        return useDLE(InvalidIfStaleArticleResource.get, { id: payload.id });
      });

    await waitForNextUpdate();
    expect(result.data.value).toBeDefined();
    expect(result.loading.value).toBe(false);

    // Don't advance time, but invalidate (forceFetch = true, but Date.now() <= expiresAt)
    controller.invalidate(InvalidIfStaleArticleResource.get, {
      id: payload.id,
    });
    await nextTick();

    // Should trigger loading due to forceFetch even though not expired by time
    expect(result.loading.value).toBe(true);

    global.Date.now = realDate;
    cleanup();
  });

  it('should handle argsKey being empty string with null args', async () => {
    const { result, cleanup } = await renderDataCompose(() => {
      return useDLE(CoolerArticleResource.get, null);
    });

    // With null args, argsKey is empty, so not loading
    expect(result.loading.value).toBe(false);
    expect(result.data.value).toBeUndefined();

    cleanup();
  });
});
