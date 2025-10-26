import nock from 'nock';
import { computed, defineComponent, h, nextTick, reactive } from 'vue';

import { CoolerArticleResource } from '../../../../__tests__/new';
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
    const { result, waitForNextUpdate, cleanup } = renderDataCompose(() =>
      useSuspense(CoolerArticleResource.get, { id: payload.id }),
    );

    // Initially should be undefined while suspended
    expect(result.current).toBeUndefined();

    // Wait for the composable to resolve
    await waitForNextUpdate();

    // Now should have the Promise
    expect(result.current).toBeDefined();
    expect(result.current).toBeInstanceOf(Promise);

    // Await the promise once to get the reactive ComputedRef
    const articleRef = await result.current!;
    expect(articleRef.value.title).toBe(payload.title);
    expect(articleRef.value.content).toBe(payload.content);

    cleanup();
  });

  it('re-renders when controller.setResponse() updates data', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      renderDataCompose(() =>
        useSuspense(CoolerArticleResource.get, { id: payload.id }),
      );

    // Wait for initial render
    await waitForNextUpdate();

    // Await the promise once to get the reactive ComputedRef
    const articleRef = await result.current!;

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
      renderDataCompose(() =>
        useSuspense(CoolerArticleResource.get, { id: payload.id }),
      );

    // Wait for initial render
    await waitForNextUpdate();

    // Await the promise once to get the reactive ComputedRef
    const articleRef = await result.current!;

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

  it('should initially resolve, then when args are null should return undefined, then back to resolving', async () => {
    const props = reactive({ id: payload.id as number | null });
    const { result, allSettled, waitForNextUpdate, cleanup } =
      renderDataCompose(
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
    const articleRef = await result.current!;

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
});
