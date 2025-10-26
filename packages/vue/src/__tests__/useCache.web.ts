import nock from 'nock';
import { computed, defineComponent, h, nextTick, reactive } from 'vue';

import { CoolerArticleResource } from '../../../../__tests__/new';
import useCache from '../consumers/useCache';
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

describe('vue useCache()', () => {
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

  it('returns undefined on empty store (no fetch)', async () => {
    const { result, cleanup } = await renderDataCompose(() =>
      useCache(CoolerArticleResource.get, { id: payload.id }),
    );

    // The value should be undefined since we haven't fetched yet
    expect(result.value).toBeUndefined();

    cleanup();
  });

  it('returns data when already in cache', async () => {
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      () => useCache(CoolerArticleResource.get, { id: payload.id }),
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

    // Wait for initial render
    await waitForNextUpdate();

    // The value should be the cached data
    expect(result.value).toBeDefined();
    expect(result.value?.title).toBe(payload.title);
    expect(result.value?.content).toBe(payload.content);

    cleanup();
  });

  it('re-renders when controller.setResponse() updates data', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(
        () => useCache(CoolerArticleResource.get, { id: payload.id }),
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

    // Wait for initial render
    await waitForNextUpdate();

    // Verify initial values
    expect(result.value?.title).toBe(payload.title);
    expect(result.value?.content).toBe(payload.content);

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
    expect(result.value?.title).toBe(newTitle);
    expect(result.value?.content).toBe(newContent);

    cleanup();
  });

  it('re-renders when controller.fetch() mutates data', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(
        () => useCache(CoolerArticleResource.get, { id: payload.id }),
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

    // Wait for initial render
    await waitForNextUpdate();

    // Verify initial values
    expect(result.value?.title).toBe(payload.title);
    expect(result.value?.content).toBe(payload.content);

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
    expect(result.value?.title).toBe(updatedTitle);
    expect(result.value?.content).toBe(updatedContent);

    cleanup();
  });

  it('should update when props change', async () => {
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
      setup(props: { id: number }) {
        // Pass the reactive value - useCache will track changes via its internal computed
        const article = useCache(CoolerArticleResource.get, props);

        return () =>
          h('div', [
            h('h3', (article as any).value?.title || 'Loading...'),
            h('p', (article as any).value?.content || ''),
          ]);
      },
    });

    // Use mountDataClient to properly set up the test environment
    const props = reactive({ id: payload.id });
    const { wrapper, cleanup } = mountDataClient(ArticleWithProps, {
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
    });

    // Wait for data to render
    await flushUntil(
      wrapper,
      () => wrapper.find('h3').text() === payload.title,
    );
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(wrapper.find('p').text()).toBe(payload.content);

    // Change the id prop
    props.id = payload2.id;
    await nextTick();

    // Wait for the new data to render
    await flushUntil(
      wrapper,
      () =>
        wrapper.find('h3').exists() &&
        wrapper.find('h3').text() === payload2.title,
    );

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

  it('should handle null args by returning undefined', async () => {
    const props = reactive({ id: payload.id as number | null });
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      (props: { id: number | null }) =>
        useCache(
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
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload2.id }],
            response: payload2,
          },
        ],
      },
    );

    // Wait for initial render
    await waitForNextUpdate();

    expect(result.value).toBeDefined();

    // Verify initial values
    expect(result.value?.title).toBe(payload.title);
    expect(result.value?.content).toBe(payload.content);

    // Change to null - the ComputedRef should reactively become undefined
    props.id = null;
    await nextTick();

    // The same ComputedRef should now have undefined value
    expect(result.value).toBeUndefined();

    // Change back to valid id - should get cached data
    props.id = payload2.id;
    await nextTick();

    // The ComputedRef should now have the new article data
    expect(result.value).toBeDefined();
    expect(result.value?.title).toBe(payload2.title);
    expect(result.value?.content).toBe(payload2.content);

    cleanup();
  });

  it('returns undefined for stale data when invalidIfStale is true', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      await renderDataCompose(
        () => useCache(CoolerArticleResource.get, { id: payload.id }),
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

    // Wait for initial render
    await waitForNextUpdate();

    // Invalidate the data
    controller.invalidate(CoolerArticleResource.get, { id: payload.id });

    await nextTick();

    // The value should be undefined since the data is invalid
    expect(result.value).toBeUndefined();

    cleanup();
  });

  it('returns cached data even if expired when expiryStatus is Valid', async () => {
    const { result, waitForNextUpdate, cleanup } = await renderDataCompose(
      () => useCache(CoolerArticleResource.get, { id: payload.id }),
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

    // Wait for initial render
    await waitForNextUpdate();

    // Even though data might be expired, if it's Valid it should be returned
    expect(result.value).toBeDefined();
    expect(result.value?.title).toBe(payload.title);

    cleanup();
  });
});
