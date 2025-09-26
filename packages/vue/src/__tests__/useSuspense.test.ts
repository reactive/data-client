import { resource, Entity } from '@data-client/rest';
import { describe, it, expect } from '@jest/globals';
import { mount } from '@vue/test-utils';
import { defineComponent, h, Suspense, nextTick } from 'vue';

import useSuspense from '../composables/useSuspense.js';
import { DataProvider, useController } from '../index.js';

class Article extends Entity {
  id = 0;
  title = '';
  static key = 'Article';
}

const ArticleResource = resource({
  path: '/articles/:id',
  schema: Article,
});

function delay<T>(v: T, ms = 1) {
  return new Promise<T>(resolve => setTimeout(() => resolve(v), ms));
}

describe('useSuspense (vue)', () => {
  it('renders data when preset via controller', async () => {
    // Combined component ensures preset happens before the child ArticleView's async setup runs
    const Combined = defineComponent({
      name: 'Combined',
      setup() {
        const ctrl = useController();
        ctrl.setResponse(
          ArticleResource.get,
          { id: 5 },
          { id: 5, title: 'Hello Vue' },
        );
        return () => h(ArticleView);
      },
    });

    // Component that awaits data via useSuspense
    const ArticleView = defineComponent({
      name: 'ArticleView',
      async setup() {
        const data = await useSuspense(ArticleResource.get, { id: 5 });
        return () => h('div', data.value.title);
      },
    });

    const App = defineComponent({
      name: 'App',
      setup() {
        return () =>
          h(
            DataProvider as any,
            {},
            { default: () => h(Suspense, {}, { default: () => h(Combined) }) },
          );
      },
    });

    const wrapper = mount(App);
    await nextTick();
    await delay(0);
    expect(wrapper.html()).toContain('Hello Vue');
  });
});
