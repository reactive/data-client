import { mount } from '@vue/test-utils';
import nock from 'nock';
import { defineComponent, h, nextTick, Suspense, inject } from 'vue';

import { PollingArticleResource } from '../../../../__tests__/new';
import useLive from '../consumers/useLive';
import { ControllerKey } from '../context';
import { DataClientPlugin } from '../providers/DataClientPlugin';

// Minimal shared fixture (copied from React test fixtures)
const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

// Mutable payload to simulate server-side updates with polling
let currentPollingPayload: typeof payload = { ...payload };

describe('vue useLive()', () => {
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
      .reply(200, () => currentPollingPayload)
      .put(`/article-cooler/${payload.id}`)
      .reply(200, (uri, requestBody: any) => ({
        ...currentPollingPayload,
        ...requestBody,
      }))
      // PollingArticleResource hits /article/:id
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

  const PollingArticleComp = defineComponent({
    name: 'PollingArticleComp',
    async setup() {
      const article = await useLive(PollingArticleResource.get, {
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
      const controller = inject(ControllerKey);
      expose({ controller });
      return () =>
        h(
          Suspense,
          {},
          {
            default: () =>
              slots.default ? slots.default() : h(PollingArticleComp),
            fallback: () => h('div', { class: 'fallback' }, 'Loading'),
          },
        );
    },
  });

  it('suspends on empty store, then renders after fetch resolves', async () => {
    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(PollingArticleComp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
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
      slots: { default: () => h(PollingArticleComp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
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
      PollingArticleResource.get,
      { id: payload.id },
      { ...payload, title: newTitle, content: newContent },
    );

    await flushUntil(wrapper, () => wrapper.find('h3').text() === newTitle);

    expect(wrapper.find('h3').text()).toBe(newTitle);
    expect(wrapper.find('p').text()).toBe(newContent);
  });

  it('stays subscribed and reacts to server updates', async () => {
    // This test verifies that useLive includes subscription behavior with polling
    // Set up fake timers before mounting so subscription interval is created under fake timers
    jest.useFakeTimers();
    currentPollingPayload = { ...payload };

    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(PollingArticleComp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // Initially should render fallback while Suspense is pending
    expect(wrapper.find('.fallback').exists()).toBe(true);

    // Advance timers and flush until initial fetch completes
    // Try multiple small advances to allow promises to resolve between timer ticks
    for (let i = 0; i < 100 && !wrapper.find('h3').exists(); i++) {
      await jest.advanceTimersByTimeAsync(frequency / 10);
      await nextTick();
    }

    // Verify initial values
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(wrapper.find('p').text()).toBe(payload.content);

    // Simulate a polling update by changing server payload
    const updatedTitle = payload.title + ' fiver';
    currentPollingPayload = { ...payload, title: updatedTitle } as any;

    // Advance timers to trigger the next poll and wait for update
    for (let i = 0; i < 20 && wrapper.find('h3').text() !== updatedTitle; i++) {
      await jest.advanceTimersByTimeAsync(frequency / 10);
      await nextTick();
    }

    expect(wrapper.find('h3').text()).toBe(updatedTitle);

    jest.useRealTimers();
  });
});
