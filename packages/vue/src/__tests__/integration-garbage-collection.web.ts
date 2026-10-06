import { GCPolicy } from '@data-client/core';
import { defineComponent, h, reactive } from 'vue';

import { Article, ArticleResource } from '../../../../__tests__/new';
import useFetch from '../consumers/useFetch';
import useQuery from '../consumers/useQuery';
import useSuspense from '../consumers/useSuspense';
import { renderDataCompose, mountDataClient } from '../test';

const GC_INTERVAL = 100; // Use short interval for faster tests

describe('Integration Garbage Collection Web (Vue)', () => {
  let infoSpy: jest.SpyInstance;
  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    infoSpy.mockRestore();
    jest.useRealTimers();
  });

  it('should initialize with GCPolicy', () => {
    const gcPolicy = new GCPolicy({
      intervalMS: GC_INTERVAL,
      expiryMultiplier: 2,
    });
    expect(gcPolicy).toBeDefined();
  });

  it('should accept gcPolicy option in mountDataClient', () => {
    const TestComp = defineComponent({
      name: 'TestComp',
      setup() {
        return () => h('div', 'Hello');
      },
    });

    const gcPolicy = new GCPolicy({
      intervalMS: GC_INTERVAL,
      expiryMultiplier: 2,
    });

    const { wrapper, cleanup } = mountDataClient(TestComp, {
      gcPolicy,
    });

    expect(wrapper.text()).toContain('Hello');
    cleanup();
  });

  it('should work with useSuspense and GCPolicy', async () => {
    const articleData = {
      id: 1,
      title: 'Test Article',
      content: 'Test Content',
    };

    const { result, cleanup } = await renderDataCompose(
      () => useSuspense(ArticleResource.get, { id: 1 }),
      {
        initialFixtures: [
          {
            endpoint: ArticleResource.get,
            args: [{ id: 1 }],
            response: articleData,
          },
        ],
        gcPolicy: new GCPolicy({
          intervalMS: GC_INTERVAL,
          expiryMultiplier: 2,
        }),
      },
    );

    const articleRef = await result;
    expect(articleRef?.value.title).toBe(articleData.title);
    expect(articleRef?.value.content).toBe(articleData.content);

    cleanup();
  });

  it('useFetch should hold GC refs while mounted', async () => {
    const gcPolicy = new GCPolicy({
      intervalMS: GC_INTERVAL,
      expiryMultiplier: 2,
    });
    const decrement = jest.fn();
    const countRef = jest
      .spyOn(gcPolicy, 'createCountRef')
      .mockImplementation(() => () => decrement);

    const { cleanup } = await renderDataCompose(
      () => useFetch(ArticleResource.get, { id: 1 }),
      {
        initialFixtures: [
          {
            endpoint: ArticleResource.get,
            args: [{ id: 1 }],
            response: { id: 1, title: 'Test Article', content: 'Content' },
          },
        ],
        gcPolicy,
      },
    );

    expect(countRef).toHaveBeenCalledWith(
      expect.objectContaining({ key: ArticleResource.get.key({ id: 1 }) }),
    );
    expect(decrement).not.toHaveBeenCalled();

    cleanup();
    expect(decrement).toHaveBeenCalled();
  });

  it('should work with useQuery and GCPolicy', async () => {
    const articleListData = [
      { id: 1, title: 'Article 1', content: 'Content 1' },
      { id: 2, title: 'Article 2', content: 'Content 2' },
    ];

    const { result, cleanup } = await renderDataCompose(
      () => useQuery(ArticleResource.getList.schema),
      {
        initialFixtures: [
          {
            endpoint: ArticleResource.getList,
            args: [],
            response: articleListData,
          },
        ],
        gcPolicy: new GCPolicy({
          intervalMS: GC_INTERVAL,
          expiryMultiplier: 2,
        }),
      },
    );

    expect(result.value).toBeDefined();
    expect(result.value?.length).toBe(2);
    expect(result.value?.[0]).toBeInstanceOf(Article);

    cleanup();
  });

  it('should handle different expiryMultiplier values', () => {
    const articleData = {
      id: 1,
      title: 'Test Article',
      content: 'Test Content',
    };

    const TestComp = defineComponent({
      name: 'TestComp',
      setup() {
        return () => h('div', 'Test');
      },
    });

    // Test with expiryMultiplier of 4
    const { cleanup: cleanup1 } = mountDataClient(TestComp, {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 1 }],
          response: articleData,
        },
      ],
      gcPolicy: new GCPolicy({
        intervalMS: GC_INTERVAL,
        expiryMultiplier: 4,
      }),
    });

    cleanup1();

    // Test with expiryMultiplier of 2 (default in tests)
    const { cleanup: cleanup2 } = mountDataClient(TestComp, {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 1 }],
          response: articleData,
        },
      ],
      gcPolicy: new GCPolicy({
        intervalMS: GC_INTERVAL,
        expiryMultiplier: 2,
      }),
    });

    cleanup2();
  });

  it('removes unused stale data without passing a gcPolicy', async () => {
    jest.useFakeTimers();
    const ArticleDetail = defineComponent({
      name: 'ArticleDetail',
      setup() {
        const article = useQuery(Article, { id: 1 });
        return () => h('div', article.value?.title ?? 'missing');
      },
    });
    const props = reactive({ show: true });
    const TestComp = defineComponent({
      name: 'TestComp',
      props: ['show'],
      setup(props) {
        return () => (props.show ? h(ArticleDetail) : h('div', 'blank'));
      },
    });

    const { wrapper, controller, cleanup } = mountDataClient(TestComp, {
      props,
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 1 }],
          response: { id: 1, title: 'Test Article', content: 'Content' },
        },
      ],
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Test Article');

    props.show = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('blank');

    // default GCPolicy sweeps every 5 minutes; data must also be stale
    jest.advanceTimersByTime(60 * 1000 * 5);
    await Promise.resolve();
    expect(controller.getState().entities.Article?.['1']).toBeUndefined();

    cleanup();
  });
});
