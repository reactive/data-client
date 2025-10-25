import { GCPolicy } from '@data-client/core';
import { defineComponent, h } from 'vue';

import { Article, ArticleResource } from '../../../../__tests__/new';
import useQuery from '../consumers/useQuery';
import useSuspense from '../consumers/useSuspense';
import { renderDataClient, mountDataClient } from '../test';

const GC_INTERVAL = 100; // Use short interval for faster tests

describe('Integration Garbage Collection Web (Vue)', () => {
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

    const { result, cleanup, waitForNextUpdate } = renderDataClient(
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

    await waitForNextUpdate();

    const articleRef = await result.current;
    expect(articleRef?.value.title).toBe(articleData.title);
    expect(articleRef?.value.content).toBe(articleData.content);

    cleanup();
  });

  it('should work with useQuery and GCPolicy', () => {
    const articleListData = [
      { id: 1, title: 'Article 1', content: 'Content 1' },
      { id: 2, title: 'Article 2', content: 'Content 2' },
    ];

    const { result, cleanup } = renderDataClient(
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

    expect(result.current?.value).toBeDefined();
    expect(result.current?.value?.length).toBe(2);
    expect(result.current?.value?.[0]).toBeInstanceOf(Article);

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
});
