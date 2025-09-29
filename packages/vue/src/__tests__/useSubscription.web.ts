import { mount } from '@vue/test-utils';
import nock from 'nock';
import { defineComponent, h, nextTick, Suspense } from 'vue';

// Endpoints/entities from React subscriptions test
import {
  PollingArticleResource,
  ArticleResource,
} from '../../../../__tests__/new';
import useSubscription from '../consumers/useSubscription';
import useSuspense from '../consumers/useSuspense';
import { provideDataClient } from '../providers/provideDataClient';

describe('vue useSubscription()', () => {
  const payload = {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
  };

  // Mutable payload to simulate server-side updates with polling
  let currentPollingPayload: typeof payload = { ...payload };

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
    // Global network stubs reused by tests
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      // ArticleResource and PollingArticleResource both hit /article/:id
      .get(`/article/${payload.id}`)
      .reply(200, () => currentPollingPayload)
      .put(`/article/${payload.id}`)
      .reply(200, (uri, requestBody: any) => ({
        ...currentPollingPayload,
        ...requestBody,
      }));
  });

  afterAll(() => {
    nock.cleanAll();
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
            default: () => (slots.default ? slots.default() : null),
            fallback: () => h('div', { class: 'fallback' }, 'Loading'),
          },
        );
    },
  });

  const ArticleComp = defineComponent({
    name: 'ArticleComp',
    props: { active: { type: Boolean, default: true } },
    async setup(props) {
      // Subscribe BEFORE any await to preserve current instance for inject()
      useSubscription(
        PollingArticleResource.get,
        props.active ? { id: payload.id } : (null as any),
      );
      const article = await useSuspense(PollingArticleResource.get, {
        id: payload.id,
      });
      return () =>
        h('div', [
          h('h3', (article as any).value.title),
          h('p', (article as any).value.content),
        ]);
    },
  });

  it('subscribes and re-renders on updates (simulated poll)', async () => {
    currentPollingPayload = { ...payload };

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(ArticleComp, { active: true }) },
    });

    // Initially should render fallback while Suspense is pending
    expect(wrapper.find('.fallback').exists()).toBe(true);

    // Flush initial fetch
    await flushUntil(wrapper, () => wrapper.find('h3').exists());

    // Verify initial values
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(wrapper.find('p').text()).toBe(payload.content);

    // Simulate a polling update by changing server payload and manually fetching
    const updatedTitle = payload.title + ' fiver';
    currentPollingPayload = { ...payload, title: updatedTitle } as any;
    const exposed: any = wrapper.vm as any;
    await exposed.controller.fetch(PollingArticleResource.get, {
      id: payload.id,
    });

    await flushUntil(wrapper, () => wrapper.find('h3').text() === updatedTitle);
    expect(wrapper.find('h3').text()).toBe(updatedTitle);
  });

  it('can subscribe to endpoint without pollFrequency (no-op) and render', async () => {
    // Minimal component that subscribes to non-polling endpoint
    const NoFreqComp = defineComponent({
      name: 'NoFreqComp',
      async setup() {
        // Subscribe first (no poller attached)
        useSubscription(ArticleResource.get, { id: payload.id } as any);
        // Then resolve suspense for stable render
        const article = await useSuspense(ArticleResource.get, {
          id: payload.id,
        });
        return () => h('div', (article as any).value.title);
      },
    });

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(NoFreqComp) },
    });

    await flushUntil(wrapper, () => wrapper.text() !== '');
    expect(wrapper.text()).not.toEqual('');
  });
});
