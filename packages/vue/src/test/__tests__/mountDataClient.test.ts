import { defineComponent, h, computed, watch, reactive, nextTick } from 'vue';

import { CoolerArticleResource } from '../../../../../__tests__/new';
import { mountDataClient } from '../mountDataClient';

describe('mountDataClient', () => {
  const payload = {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
  };

  describe('basic behaviors', () => {
    it('should render a component', () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        setup() {
          return () => h('div', { 'data-testid': 'test' }, 'Hello World');
        },
      });

      const { wrapper, cleanup } = mountDataClient(TestComponent);

      expect(wrapper.find('[data-testid="test"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="test"]').text()).toBe('Hello World');

      cleanup();
    });

    it('should provide a controller', () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        setup() {
          return () => h('div', 'Test');
        },
      });

      const { controller, cleanup } = mountDataClient(TestComponent);

      expect(controller).toBeDefined();
      expect(controller.fetch).toBeDefined();
      expect(controller.setResponse).toBeDefined();

      cleanup();
    });

    it('should pass props to component', () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        props: {
          message: {
            type: String,
            required: true,
          },
          count: {
            type: Number,
            required: true,
          },
        },
        setup(props) {
          return () =>
            h('div', [
              h('span', { 'data-testid': 'message' }, props.message),
              h('span', { 'data-testid': 'count' }, String(props.count)),
            ]);
        },
      });

      const props = reactive({ message: 'Hello', count: 42 });
      const { wrapper, cleanup } = mountDataClient(TestComponent, { props });

      expect(wrapper.find('[data-testid="message"]').text()).toBe('Hello');
      expect(wrapper.find('[data-testid="count"]').text()).toBe('42');

      cleanup();
    });

    it('should handle Suspense fallback', () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        setup() {
          return () => h('div', 'Test');
        },
      });

      const { wrapper, cleanup } = mountDataClient(TestComponent);

      // The component should eventually render (not stuck in fallback)
      expect(wrapper.find('[data-testid="suspense-fallback"]').exists()).toBe(
        false,
      );

      cleanup();
    });

    it('should provide initial fixtures to the store', async () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        setup() {
          return () => h('div', 'Test');
        },
      });

      const { controller, cleanup } = mountDataClient(TestComponent, {
        initialFixtures: [
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      });

      // Just verify that we can render with fixtures
      expect(controller).toBeDefined();

      cleanup();
    });

    it('should cleanup properly', () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        setup() {
          return () => h('div', { 'data-testid': 'test-div' }, 'Test');
        },
      });

      const { wrapper, cleanup } = mountDataClient(TestComponent);

      expect(wrapper.find('[data-testid="test-div"]').exists()).toBe(true);

      // Cleanup should not throw
      expect(() => cleanup()).not.toThrow();
    });

    it('should handle allSettled()', async () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        setup() {
          return () => h('div', 'Test');
        },
      });

      const { allSettled, cleanup } = mountDataClient(TestComponent);

      const result = await allSettled();

      expect(Array.isArray(result)).toBe(true);

      cleanup();
    });
  });

  describe('reactive prop changes', () => {
    it('should re-render when reactive props change', async () => {
      const renderSpy = jest.fn();

      const TestComponent = defineComponent({
        name: 'TestComponent',
        props: {
          message: {
            type: String,
            required: true,
          },
        },
        setup(props) {
          return () => {
            renderSpy();
            return h('div', { 'data-testid': 'message' }, props.message);
          };
        },
      });

      const props = reactive({ message: 'Initial' });
      const { wrapper, cleanup } = mountDataClient(TestComponent, { props });

      // Initial render
      expect(wrapper.find('[data-testid="message"]').text()).toBe('Initial');
      const initialCallCount = renderSpy.mock.calls.length;

      // Change props - should trigger re-render
      props.message = 'Updated';
      await nextTick();

      expect(wrapper.find('[data-testid="message"]').text()).toBe('Updated');
      expect(renderSpy.mock.calls.length).toBeGreaterThan(initialCallCount);

      cleanup();
    });

    it('should re-render when multiple props change', async () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        props: {
          title: {
            type: String,
            required: true,
          },
          count: {
            type: Number,
            required: true,
          },
          enabled: {
            type: Boolean,
            required: true,
          },
        },
        setup(props) {
          return () =>
            h('div', [
              h('h1', { 'data-testid': 'title' }, props.title),
              h('span', { 'data-testid': 'count' }, String(props.count)),
              h(
                'span',
                { 'data-testid': 'enabled' },
                props.enabled ? 'Yes' : 'No',
              ),
            ]);
        },
      });

      const props = reactive({
        title: 'Original',
        count: 0,
        enabled: false,
      });
      const { wrapper, cleanup } = mountDataClient(TestComponent, { props });

      // Initial state
      expect(wrapper.find('[data-testid="title"]').text()).toBe('Original');
      expect(wrapper.find('[data-testid="count"]').text()).toBe('0');
      expect(wrapper.find('[data-testid="enabled"]').text()).toBe('No');

      // Change all props
      props.title = 'Changed';
      props.count = 42;
      props.enabled = true;
      await nextTick();

      expect(wrapper.find('[data-testid="title"]').text()).toBe('Changed');
      expect(wrapper.find('[data-testid="count"]').text()).toBe('42');
      expect(wrapper.find('[data-testid="enabled"]').text()).toBe('Yes');

      cleanup();
    });

    it('should handle nested reactive objects', async () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        props: {
          user: {
            type: Object,
            required: true,
          },
        },
        setup(props) {
          return () =>
            h('div', [
              h('span', { 'data-testid': 'name' }, (props.user as any).name),
              h(
                'span',
                { 'data-testid': 'age' },
                String((props.user as any).age),
              ),
            ]);
        },
      });

      const props = reactive({
        user: { name: 'Alice', age: 25 },
      });
      const { wrapper, cleanup } = mountDataClient(TestComponent, { props });

      // Initial state
      expect(wrapper.find('[data-testid="name"]').text()).toBe('Alice');
      expect(wrapper.find('[data-testid="age"]').text()).toBe('25');

      // Update nested property
      props.user = { name: 'Bob', age: 30 };
      await nextTick();

      expect(wrapper.find('[data-testid="name"]').text()).toBe('Bob');
      expect(wrapper.find('[data-testid="age"]').text()).toBe('30');

      cleanup();
    });

    it('should trigger component computed values when props change', async () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        props: {
          firstName: {
            type: String,
            required: true,
          },
          lastName: {
            type: String,
            required: true,
          },
        },
        setup(props) {
          const fullName = computed(
            () => `${props.firstName} ${props.lastName}`,
          );

          return () => h('div', { 'data-testid': 'full-name' }, fullName.value);
        },
      });

      const props = reactive({
        firstName: 'John',
        lastName: 'Doe',
      });
      const { wrapper, cleanup } = mountDataClient(TestComponent, { props });

      // Initial computed value
      expect(wrapper.find('[data-testid="full-name"]').text()).toBe('John Doe');

      // Change first name only
      props.firstName = 'Jane';
      await nextTick();

      expect(wrapper.find('[data-testid="full-name"]').text()).toBe('Jane Doe');

      // Change last name
      props.lastName = 'Smith';
      await nextTick();

      expect(wrapper.find('[data-testid="full-name"]').text()).toBe(
        'Jane Smith',
      );

      cleanup();
    });

    it('should trigger component watchers when props change', async () => {
      const watchSpy = jest.fn();

      const TestComponent = defineComponent({
        name: 'TestComponent',
        props: {
          value: {
            type: Number,
            required: true,
          },
        },
        setup(props) {
          watch(
            () => props.value,
            (newVal, oldVal) => {
              watchSpy(newVal, oldVal);
            },
          );

          return () =>
            h('div', { 'data-testid': 'value' }, String(props.value));
        },
      });

      const props = reactive({ value: 1 });
      const { wrapper, cleanup } = mountDataClient(TestComponent, { props });

      // Initial value
      expect(wrapper.find('[data-testid="value"]').text()).toBe('1');
      expect(watchSpy).not.toHaveBeenCalled(); // watch doesn't fire on initial setup

      // Change value
      props.value = 2;
      await nextTick();

      expect(wrapper.find('[data-testid="value"]').text()).toBe('2');
      expect(watchSpy).toHaveBeenCalledWith(2, 1);

      // Change again
      props.value = 5;
      await nextTick();

      expect(wrapper.find('[data-testid="value"]').text()).toBe('5');
      expect(watchSpy).toHaveBeenCalledWith(5, 2);

      cleanup();
    });

    it('should handle array prop changes', async () => {
      const TestComponent = defineComponent({
        name: 'TestComponent',
        props: {
          items: {
            type: Array,
            required: true,
          },
        },
        setup(props) {
          return () =>
            h(
              'ul',
              { 'data-testid': 'list' },
              (props.items as string[]).map(item => h('li', item)),
            );
        },
      });

      const props = reactive({
        items: ['Apple', 'Banana'],
      });
      const { wrapper, cleanup } = mountDataClient(TestComponent, { props });

      // Initial list
      expect(wrapper.findAll('li').length).toBe(2);
      expect(wrapper.findAll('li')[0].text()).toBe('Apple');
      expect(wrapper.findAll('li')[1].text()).toBe('Banana');

      // Update array
      props.items = ['Orange', 'Grape', 'Melon'];
      await nextTick();

      expect(wrapper.findAll('li').length).toBe(3);
      expect(wrapper.findAll('li')[0].text()).toBe('Orange');
      expect(wrapper.findAll('li')[1].text()).toBe('Grape');
      expect(wrapper.findAll('li')[2].text()).toBe('Melon');

      cleanup();
    });
  });
});
