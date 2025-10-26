import { ref, computed, watch, reactive, nextTick } from 'vue';

import { CoolerArticleResource } from '../../../../../__tests__/new';
import { renderDataCompose } from '../renderDataCompose';

describe('renderDataCompose', () => {
  const payload = {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
  };

  // Helper to ensure reactivity has settled
  async function waitForResult() {
    await nextTick();
    await nextTick(); // One more tick to ensure reactivity is settled
  }

  describe('basic behaviors', () => {
    it('should execute a composable and return its result', async () => {
      const composable = () => {
        const count = ref(0);
        return { count };
      };

      const { result, cleanup } = await renderDataCompose(composable);

      // Wait for composable to execute and result to be available
      await waitForResult();

      expect(result).toBeDefined();
      // Access the ref's value directly
      expect(result.count.value).toBe(0);

      cleanup();
    });

    it('should provide a controller', async () => {
      const composable = () => {
        return { value: 'test' };
      };

      const { controller, cleanup } = await renderDataCompose(composable);

      expect(controller).toBeDefined();
      expect(controller.fetch).toBeDefined();
      expect(controller.setResponse).toBeDefined();

      cleanup();
    });

    it('should pass props to composable', async () => {
      const composable = (props: { message: string; count: number }) => {
        const computed_message = computed(
          () => `${props.message}: ${props.count}`,
        );
        return { message: computed_message };
      };

      const props = reactive({ message: 'Hello', count: 42 });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      expect(result).toBeDefined();
      expect(result.message.value).toBe('Hello: 42');

      cleanup();
    });

    it('should handle computed values in composables', async () => {
      const composable = () => {
        const count = ref(10);
        const doubled = computed(() => count.value * 2);
        return { count, doubled };
      };

      const { result, cleanup } = await renderDataCompose(composable);

      // Wait for composable to execute and result to be available
      await waitForResult();

      expect(result.count.value).toBe(10);
      expect(result.doubled.value).toBe(20);

      cleanup();
    });

    it('should provide initial fixtures to the store', async () => {
      const composable = () => {
        return { test: 'value' };
      };

      const { controller, cleanup } = await renderDataCompose(composable, {
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

    it('should cleanup properly', async () => {
      const composable = () => {
        return { value: 'test' };
      };

      const { wrapper, cleanup } = await renderDataCompose(composable);

      expect(wrapper.find('[data-testid="composable-result"]').exists()).toBe(
        true,
      );

      // Cleanup should not throw
      expect(() => cleanup()).not.toThrow();
    });

    it('should handle allSettled()', async () => {
      const composable = () => {
        return { value: 'test' };
      };

      const { allSettled, cleanup } = await renderDataCompose(composable);

      const result = await allSettled();

      expect(Array.isArray(result)).toBe(true);

      cleanup();
    });
  });

  describe('reactive prop changes', () => {
    it('should trigger computed values when props change', async () => {
      const composable = (props: { value: number }) => {
        const doubled = computed(() => props.value * 2);
        return { doubled };
      };

      const props = reactive({ value: 5 });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initial computed value
      expect(result.doubled.value).toBe(10);

      // Change prop - computed should update
      props.value = 10;
      await nextTick();

      expect(result.doubled.value).toBe(20);

      cleanup();
    });

    it('should trigger watchers when props change', async () => {
      const watchSpy = jest.fn();

      const composable = (props: { count: number }) => {
        watch(
          () => props.count,
          (newVal, oldVal) => {
            watchSpy(newVal, oldVal);
          },
        );

        return { count: computed(() => props.count) };
      };

      const props = reactive({ count: 1 });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initial value
      expect(result.count.value).toBe(1);
      expect(watchSpy).not.toHaveBeenCalled(); // watch doesn't fire on initial setup

      // Change prop - watcher should fire
      props.count = 2;
      await nextTick();

      expect(result.count.value).toBe(2);
      expect(watchSpy).toHaveBeenCalledWith(2, 1);

      // Change again
      props.count = 5;
      await nextTick();

      expect(result.count.value).toBe(5);
      expect(watchSpy).toHaveBeenCalledWith(5, 2);

      cleanup();
    });

    it('should handle multiple computed dependencies on props', async () => {
      const composable = (props: { firstName: string; lastName: string }) => {
        const fullName = computed(() => `${props.firstName} ${props.lastName}`);
        const initials = computed(
          () => `${props.firstName[0]}${props.lastName[0]}`,
        );

        return { fullName, initials };
      };

      const props = reactive({
        firstName: 'John',
        lastName: 'Doe',
      });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initial computed values
      expect(result.fullName.value).toBe('John Doe');
      expect(result.initials.value).toBe('JD');

      // Change first name
      props.firstName = 'Jane';
      await nextTick();

      expect(result.fullName.value).toBe('Jane Doe');
      expect(result.initials.value).toBe('JD');

      // Change last name
      props.lastName = 'Smith';
      await nextTick();

      expect(result.fullName.value).toBe('Jane Smith');
      expect(result.initials.value).toBe('JS');

      cleanup();
    });

    it('should update nested computed values when props change', async () => {
      const composable = (props: { value: number }) => {
        const doubled = computed(() => props.value * 2);
        const quadrupled = computed(() => doubled.value * 2);
        const octupled = computed(() => quadrupled.value * 2);

        return { doubled, quadrupled, octupled };
      };

      const props = reactive({ value: 1 });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initial values
      expect(result.doubled.value).toBe(2);
      expect(result.quadrupled.value).toBe(4);
      expect(result.octupled.value).toBe(8);

      // Change prop - all computed values should update
      props.value = 5;
      await nextTick();

      expect(result.doubled.value).toBe(10);
      expect(result.quadrupled.value).toBe(20);
      expect(result.octupled.value).toBe(40);

      cleanup();
    });

    it('should handle complex object prop changes', async () => {
      const composable = (props: { user: { name: string; age: number } }) => {
        const description = computed(
          () => `${props.user.name} is ${props.user.age} years old`,
        );
        const isAdult = computed(() => props.user.age >= 18);

        return { description, isAdult };
      };

      const props = reactive({
        user: { name: 'Alice', age: 16 },
      });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initial values
      expect(result.description.value).toBe('Alice is 16 years old');
      expect(result.isAdult.value).toBe(false);

      // Update nested object
      props.user = { name: 'Bob', age: 25 };
      await nextTick();

      expect(result.description.value).toBe('Bob is 25 years old');
      expect(result.isAdult.value).toBe(true);

      cleanup();
    });

    it('should handle array prop changes in computed values', async () => {
      const composable = (props: { items: string[] }) => {
        const itemCount = computed(() => props.items.length);
        const firstItem = computed(() => props.items[0] || 'none');
        const allItems = computed(() => props.items.join(', '));

        return { itemCount, firstItem, allItems };
      };

      const props = reactive({
        items: ['apple', 'banana'],
      });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initial values
      expect(result.itemCount.value).toBe(2);
      expect(result.firstItem.value).toBe('apple');
      expect(result.allItems.value).toBe('apple, banana');

      // Update array
      props.items = ['orange', 'grape', 'melon'];
      await nextTick();

      expect(result.itemCount.value).toBe(3);
      expect(result.firstItem.value).toBe('orange');
      expect(result.allItems.value).toBe('orange, grape, melon');

      cleanup();
    });

    it('should trigger watchers with immediate option on prop changes', async () => {
      const watchSpy = jest.fn();

      const composable = (props: { value: number }) => {
        watch(
          () => props.value,
          newVal => {
            watchSpy(newVal);
          },
          { immediate: true },
        );

        return { value: computed(() => props.value) };
      };

      const props = reactive({ value: 10 });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Immediate watcher should have fired on setup
      expect(watchSpy).toHaveBeenCalledWith(10);
      expect(watchSpy).toHaveBeenCalledTimes(1);

      // Change prop
      props.value = 20;
      await nextTick();

      expect(result.value.value).toBe(20);
      expect(watchSpy).toHaveBeenCalledWith(20);
      expect(watchSpy).toHaveBeenCalledTimes(2);

      cleanup();
    });

    it('should handle multiple watchers triggered by same prop change', async () => {
      const watcher1Spy = jest.fn();
      const watcher2Spy = jest.fn();

      const composable = (props: { value: number }) => {
        watch(
          () => props.value,
          newVal => {
            watcher1Spy(newVal);
          },
        );

        watch(
          () => props.value * 2,
          newVal => {
            watcher2Spy(newVal);
          },
        );

        return { value: computed(() => props.value) };
      };

      const props = reactive({ value: 5 });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      expect(watcher1Spy).not.toHaveBeenCalled();
      expect(watcher2Spy).not.toHaveBeenCalled();

      // Change prop - both watchers should fire
      props.value = 10;
      await nextTick();

      expect(result.value.value).toBe(10);
      expect(watcher1Spy).toHaveBeenCalledWith(10);
      expect(watcher2Spy).toHaveBeenCalledWith(20);

      cleanup();
    });

    it('should handle conditional computed values based on props', async () => {
      const composable = (props: { enabled: boolean; value: number }) => {
        const result = computed(() => {
          if (props.enabled) {
            return props.value * 2;
          }
          return 0;
        });

        return { result };
      };

      const props = reactive({ enabled: true, value: 5 });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initially enabled
      expect(result.result.value).toBe(10);

      // Disable
      props.enabled = false;
      await nextTick();

      expect(result.result.value).toBe(0);

      // Change value while disabled
      props.value = 100;
      await nextTick();

      expect(result.result.value).toBe(0);

      // Re-enable
      props.enabled = true;
      await nextTick();

      expect(result.result.value).toBe(200);

      cleanup();
    });
  });

  describe('advanced reactivity patterns', () => {
    it('should handle ref mutations inside composable that respond to prop changes', async () => {
      const composable = (props: { multiplier: number }) => {
        const base = ref(10);
        const result = computed(() => base.value * props.multiplier);

        const updateBase = (newValue: number) => {
          base.value = newValue;
        };

        return { result, updateBase, base };
      };

      const props = reactive({ multiplier: 2 });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initial
      expect(result.result.value).toBe(20); // 10 * 2

      // Change prop
      props.multiplier = 3;
      await nextTick();

      expect(result.result.value).toBe(30); // 10 * 3

      // Mutate internal ref
      result.updateBase(5);
      await nextTick();

      expect(result.result.value).toBe(15); // 5 * 3

      // Change prop again
      props.multiplier = 4;
      await nextTick();

      expect(result.result.value).toBe(20); // 5 * 4

      cleanup();
    });

    it('should handle side effects in watchers triggered by prop changes', async () => {
      const sideEffectSpy = jest.fn();

      const composable = (props: { trigger: boolean }) => {
        const counter = ref(0);

        watch(
          () => props.trigger,
          trigger => {
            if (trigger) {
              counter.value++;
              sideEffectSpy(counter.value);
            }
          },
        );

        return { counter };
      };

      const props = reactive({ trigger: false });
      const { result, cleanup } = await renderDataCompose(composable, {
        props,
      });

      // Wait for composable to execute and result to be available
      await waitForResult();

      // Initial state
      expect(result.counter.value).toBe(0);
      expect(sideEffectSpy).not.toHaveBeenCalled();

      // Trigger side effect
      props.trigger = true;
      await nextTick();

      expect(result.counter.value).toBe(1);
      expect(sideEffectSpy).toHaveBeenCalledWith(1);

      // Toggle back (no increment)
      props.trigger = false;
      await nextTick();

      expect(result.counter.value).toBe(1);
      expect(sideEffectSpy).toHaveBeenCalledTimes(1);

      // Trigger again
      props.trigger = true;
      await nextTick();

      expect(result.counter.value).toBe(2);
      expect(sideEffectSpy).toHaveBeenCalledWith(2);
      expect(sideEffectSpy).toHaveBeenCalledTimes(2);

      cleanup();
    });
  });
});
