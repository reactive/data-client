import { mount } from '@vue/test-utils';
import nock from 'nock';
import { defineComponent, h, nextTick, Suspense } from 'vue';

// Reuse the same endpoints/fixtures used by the React tests
import { CoolerArticleResource } from '../../../../__tests__/new';
// Minimal shared fixture (copied from React test fixtures)
const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};
import useSuspense from '../consumers/useSuspense';
import { provideDataClient } from '../providers/provideDataClient';

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
      .put(`/article-cooler/${payload.id}`)
      .reply(200, (uri, requestBody: any) => ({
        ...payload,
        ...requestBody,
      }));
  });

  afterAll(() => {
    nock.cleanAll();
  });

  const ArticleComp = defineComponent({
    name: 'ArticleComp',
    async setup() {
      const article = await useSuspense(CoolerArticleResource.get, {
        id: payload.id,
      });
      return () =>
        h('div', [
          h('h3', (article as any).value.title),
          h('p', (article as any).value.content),
        ]);
    },
  });

  const ProvideWrapper = defineComponent({
    name: 'ProvideWrapper',
    setup(_props, { slots, expose }) {
      const { controller } = provideDataClient();
      expose({ controller });
      return () =>
        h(
          Suspense,
          {},
          {
            default: () => (slots.default ? slots.default() : h(ArticleComp)),
            fallback: () => h('div', { class: 'fallback' }, 'Loading'),
          },
        );
    },
  });

  it('suspends on empty store, then renders after fetch resolves', async () => {
    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(ArticleComp) },
    });

    // Initially should render fallback while Suspense is pending
    expect(wrapper.find('.fallback').exists()).toBe(true);

    // Flush pending promises/ticks until content renders
    await flushUntil(wrapper, () => wrapper.find('h3').exists());

    const title = wrapper.find('h3');
    const content = wrapper.find('p');
    expect(title.exists()).toBe(true);
    expect(content.exists()).toBe(true);
    expect(title.text()).toBe(payload.title);
    expect(content.text()).toBe(payload.content);
  });

  it('re-renders when controller.setResponse() updates data', async () => {
    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(ArticleComp) },
    });
    // Wait for initial render
    await flushUntil(wrapper, () => wrapper.find('h3').exists());

    // Verify initial values
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(wrapper.find('p').text()).toBe(payload.content);

    // Update the store using controller.setResponse
    const exposed: any = wrapper.vm as any;
    const newTitle = payload.title + ' updated';
    const newContent = (payload as any).content + ' v2';
    exposed.controller.setResponse(
      CoolerArticleResource.get,
      { id: payload.id },
      { ...payload, title: newTitle, content: newContent },
    );

    await flushUntil(wrapper, () => wrapper.find('h3').text() === newTitle);

    expect(wrapper.find('h3').text()).toBe(newTitle);
    expect(wrapper.find('p').text()).toBe(newContent);
  });

  it('re-renders when controller.fetch() mutates data', async () => {
    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(ArticleComp) },
    });
    // Wait for initial render
    await flushUntil(wrapper, () => wrapper.find('h3').exists());

    // Verify initial values
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(wrapper.find('p').text()).toBe(payload.content);

    // Mutate the data using controller.fetch with update endpoint
    const exposed: any = wrapper.vm as any;
    const updatedTitle = payload.title + ' mutated';
    const updatedContent = payload.content + ' mutated';

    await exposed.controller.fetch(
      CoolerArticleResource.update,
      { id: payload.id },
      { title: updatedTitle, content: updatedContent },
    );

    // Wait for re-render with new data
    await flushUntil(wrapper, () => wrapper.find('h3').text() === updatedTitle);

    expect(wrapper.find('h3').text()).toBe(updatedTitle);
    expect(wrapper.find('p').text()).toBe(updatedContent);
  });
});
