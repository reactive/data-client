import { Endpoint, Invalidate } from '@data-client/endpoint';
import nock from 'nock';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onErrorCaptured,
  reactive,
} from 'vue';

import {
  CoolerArticleResource,
  CoolerArticle,
} from '../../../../__tests__/new';
import useSuspense from '../consumers/useSuspense';
import { renderDataCompose, mountDataClient } from '../test';

// Minimal shared fixture (copied from React test fixtures)
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

describe('vue useSuspense()', () => {
  let infoSpy: jest.SpyInstance;
  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    infoSpy.mockRestore();
  });

  async function flushUntil(
    wrapper: any,
    predicate: () => boolean,
    tries = 100,
  ) {
    for (let i = 0; i < tries; i++) {
      if (predicate()) return;
      await Promise.resolve();
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload)
      .get(`/article-cooler/${payload2.id}`)
      .reply(200, payload2)
      .put(`/article-cooler/${payload.id}`)
      .reply(200, (uri, requestBody: any) => ({
        ...payload,
        ...requestBody,
      }));
  });

  afterAll(() => {
    nock.cleanAll();
  });

  // No need for ProvideWrapper anymore since Suspense is integrated into mountDataClient

  it('suspends on empty store, then renders after fetch resolves', async () => {
    const { result, cleanup } = await renderDataCompose(() =>
      useSuspense(CoolerArticleResource.get, { id: payload.id }),
    );

    // Should have the Promise (suspension in Vue 3 returns a Promise)
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Promise);

    // Await the promise once to get the reactive ComputedRef
    const articleRef = await result;
    expect(articleRef.value.title).toBe(payload.title);
    expect(articleRef.value.content).toBe(payload.content);

    cleanup();
  });

  it('re-renders when controller.setResponse() updates data', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(() =>
        useSuspense(CoolerArticleResource.get, { id: payload.id }),
      );

    // Wait for initial render
    await waitForNextUpdate();

    // Await the promise once to get the reactive ComputedRef
    const articleRef = await result;

    // Verify initial values
    expect(articleRef.value.title).toBe(payload.title);
    expect(articleRef.value.content).toBe(payload.content);

    // Update the store using controller.setResponse
    const newTitle = payload.title + ' updated';
    const newContent = (payload as any).content + ' v2';
    controller.setResponse(
      CoolerArticleResource.get,
      { id: payload.id },
      { ...payload, title: newTitle, content: newContent },
    );

    // Wait a tick for Vue reactivity to propagate
    await nextTick();

    // The ComputedRef should now have updated values (it's reactive!)
    expect(articleRef.value.title).toBe(newTitle);
    expect(articleRef.value.content).toBe(newContent);

    cleanup();
  });

  it('re-renders when controller.fetch() mutates data', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(() =>
        useSuspense(CoolerArticleResource.get, { id: payload.id }),
      );

    // Wait for initial render
    await waitForNextUpdate();

    // Await the promise once to get the reactive ComputedRef
    const articleRef = await result;

    // Verify initial values
    expect(articleRef.value.title).toBe(payload.title);
    expect(articleRef.value.content).toBe(payload.content);

    // Mutate the data using controller.fetch with update endpoint
    const updatedTitle = payload.title + ' mutated';
    const updatedContent = payload.content + ' mutated';

    await controller.fetch(
      CoolerArticleResource.update,
      { id: payload.id },
      { title: updatedTitle, content: updatedContent },
    );

    // Wait a tick for Vue reactivity to propagate
    await nextTick();

    // The ComputedRef should now have updated values (it's reactive!)
    expect(articleRef.value.title).toBe(updatedTitle);
    expect(articleRef.value.content).toBe(updatedContent);

    cleanup();
  });

  it('should re-fetch when props change', async () => {
    nock.cleanAll();

    const fetchMock1 = jest.fn(() => payload);
    const fetchMock2 = jest.fn(() => payload2);

    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, fetchMock1)
      .get(`/article-cooler/${payload2.id}`)
      .reply(200, fetchMock2);

    const ArticleWithProps = defineComponent({
      name: 'ArticleWithProps',
      props: {
        id: {
          type: Number,
          required: true,
        },
      },
      async setup(props: { id: number }) {
        // Pass the reactive value - useSuspense will track changes via its internal computed
        const article = await useSuspense(CoolerArticleResource.get, props);

        return () =>
          h('div', [
            h('h3', (article as any).value?.title),
            h('p', (article as any).value?.content),
          ]);
      },
    });

    // Use mountDataClient to properly set up the test environment
    const props = reactive({ id: payload.id });
    const { wrapper, cleanup } = mountDataClient(ArticleWithProps, {
      props,
    });

    // Wait for initial render and verify data
    await flushUntil(wrapper, () => wrapper.find('h3').exists());
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(wrapper.find('p').text()).toBe(payload.content);
    expect(fetchMock1).toHaveBeenCalledTimes(1);
    expect(fetchMock2).toHaveBeenCalledTimes(0);

    // Change the id prop - this should trigger re-suspense but currently doesn't
    props.id = payload2.id;
    await nextTick();

    // Wait for the new data to render
    await flushUntil(
      wrapper,
      () =>
        wrapper.find('h3').exists() &&
        wrapper.find('h3').text() === payload2.title,
    );

    expect(fetchMock1).toHaveBeenCalledTimes(1);
    expect(fetchMock2).toHaveBeenCalledTimes(1);
    expect(wrapper.find('h3').text()).toBe(payload2.title);
    expect(wrapper.find('p').text()).toBe(payload2.content);

    cleanup();

    // Restore the original nock interceptors from beforeAll
    nock.cleanAll();
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload)
      .get(`/article-cooler/${payload2.id}`)
      .reply(200, payload2)
      .put(`/article-cooler/${payload.id}`)
      .reply(200, (uri, requestBody: any) => ({
        ...payload,
        ...requestBody,
      }));
  });

  it('keeps previous data while new args are loading', async () => {
    const resolvers: Record<number, (value: any) => void> = {};
    const ControlledEndpoint = new Endpoint(
      ({ id }: { id: number }) =>
        new Promise(resolve => {
          resolvers[id] = resolve;
        }),
      { schema: CoolerArticle, name: 'KeepPreviousEndpoint' },
    );

    const errorSpy = jest.fn();
    const ArticleTitle = defineComponent({
      name: 'ArticleTitle',
      props: { id: { type: Number, required: true } },
      async setup(props: { id: number }) {
        const article = await useSuspense(
          ControlledEndpoint,
          computed(() => ({ id: props.id })),
        );
        // no optional chaining: crashes if data is ever undefined
        return () => h('h3', article.value.title);
      },
    });
    const Parent = defineComponent({
      name: 'Parent',
      props: { id: { type: Number, required: true } },
      setup(props: { id: number }) {
        onErrorCaptured(e => {
          errorSpy(e);
          return false;
        });
        return () => h(ArticleTitle, { id: props.id });
      },
    });

    const props = reactive({ id: payload.id });
    const { wrapper, cleanup } = mountDataClient(Parent, { props });

    await flushUntil(wrapper, () => !!resolvers[payload.id]);
    resolvers[payload.id](payload);
    await flushUntil(wrapper, () => wrapper.find('h3').exists());
    expect(wrapper.find('h3').text()).toBe(payload.title);

    props.id = payload2.id;
    await flushUntil(wrapper, () => !!resolvers[payload2.id]);
    await nextTick();

    // still showing previous data while the new fetch is in flight
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(errorSpy).not.toHaveBeenCalled();

    resolvers[payload2.id](payload2);
    await flushUntil(
      wrapper,
      () => wrapper.find('h3').text() === payload2.title,
    );
    expect(wrapper.find('h3').text()).toBe(payload2.title);
    expect(errorSpy).not.toHaveBeenCalled();

    cleanup();
  });

  it('shows store updates once invalidIfStale data goes stale', async () => {
    const StaleEndpoint = new Endpoint(
      ({ id }: { id: number }) => Promise.resolve({ ...payload, id }),
      {
        schema: CoolerArticle,
        name: 'StaleEndpoint',
        dataExpiryLength: 20,
        invalidIfStale: true,
      },
    );
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(() =>
        useSuspense(StaleEndpoint, { id: payload.id }),
      );
    await waitForNextUpdate();
    const articleRef = await result;
    expect(articleRef.value.title).toBe(payload.title);

    // let the data go stale without anything triggering a refetch
    await new Promise(resolve => setTimeout(resolve, 50));
    const UpdateEndpoint = new Endpoint(
      (body: typeof payload) => Promise.resolve(body),
      {
        schema: CoolerArticle,
        sideEffect: true,
        name: 'StaleUpdate',
      },
    );
    await controller.fetch(UpdateEndpoint, { ...payload, title: 'edited' });
    await nextTick();

    expect(articleRef.value.title).toBe('edited');

    cleanup();
  });

  it('shows store updates while refetching the same args', async () => {
    let fetchCount = 0;
    let resolveRefetch: (value: any) => void = () => {};
    const RefetchEndpoint = new Endpoint(
      ({ id }: { id: number }) =>
        // first fetch resolves; the refetch stays in flight until we resolve it
        fetchCount++ === 0 ?
          Promise.resolve({ ...payload, id })
        : new Promise(resolve => {
            resolveRefetch = resolve;
          }),
      {
        schema: CoolerArticle,
        name: 'RefetchEndpoint',
        dataExpiryLength: 20,
        invalidIfStale: true,
      },
    );
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(() =>
        useSuspense(RefetchEndpoint, { id: payload.id }),
      );
    await waitForNextUpdate();
    const articleRef = await result;
    expect(articleRef.value.title).toBe(payload.title);

    // expiring the data makes the hook refetch the same args
    await controller.expireAll({
      testKey: key => key.startsWith('RefetchEndpoint'),
    });
    await nextTick();
    expect(fetchCount).toBe(2);
    const UpdateEndpoint = new Endpoint(
      (body: typeof payload) => Promise.resolve(body),
      { schema: CoolerArticle, sideEffect: true, name: 'RefetchUpdate' },
    );
    await controller.fetch(UpdateEndpoint, { ...payload, title: 'edited' });
    await nextTick();
    await nextTick();

    expect(fetchCount).toBe(2);
    expect(articleRef.value.title).toBe('edited');

    resolveRefetch({ ...payload, title: 'edited' });
    await new Promise(resolve => setTimeout(resolve, 0));
    cleanup();
  });

  it('keeps previous data while refetching a deleted entity', async () => {
    let fetchCount = 0;
    let resolveRefetch: (value: any) => void = () => {};
    const DeletedEndpoint = new Endpoint(
      ({ id }: { id: number }) =>
        // first fetch resolves; the refetch stays in flight until we resolve it
        fetchCount++ === 0 ?
          Promise.resolve({ ...payload, id })
        : new Promise(resolve => {
            resolveRefetch = resolve;
          }),
      { schema: CoolerArticle, name: 'DeletedEndpoint' },
    );
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(() =>
        useSuspense(DeletedEndpoint, { id: payload.id }),
      );
    await waitForNextUpdate();
    const articleRef = await result;
    expect(articleRef.value.title).toBe(payload.title);

    const DeleteEndpoint = new Endpoint(
      ({ id }: { id: number }) => Promise.resolve({ id }),
      {
        schema: new Invalidate(CoolerArticle),
        sideEffect: true,
        name: 'DeleteArticle',
      },
    );
    await controller.fetch(DeleteEndpoint, { id: payload.id });
    await nextTick();
    await nextTick();

    expect(fetchCount).toBe(2);
    expect(articleRef.value.title).toBe(payload.title);

    resolveRefetch({ ...payload, title: 'restored' });
    await new Promise(resolve => setTimeout(resolve, 0));
    await nextTick();
    expect(articleRef.value.title).toBe('restored');
    cleanup();
  });

  it('should initially resolve, then when args are null should return undefined, then back to resolving', async () => {
    const props = reactive({ id: payload.id as number | null });
    const { result, allSettled, waitForNextUpdate, cleanup } =
      await renderDataCompose(
        (props: { id: number | null }) =>
          useSuspense(
            CoolerArticleResource.get,
            computed(() => (props.id !== null ? { id: props.id } : null)),
          ),
        { props },
      );

    // Wait for initial render
    await waitForNextUpdate();

    // Await the promise once to get the reactive ComputedRef
    const articleRef = await result;

    expect(articleRef).toBeDefined();

    // Verify initial values
    expect(articleRef.value?.title).toBe(payload.title);
    expect(articleRef.value?.content).toBe(payload.content);

    // Change to null - the ComputedRef should reactively become undefined
    props.id = null;
    await nextTick();

    // The same ComputedRef should now have undefined value
    expect(articleRef.value).toBeUndefined();

    // Change back to valid id - should resolve the new data
    props.id = payload2.id;
    await nextTick();

    // Wait for the fetch to complete
    await allSettled();
    await nextTick();

    // The ComputedRef should now have the new article data
    expect(articleRef).toBeDefined();
    expect(articleRef?.value?.title).toBe(payload2.title);
    expect(articleRef.value?.content).toBe(payload2.content);

    cleanup();
  });

  it('should initiate second fetch when props change even if first promise never resolves', async () => {
    let fetchInitialCalled = false;
    let fetchFinalCalled = false;
    let resolveInitial: ((value: any) => void) | undefined;
    let resolveFinal: ((value: any) => void) | undefined;

    // Create custom endpoint with controllable promises
    const ControlledEndpoint = new Endpoint(
      ({ id }: { id: number }) => {
        if (id === payload.id) {
          fetchInitialCalled = true;
          // Initial fetch - manually controlled
          return new Promise(resolve => {
            resolveInitial = resolve;
          });
        } else if (id === payload2.id) {
          fetchFinalCalled = true;
          // Final fetch - manually controlled
          return new Promise(resolve => {
            resolveFinal = resolve;
          });
        }
        throw new Error(`Unexpected id: ${id}`);
      },
      { schema: CoolerArticle, name: 'ControlledEndpoint' },
    );

    const props = reactive({ id: payload.id });

    // Start the composable (don't await yet since initial fetch needs manual resolution)
    const setupPromise = renderDataCompose(
      (props: { id: number }) =>
        useSuspense(
          ControlledEndpoint,
          computed(() => ({ id: props.id })),
        ),
      { props },
    );

    // Wait for initial fetch to be called
    expect(fetchInitialCalled).toBe(true);

    props.id = payload2.id;
    await nextTick();

    resolveFinal?.(payload2);

    // Resolve the initial fetch so renderDataCompose completes
    resolveInitial?.(payload);

    const { result, cleanup } = await setupPromise;
    const articleRef = await result;

    // The data should now be from the final fetch (payload2)
    expect(articleRef.value?.title).toBe(payload2.title);
    expect(articleRef.value?.content).toBe(payload2.content);

    cleanup();
  });

  it('should not refetch stale data on store updates that keep expiry unchanged', async () => {
    const fetchMock = jest.fn(async ({ id }: { id: number }) => ({
      ...payload,
      id,
    }));
    const staleEndpoint = new Endpoint(fetchMock, {
      schema: CoolerArticle,
      dataExpiryLength: 20,
      name: 'staleArticle',
    });

    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(() => useSuspense(staleEndpoint, { id: 77 }));
    await waitForNextUpdate();
    const articleRef = await result;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // let data become stale
    await new Promise(resolve => setTimeout(resolve, 50));

    await controller.set(
      CoolerArticle,
      { id: 77 },
      { id: 77, title: 'edited' },
    );
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    // the store update should not trigger a refetch that overwrites the set
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(articleRef.value?.title).toBe('edited');

    cleanup();
  });
});
