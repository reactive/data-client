import { mount } from '@vue/test-utils';
import nock from 'nock';
import { defineComponent, h, nextTick } from 'vue';

// Reuse the same endpoints/fixtures used by the React tests
import {
  CoolerArticleResource,
  StaticArticleResource,
} from '../../../../__tests__/new';
// Minimal shared fixture (copied from React test fixtures)
const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};
import useFetch from '../consumers/useFetch';
import { provideDataClient } from '../providers/provideDataClient';

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

  const ProvideWrapper = defineComponent({
    name: 'ProvideWrapper',
    setup(_props, { slots, expose }) {
      const { controller } = provideDataClient();
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

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(Comp) },
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

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(Comp) },
    });
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);

    // change params and remount child to re-run setup
    params = { id: payload.id };
    wrapper.unmount();
    const wrapper2 = mount(ProvideWrapper, {
      slots: { default: () => h(Comp) },
    });
    await flushUntil(wrapper2, () => fetchMock.mock.calls.length > 0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should respect expiry and not refetch when fresh', async () => {
    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-cooler/${payload.id}`).reply(200, fetchMock);

    const Child = defineComponent({
      name: 'FetchChild',
      setup() {
        useFetch(CoolerArticleResource.get, { id: payload.id });
        return () => h('div');
      },
    });

    const Parent = defineComponent({
      name: 'Parent',
      setup(_props, { expose }) {
        const { controller } = provideDataClient();
        let idx = 0;
        const remount = () => {
          idx++;
        };
        expose({ controller, remount });
        return () => h('div', [h(Child, { key: idx })]);
      },
    });

    const wrapper = mount(Parent);
    await flushUntil(wrapper, () => fetchMock.mock.calls.length > 0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Remount child inside same provider should not refetch while data is fresh
    (wrapper.vm as any).remount();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should dispatch with resource and endpoint expiry overrides', async () => {
    const mock1 = jest.fn(() => payload);
    const mock2 = jest.fn(() => payload);
    const mock3 = jest.fn(() => payload);

    mynock
      .get(`/article-static/${payload.id}`)
      .reply(200, mock1)
      .get(`/article-static/${payload.id}`)
      .reply(200, mock2)
      .get(`/article-static/${payload.id}`)
      .reply(200, mock3);

    const Comp1 = defineComponent({
      name: 'FetchStaticGet',
      setup() {
        useFetch(StaticArticleResource.get, { id: payload.id });
        return () => h('div');
      },
    });
    const Comp2 = defineComponent({
      name: 'FetchStaticLong',
      setup() {
        useFetch(StaticArticleResource.longLiving, { id: payload.id });
        return () => h('div');
      },
    });
    const Comp3 = defineComponent({
      name: 'FetchStaticNeverRetry',
      setup() {
        useFetch(StaticArticleResource.neverRetryOnError, { id: payload.id });
        return () => h('div');
      },
    });

    const w1 = mount(ProvideWrapper, { slots: { default: () => h(Comp1) } });
    await flushUntil(w1, () => mock1.mock.calls.length > 0);
    expect(mock1).toHaveBeenCalled();

    const w2 = mount(ProvideWrapper, { slots: { default: () => h(Comp2) } });
    await flushUntil(w2, () => mock2.mock.calls.length > 0);
    expect(mock2).toHaveBeenCalled();

    const w3 = mount(ProvideWrapper, { slots: { default: () => h(Comp3) } });
    await flushUntil(w3, () => mock3.mock.calls.length > 0);
    expect(mock3).toHaveBeenCalled();
  });
});
