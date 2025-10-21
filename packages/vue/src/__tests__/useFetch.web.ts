import { mount } from '@vue/test-utils';
import nock from 'nock';
import { defineComponent, h, nextTick, reactive, inject } from 'vue';

// Reuse the same endpoints/fixtures used by the React tests
import {
  CoolerArticleResource,
  StaticArticleResource,
} from '../../../../__tests__/new';
import useFetch from '../consumers/useFetch';
import { ControllerKey } from '../context';
import { DataClientPlugin } from '../providers/DataClientPlugin';

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

async function flush() {
  await Promise.resolve();
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
}

async function flushUntil(wrapper: any, predicate: () => boolean, tries = 100) {
  for (let i = 0; i < tries; i++) {
    if (predicate()) return;
    await flush();
  }
}

describe('vue useFetch()', () => {
  let mynock: nock.Scope;
  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200);
  });
  beforeEach(() => {
    mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Access-Token',
      'Content-Type': 'application/json',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  const TestWrapper = defineComponent({
    name: 'TestWrapper',
    setup(_props, { slots, expose }) {
      const controller = inject(ControllerKey);
      expose({ controller });
      return () => (slots.default ? slots.default() : h('div'));
    },
  });

  it('should dispatch singles', async () => {
    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-cooler/${payload.id}`).reply(200, fetchMock);

    const Comp = defineComponent({
      name: 'FetchTester',
      setup() {
        const p = useFetch(CoolerArticleResource.get, { id: payload.id });
        return () => h('div', { class: 'root' }, String(!!p));
      },
    });

    const wrapper = mount(TestWrapper, {
      slots: { default: () => h(Comp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // Wait for the fetch to happen
    await flushUntil(wrapper, () => fetchMock.mock.calls.length > 0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should not dispatch with null params, then dispatch after set', async () => {
    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-cooler/${payload.id}`).reply(200, fetchMock);

    let params: any = null;
    const Comp = defineComponent({
      name: 'FetchTesterNull',
      setup() {
        // reactive params via closure re-render with slot remount
        useFetch(CoolerArticleResource.get as any, params);
        return () => h('div');
      },
    });

    const wrapper = mount(TestWrapper, {
      slots: { default: () => h(Comp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);

    // change params and remount child to re-run setup
    params = { id: payload.id };
    wrapper.unmount();
    const wrapper2 = mount(TestWrapper, {
      slots: { default: () => h(Comp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });
    await flushUntil(wrapper2, () => fetchMock.mock.calls.length > 0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should respect expiry and not refetch when fresh', async () => {
    const fetchMock = jest.fn(() => payload);
    mynock
      .get(`/article-cooler/${payload.id}`)
      .reply(200, fetchMock)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, fetchMock);

    const Child = defineComponent({
      name: 'FetchChild',
      setup() {
        useFetch(CoolerArticleResource.get, { id: payload.id });
        return () => h('div');
      },
    });

    // First mount - should fetch
    const wrapper1 = mount(TestWrapper, {
      slots: { default: () => h(Child) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });
    await flushUntil(wrapper1, () => fetchMock.mock.calls.length > 0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second mount with same data - will refetch since it's a separate instance
    const wrapper2 = mount(TestWrapper, {
      slots: { default: () => h(Child) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });
    await flushUntil(wrapper2, () => fetchMock.mock.calls.length > 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should dispatch with resource defined dataExpiryLength', async () => {
    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-static/${payload.id}`).reply(200, fetchMock);

    const Comp = defineComponent({
      name: 'FetchStaticGet',
      setup() {
        useFetch(StaticArticleResource.get, { id: payload.id });
        return () => h('div');
      },
    });

    const wrapper = mount(TestWrapper, {
      slots: { default: () => h(Comp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });
    await flushUntil(wrapper, () => fetchMock.mock.calls.length > 0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should dispatch with fetch shape defined dataExpiryLength', async () => {
    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-static/${payload.id}`).reply(200, fetchMock);

    const Comp = defineComponent({
      name: 'FetchStaticLong',
      setup() {
        useFetch(StaticArticleResource.longLiving, { id: payload.id });
        return () => h('div');
      },
    });

    const wrapper = mount(TestWrapper, {
      slots: { default: () => h(Comp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });
    await flushUntil(wrapper, () => fetchMock.mock.calls.length > 0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should dispatch with fetch shape defined errorExpiryLength', async () => {
    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-static/${payload.id}`).reply(200, fetchMock);

    const Comp = defineComponent({
      name: 'FetchStaticNeverRetry',
      setup() {
        useFetch(StaticArticleResource.neverRetryOnError, { id: payload.id });
        return () => h('div');
      },
    });

    const wrapper = mount(TestWrapper, {
      slots: { default: () => h(Comp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });
    await flushUntil(wrapper, () => fetchMock.mock.calls.length > 0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should not refetch after expiry and render', async () => {
    let time = 1000;
    const originalDateNow = Date.now;
    global.Date.now = jest.fn(() => time);

    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-cooler/${payload.id}`).reply(200, fetchMock).persist();

    // Create wrapper with initial cached data
    const WrapperWithFixture = defineComponent({
      name: 'TestWrapperWithFixture',
      setup(_props, { slots, expose }) {
        const controller = inject(ControllerKey)!;
        // Set initial cached data using controller
        controller.setResponse(
          CoolerArticleResource.get,
          { id: payload.id },
          payload,
        );
        expose({ controller });
        return () => (slots.default ? slots.default() : h('div'));
      },
    });

    const Comp = defineComponent({
      name: 'FetchTesterExpiry',
      setup() {
        useFetch(CoolerArticleResource.get, { id: payload.id });
        return () => h('div', { class: 'test' });
      },
    });

    const wrapper = mount(WrapperWithFixture, {
      slots: { default: () => h(Comp) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);

    // Advance time but not beyond expiry
    time += 100;
    await wrapper.vm.$forceUpdate();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);

    // Advance time way beyond expiry
    time += 610000000;
    await wrapper.vm.$forceUpdate();
    await flush();
    await wrapper.vm.$forceUpdate();
    await flush();
    // useFetch should not refetch even after expiry on re-render
    expect(fetchMock).toHaveBeenCalledTimes(0);

    global.Date.now = originalDateNow;
  });

  it('should re-fetch when props change', async () => {
    const fetchMock1 = jest.fn(() => payload);
    const fetchMock2 = jest.fn(() => payload2);

    mynock
      .get(`/article-cooler/${payload.id}`)
      .reply(200, fetchMock1)
      .get(`/article-cooler/${payload2.id}`)
      .reply(200, fetchMock2);

    // Use a reactive object that will be shared
    const params = reactive({ id: payload.id });

    const ArticleWithReactiveParams = defineComponent({
      name: 'ArticleWithReactiveParams',
      setup() {
        // Pass the reactive object - Vue will track property access
        useFetch(CoolerArticleResource.get, params);
        return () => h('div', { class: 'article' }, `Article ${params.id}`);
      },
    });

    const wrapper = mount(TestWrapper, {
      slots: { default: () => h(ArticleWithReactiveParams) },
      global: {
        plugins: [[DataClientPlugin]],
      },
    });

    // Wait for the first fetch to happen
    await flushUntil(wrapper, () => fetchMock1.mock.calls.length > 0);
    expect(fetchMock1).toHaveBeenCalledTimes(1);
    expect(fetchMock2).toHaveBeenCalledTimes(0);

    // Update the reactive object to trigger re-fetch
    params.id = payload2.id;
    await flush();

    // Wait for the second fetch to happen
    await flushUntil(wrapper, () => fetchMock2.mock.calls.length > 0);
    expect(fetchMock1).toHaveBeenCalledTimes(1);
    expect(fetchMock2).toHaveBeenCalledTimes(1);
  });
});
