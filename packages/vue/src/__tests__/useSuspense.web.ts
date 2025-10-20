import nock from 'nock';
import { defineComponent, h, nextTick } from 'vue';

import { CoolerArticleResource } from '../../../../__tests__/new';
import useSuspense from '../consumers/useSuspense';
import {
  renderDataComposable,
  renderDataClient,
} from '../test/renderDataClient';

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

  // No need for ProvideWrapper anymore since Suspense is integrated into renderDataClient

  it('suspends on empty store, then renders after fetch resolves', async () => {
    const { result, waitForNextUpdate, cleanup } = renderDataComposable(() =>
      useSuspense(CoolerArticleResource.get, { id: payload.id }),
    );

    // Initially should be undefined while suspended (React-like interface)
    expect(result.current).toBeUndefined();

    // Wait for the composable to resolve
    await waitForNextUpdate();

    // Now should have the actual data (useSuspense returns a Promise that resolves to ComputedRef)
    expect(result.current).toBeDefined();
    expect(result.current).toBeInstanceOf(Promise);

    // Wait for the promise to resolve
    const articleRef = await result.current;
    expect(articleRef!.value.title).toBe(payload.title);
    expect(articleRef!.value.content).toBe(payload.content);

    cleanup();
  });

  it('re-renders when controller.setResponse() updates data', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      renderDataComposable(() =>
        useSuspense(CoolerArticleResource.get, { id: payload.id }),
      );

    // Wait for initial render
    await waitForNextUpdate();

    // Verify initial values
    const initialArticleRef = await result.current;
    expect(initialArticleRef!.value.title).toBe(payload.title);
    expect(initialArticleRef!.value.content).toBe(payload.content);

    // Update the store using controller.setResponse
    const newTitle = payload.title + ' updated';
    const newContent = (payload as any).content + ' v2';
    controller.setResponse(
      CoolerArticleResource.get,
      { id: payload.id },
      { ...payload, title: newTitle, content: newContent },
    );

    // Wait for re-render
    await waitForNextUpdate();

    const updatedArticleRef = await result.current;
    expect(updatedArticleRef!.value.title).toBe(newTitle);
    expect(updatedArticleRef!.value.content).toBe(newContent);

    cleanup();
  });

  it('re-renders when controller.fetch() mutates data', async () => {
    const { result, controller, waitForNextUpdate, cleanup } =
      renderDataComposable(() =>
        useSuspense(CoolerArticleResource.get, { id: payload.id }),
      );

    // Wait for initial render
    await waitForNextUpdate();

    // Verify initial values
    const initialArticleRef = await result.current;
    expect(initialArticleRef!.value.title).toBe(payload.title);
    expect(initialArticleRef!.value.content).toBe(payload.content);

    // Mutate the data using controller.fetch with update endpoint
    const updatedTitle = payload.title + ' mutated';
    const updatedContent = payload.content + ' mutated';

    await controller.fetch(
      CoolerArticleResource.update,
      { id: payload.id },
      { title: updatedTitle, content: updatedContent },
    );

    // Wait for re-render with new data
    await waitForNextUpdate();

    const updatedArticleRef = await result.current;
    expect(updatedArticleRef!.value.title).toBe(updatedTitle);
    expect(updatedArticleRef!.value.content).toBe(updatedContent);

    cleanup();
  });

  it('should re-fetch when props change', async () => {
    // Clean up persistent mocks to avoid conflicts
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
      async setup(props) {
        const article = await useSuspense(CoolerArticleResource.get, {
          id: props.id,
        });

        return () =>
          h('div', [
            h('h3', (article as any).value.title),
            h('p', (article as any).value.content),
          ]);
      },
    });

    // Use renderDataClient to properly set up the test environment
    const { wrapper, cleanup } = renderDataClient(ArticleWithProps, {
      initialProps: { id: payload.id },
    });

    // Wait for initial render and verify data
    await flushUntil(wrapper, () => wrapper.find('h3').exists());
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(wrapper.find('p').text()).toBe(payload.content);
    expect(fetchMock1).toHaveBeenCalledTimes(1);
    expect(fetchMock2).toHaveBeenCalledTimes(0);

    // Change the id prop - this should trigger re-suspense but currently doesn't
    await wrapper.setProps({ id: payload2.id });

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
    nock.cleanAll();
  });
});
