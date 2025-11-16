import {
  Controller,
  NetworkManager,
  PollingSubscription,
  SubscriptionManager,
} from '@data-client/core';
import type { State } from '@data-client/core';
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { mount } from '@vue/test-utils';
import { defineComponent, h, inject, shallowRef } from 'vue';

import { CoolerArticleResource } from '../../../../../__tests__/new';
import useQuery from '../../consumers/useQuery';
import useSuspense from '../../consumers/useSuspense';
import { ControllerKey, StateKey } from '../../context';
import { MockPlugin } from '../../test/MockPlugin';
import { DataClientPlugin } from '../DataClientPlugin';

describe('MockPlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should install plugin with fixtures', () => {
    const payload = {
      id: 5,
      title: 'hi ho',
      content: 'whatever',
      tags: ['a', 'best', 'react'],
    };

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const controller = inject(ControllerKey);
        return () =>
          h('div', [
            h('div', { id: 'has-controller' }, controller ? 'yes' : 'no'),
            h(
              'div',
              { id: 'controller-type' },
              controller instanceof Controller ? 'Controller' : 'unknown',
            ),
          ]);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  args: [{ id: payload.id }],
                  response: payload,
                },
              ],
            },
          ],
        ],
      },
    });

    expect(wrapper.find('#has-controller').text()).toBe('yes');
    expect(wrapper.find('#controller-type').text()).toBe('Controller');

    wrapper.unmount();
  });

  it('should provide mocked controller that intercepts fetch requests', async () => {
    const payload = {
      id: 5,
      title: 'hi ho',
      content: 'whatever',
      tags: ['a', 'best', 'react'],
    };

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        // Verify controller is available (injected by MockPlugin)
        inject(ControllerKey);
        return () => h('div', { id: 'test' }, 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  args: [{ id: payload.id }],
                  response: payload,
                },
              ],
            },
          ],
        ],
      },
    });

    const controller = wrapper.vm.$dataClient as Controller;

    // Fetch should use the fixture
    const result = await controller.fetch(CoolerArticleResource.get, {
      id: payload.id,
    });

    expect(result.id).toBe(payload.id);
    expect(result.title).toBe(payload.title);
    expect(result.content).toBe(payload.content);
    expect(result.tags).toEqual(payload.tags);

    wrapper.unmount();
  });

  it('should work with multiple fixtures', async () => {
    const payload1 = {
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

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        return () => h('div', { id: 'test' }, 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  args: [{ id: payload1.id }],
                  response: payload1,
                },
                {
                  endpoint: CoolerArticleResource.get,
                  args: [{ id: payload2.id }],
                  response: payload2,
                },
              ],
            },
          ],
        ],
      },
    });

    const controller = wrapper.vm.$dataClient as Controller;

    // Fetch first fixture
    const result1 = await controller.fetch(CoolerArticleResource.get, {
      id: payload1.id,
    });
    expect(result1.id).toBe(payload1.id);
    expect(result1.title).toBe(payload1.title);
    expect(result1.content).toBe(payload1.content);
    expect(result1.tags).toEqual(payload1.tags);

    // Fetch second fixture
    const result2 = await controller.fetch(CoolerArticleResource.get, {
      id: payload2.id,
    });
    expect(result2.id).toBe(payload2.id);
    expect(result2.title).toBe(payload2.title);
    expect(result2.content).toBe(payload2.content);
    expect(result2.tags).toEqual(payload2.tags);

    wrapper.unmount();
  });

  it('should work with interceptors', async () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        return () => h('div', { id: 'test' }, 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  response: (...args: any[]) => {
                    const [{ id }] = args;
                    return {
                      id,
                      title: `Article ${id}`,
                      content: 'content',
                      tags: [],
                    };
                  },
                },
              ],
            },
          ],
        ],
      },
    });

    const controller = wrapper.vm.$dataClient as Controller;

    // Fetch with interceptor
    const result = await controller.fetch(CoolerArticleResource.get, { id: 7 });

    expect(result.id).toBe(7);
    expect(result.title).toBe('Article 7');

    wrapper.unmount();
  });

  it('should work with getInitialInterceptorData', async () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        return () => h('div', { id: 'test' }, 'test');
      },
    });

    const interceptorData = { count: 0 };

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  response: function (this: { count: number }, ...args: any[]) {
                    this.count++;
                    const [{ id }] = args;
                    return {
                      id,
                      title: `Article ${id} (call ${this.count})`,
                      content: 'content',
                      tags: [],
                    };
                  },
                },
              ],
              getInitialInterceptorData: () => interceptorData,
            },
          ],
        ],
      },
    });

    const controller = wrapper.vm.$dataClient as Controller;

    // First fetch
    const result1 = await controller.fetch(CoolerArticleResource.get, {
      id: 8,
    });
    expect(result1.title).toBe('Article 8 (call 1)');
    expect(interceptorData.count).toBe(1);

    // Second fetch - should increment
    const result2 = await controller.fetch(CoolerArticleResource.get, {
      id: 8,
    });
    expect(result2.title).toBe('Article 8 (call 2)');
    expect(interceptorData.count).toBe(2);

    wrapper.unmount();
  });

  it('should override controller provided by DataClientPlugin', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const controller = inject(ControllerKey);
        const state = inject(StateKey);
        return () =>
          h('div', [
            h('div', { id: 'has-controller' }, controller ? 'yes' : 'no'),
            h('div', { id: 'has-state' }, state ? 'yes' : 'no'),
          ]);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin], [MockPlugin, { fixtures: [] }]],
      },
    });

    expect(wrapper.find('#has-controller').text()).toBe('yes');
    expect(wrapper.find('#has-state').text()).toBe('yes');

    wrapper.unmount();
  });

  it('should handle empty fixtures array', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const controller = inject(ControllerKey);
        return () =>
          h('div', { id: 'has-controller' }, controller ? 'yes' : 'no');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin], [MockPlugin, { fixtures: [] }]],
      },
    });

    expect(wrapper.find('#has-controller').text()).toBe('yes');

    wrapper.unmount();
  });

  it('should handle undefined fixtures', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const controller = inject(ControllerKey);
        return () =>
          h('div', { id: 'has-controller' }, controller ? 'yes' : 'no');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DataClientPlugin], [MockPlugin, {}]],
      },
    });

    expect(wrapper.find('#has-controller').text()).toBe('yes');

    wrapper.unmount();
  });

  it('should log error when DataClientPlugin is not installed', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {
        // noop - suppress console.error for this test
      });

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        return () => h('div', 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[MockPlugin, { fixtures: [] }]],
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'DataClientPlugin must be installed before MockPlugin',
      ),
    );

    wrapper.unmount();
    consoleErrorSpy.mockRestore();
  });

  it('should work with custom managers from DataClientPlugin', () => {
    const customNetworkManager = new NetworkManager();
    const customSubscriptionManager = new SubscriptionManager(
      PollingSubscription,
    );
    const customManagers = [customNetworkManager, customSubscriptionManager];

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const controller = inject(ControllerKey);
        return () =>
          h('div', { id: 'has-controller' }, controller ? 'yes' : 'no');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin, { managers: customManagers }],
          [MockPlugin, { fixtures: [] }],
        ],
      },
    });

    expect(wrapper.find('#has-controller').text()).toBe('yes');

    wrapper.unmount();
  });

  it('should work with custom initialState from DataClientPlugin', () => {
    const customState: State<unknown> = {
      entities: {},
      indexes: {},
      endpoints: {},
      meta: {},
      entitiesMeta: {},
      optimistic: [],
      lastReset: Date.now(),
    };

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const stateRef = inject(StateKey);
        return () =>
          h(
            'div',
            {
              id: 'last-reset',
            },
            String(stateRef?.value?.lastReset),
          );
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin, { initialState: customState }],
          [MockPlugin, { fixtures: [] }],
        ],
      },
    });

    expect(wrapper.find('#last-reset').text()).toBe(
      String(customState.lastReset),
    );

    wrapper.unmount();
  });

  it('should maintain mocked controller across multiple components', () => {
    const payload = {
      id: 5,
      title: 'hi ho',
      content: 'whatever',
      tags: ['a', 'best', 'react'],
    };

    const controllers: any[] = [];

    const createTestComponent = (name: string) =>
      defineComponent({
        name,
        setup() {
          const controller = inject(ControllerKey);
          controllers.push(controller);
          return () => h('div', { id: name.toLowerCase() }, 'test');
        },
      });

    const ComponentA = createTestComponent('ComponentA');
    const ComponentB = createTestComponent('ComponentB');
    const ComponentC = createTestComponent('ComponentC');

    const ParentComponent = defineComponent({
      name: 'ParentComponent',
      setup() {
        return () => h('div', [h(ComponentA), h(ComponentB), h(ComponentC)]);
      },
    });

    const wrapper = mount(ParentComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  args: [{ id: payload.id }],
                  response: payload,
                },
              ],
            },
          ],
        ],
      },
    });

    // All components should receive the SAME mocked controller instance
    expect(controllers.length).toBe(3);
    expect(controllers[0]).toBe(controllers[1]);
    expect(controllers[1]).toBe(controllers[2]);

    // Verify it's a mocked controller (has fixtureMap)
    expect((controllers[0] as any).fixtureMap).toBeDefined();

    wrapper.unmount();
  });

  it('should update globalProperties.$dataClient with mocked controller', () => {
    const payload = {
      id: 5,
      title: 'hi ho',
      content: 'whatever',
      tags: ['a', 'best', 'react'],
    };

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        return () => h('div', { id: 'test' }, 'test');
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  args: [{ id: payload.id }],
                  response: payload,
                },
              ],
            },
          ],
        ],
      },
    });

    const controller = wrapper.vm.$dataClient as Controller;

    // Should be a mocked controller (has fixtureMap)
    expect((controller as any).fixtureMap).toBeDefined();

    wrapper.unmount();
  });

  it('should work with useSuspense composable', async () => {
    const payload = {
      id: 10,
      title: 'Suspense Test',
      content: 'Testing useSuspense with MockPlugin',
      tags: ['test', 'suspense'],
    };

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        // useSuspense returns a Promise that resolves to a ComputedRef
        const articlePromise = useSuspense(CoolerArticleResource.get, {
          id: payload.id,
        });
        // Store the promise in a ref so we can await it
        const articleRef = shallowRef<any>(null);
        articlePromise.then(article => {
          articleRef.value = article;
        });
        return () => {
          if (!articleRef.value) {
            return h('div', { id: 'loading' }, 'Loading...');
          }
          const article = articleRef.value;
          return h('div', [
            h('div', { id: 'article-id' }, String(article.value.id)),
            h('div', { id: 'article-title' }, article.value.title),
            h('div', { id: 'article-content' }, article.value.content),
          ]);
        };
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  args: [{ id: payload.id }],
                  response: payload,
                },
              ],
            },
          ],
        ],
      },
    });

    // Wait for suspense promise to resolve
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Verify the component rendered with the mocked data
    const articleId = wrapper.find('#article-id');
    expect(articleId.exists()).toBe(true);
    expect(articleId.text()).toBe(String(payload.id));

    const articleTitle = wrapper.find('#article-title');
    expect(articleTitle.exists()).toBe(true);
    expect(articleTitle.text()).toBe(payload.title);

    const articleContent = wrapper.find('#article-content');
    expect(articleContent.exists()).toBe(true);
    expect(articleContent.text()).toBe(payload.content);

    wrapper.unmount();
  });

  it('should work with useQuery composable', async () => {
    const payload = {
      id: 11,
      title: 'Query Test',
      content: 'Testing useQuery with MockPlugin',
      tags: ['test', 'query'],
    };

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const article = useQuery(CoolerArticleResource.get.schema!, {
          id: payload.id,
        });
        return () =>
          h('div', [
            h(
              'div',
              { id: 'article-id' },
              article.value ? String(article.value.id) : 'loading',
            ),
            h(
              'div',
              { id: 'article-title' },
              article.value ? article.value.title : 'loading',
            ),
          ]);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [
          [DataClientPlugin],
          [
            MockPlugin,
            {
              fixtures: [
                {
                  endpoint: CoolerArticleResource.get,
                  args: [{ id: payload.id }],
                  response: payload,
                },
              ],
            },
          ],
        ],
      },
    });

    // Wait for query to resolve
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Fetch the data to trigger the query
    const controller = wrapper.vm.$dataClient as Controller;
    await controller.fetch(CoolerArticleResource.get, { id: payload.id });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(wrapper.find('#article-id').text()).toBe(String(payload.id));
    expect(wrapper.find('#article-title').text()).toBe(payload.title);

    wrapper.unmount();
  });
});
