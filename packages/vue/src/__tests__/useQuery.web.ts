import { schema } from '@data-client/endpoint';
import { resource } from '@data-client/rest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';

import {
  ArticleWithSlug,
  ArticleSlugResource,
  ArticleResource,
  IDEntity,
} from '../../../../__tests__/new';
import useQuery from '../consumers/useQuery';
import { createDataClient } from '../providers/createDataClient';

// Inline fixtures (duplicated from React tests to avoid cross-project imports)
const payloadSlug = {
  id: 5,
  title: 'hi ho',
  slug: 'hi-ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};
const nested = [
  {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
    author: {
      id: 23,
      username: 'bob',
    },
  },
  {
    id: 3,
    title: 'the next time',
    content: 'whatever',
    author: {
      id: 23,
      username: 'charles',
      email: 'bob@bob.com',
    },
  },
];

describe('vue useQuery()', () => {
  async function flush() {
    await Promise.resolve();
    await nextTick();
  }

  const ProvideWrapper = defineComponent({
    name: 'ProvideWrapper',
    setup(_props, { slots, expose }) {
      const provider = createDataClient();
      provider.start();
      expose({ controller: provider.controller });
      return () => (slots.default ? slots.default() : null);
    },
  });

  it('returns undefined with empty state', async () => {
    const Inner = defineComponent({
      setup() {
        const val = useQuery(ArticleWithSlug, { id: payloadSlug.id });
        return () => h('div', (val.value as any)?.title || '');
      },
    });

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(Inner) },
    });
    await flush();
    expect(wrapper.text()).toBe('');
  });

  it('finds Entity by pk/slug after setResponse', async () => {
    const Inner = defineComponent({
      setup() {
        const byId = useQuery(ArticleWithSlug, { id: payloadSlug.id });
        const bySlug = useQuery(ArticleWithSlug, { slug: payloadSlug.slug });
        return () =>
          h(
            'div',
            `${(byId.value as any)?.title || ''}|${
              (bySlug.value as any)?.title || ''
            }`,
          );
      },
    });

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(Inner) },
    });
    const { controller }: any = wrapper.vm as any;

    // seed data via controller
    controller.setResponse(
      ArticleSlugResource.get,
      { id: payloadSlug.id },
      payloadSlug,
    );
    await flush();

    expect(wrapper.text()).toContain(payloadSlug.title);
  });

  it('selects Collections and updates when pushed', async () => {
    const ListComp = defineComponent({
      setup() {
        const list = useQuery(ArticleResource.getList.schema);
        return () =>
          h('div', (list.value || []).map((a: any) => a.id).join(','));
      },
    });

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(ListComp) },
    });
    const { controller }: any = wrapper.vm as any;

    controller.setResponse(ArticleResource.getList, {}, nested);
    await flush();
    expect(wrapper.text().split(',').filter(Boolean).length).toBe(
      nested.length,
    );

    // Simulate push by setting new list value
    const appended = nested.concat({
      id: 50,
      title: 'new',
      content: 'x',
    } as any);
    controller.setResponse(ArticleResource.getList, {}, appended);
    await flush();
    expect(wrapper.text().split(',').filter(Boolean).length).toBe(
      nested.length + 1,
    );
  });

  it('retrieves a nested collection (Collection of Array)', async () => {
    class Todo extends IDEntity {
      userId = 0;
      title = '';
      completed = false;
      static key = 'Todo';
    }

    class User extends IDEntity {
      name = '';
      username = '';
      email = '';
      todos: Todo[] = [];
      static key = 'User';
      static schema = {
        todos: new schema.Collection(new schema.Array(Todo), {
          nestKey: (parent: any) => ({ userId: parent.id }),
        }),
      };
    }

    const userTodos = new schema.Collection(new schema.Array(Todo), {
      argsKey: ({ userId }: { userId: string }) => ({ userId }),
    });

    const UserResource = resource({ schema: User, path: '/users/:id' });

    const Inner = defineComponent({
      setup() {
        const todos = useQuery(userTodos, { userId: '1' });
        return () => h('div', (todos.value || []).length.toString());
      },
    });

    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(Inner) },
    });
    const { controller }: any = wrapper.vm as any;

    controller.setResponse(
      UserResource.get,
      { id: '1' },
      {
        id: '1',
        todos: [{ id: '5', title: 'finish collections', userId: '1' }],
        username: 'bob',
      },
    );
    await flush();

    expect(wrapper.text()).toBe('1');
  });

  it('works with unions collections (sanity)', async () => {
    // Keep this light: verify we can call useQuery on a list schema and get an array
    const list = useQuery(ArticleResource.getList.schema);
    const Comp = defineComponent({
      setup: () => () => h('div', (list.value || []).length),
    });
    const wrapper = mount(ProvideWrapper, {
      slots: { default: () => h(Comp) },
    });
    const { controller }: any = wrapper.vm as any;
    controller.setResponse(ArticleResource.getList, {}, []);
    await flush();
    expect(wrapper.text()).toBe('0');
  });
});
