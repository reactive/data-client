import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';

import useDebounce from '../consumers/useDebounce';

describe('vue useDebounce()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debounces value updates with correct delay', async () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const query = ref('initial');
        const [debouncedQuery, isPending] = useDebounce(query, 200);

        const updateQuery = (newValue: string) => {
          query.value = newValue;
        };

        return () =>
          h('div', [
            h('input', {
              value: query.value,
              onInput: (e: any) => updateQuery(e.target.value),
              'data-testid': 'input',
            }),
            h('div', { 'data-testid': 'original' }, query.value),
            h('div', { 'data-testid': 'debounced' }, debouncedQuery.value),
            h('div', { 'data-testid': 'pending' }, isPending.value.toString()),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // Initially, debounced value should match original
    expect(wrapper.find('[data-testid="original"]').text()).toBe('initial');
    expect(wrapper.find('[data-testid="debounced"]').text()).toBe('initial');
    expect(wrapper.find('[data-testid="pending"]').text()).toBe('false');

    // Update the input
    const input = wrapper.find('[data-testid="input"]');
    await input.setValue('updated');
    await nextTick();

    // Original should update immediately, debounced should not
    expect(wrapper.find('[data-testid="original"]').text()).toBe('updated');
    expect(wrapper.find('[data-testid="debounced"]').text()).toBe('initial');
    expect(wrapper.find('[data-testid="pending"]').text()).toBe('true');

    // Fast-forward time by less than delay
    jest.advanceTimersByTime(100);
    await nextTick();

    // Debounced should still be old value
    expect(wrapper.find('[data-testid="debounced"]').text()).toBe('initial');
    expect(wrapper.find('[data-testid="pending"]').text()).toBe('true');

    // Fast-forward time by remaining delay
    jest.advanceTimersByTime(100);
    await nextTick();

    // Now debounced should update
    expect(wrapper.find('[data-testid="debounced"]').text()).toBe('updated');
    expect(wrapper.find('[data-testid="pending"]').text()).toBe('false');
  });

  it('cancels previous timeout when value changes rapidly', async () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const query = ref('initial');
        const [debouncedQuery, isPending] = useDebounce(query, 200);

        const updateQuery = (newValue: string) => {
          query.value = newValue;
        };

        return () =>
          h('div', [
            h('input', {
              value: query.value,
              onInput: (e: any) => updateQuery(e.target.value),
              'data-testid': 'input',
            }),
            h('div', { 'data-testid': 'debounced' }, debouncedQuery.value),
            h('div', { 'data-testid': 'pending' }, isPending.value.toString()),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // Rapid updates
    const input = wrapper.find('[data-testid="input"]');
    await input.setValue('first');
    await nextTick();

    expect(wrapper.find('[data-testid="pending"]').text()).toBe('true');

    // Fast-forward partway
    jest.advanceTimersByTime(100);

    // Another update before timeout
    await input.setValue('second');
    await nextTick();

    // Fast-forward full delay from second update
    jest.advanceTimersByTime(200);
    await nextTick();

    // Should show the second value, not first
    expect(wrapper.find('[data-testid="debounced"]').text()).toBe('second');
    expect(wrapper.find('[data-testid="pending"]').text()).toBe('false');
  });

  it('respects updatable parameter', async () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const query = ref('initial');
        const updatable = ref(true);
        const [debouncedQuery, isPending] = useDebounce(query, 200, updatable);

        const updateQuery = (newValue: string) => {
          query.value = newValue;
        };

        const toggleUpdatable = () => {
          updatable.value = !updatable.value;
        };

        return () =>
          h('div', [
            h('input', {
              value: query.value,
              onInput: (e: any) => updateQuery(e.target.value),
              'data-testid': 'input',
            }),
            h(
              'button',
              {
                onClick: toggleUpdatable,
                'data-testid': 'toggle',
              },
              `Updatable: ${updatable.value}`,
            ),
            h('div', { 'data-testid': 'debounced' }, debouncedQuery.value),
            h('div', { 'data-testid': 'pending' }, isPending.value.toString()),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // Disable updates
    await wrapper.find('[data-testid="toggle"]').trigger('click');
    await nextTick();

    // Update input
    await wrapper.find('[data-testid="input"]').setValue('disabled');
    await nextTick();

    // Should not be pending since updates are disabled
    expect(wrapper.find('[data-testid="pending"]').text()).toBe('false');

    // Fast-forward time
    jest.advanceTimersByTime(300);
    await nextTick();

    // Debounced value should not have updated
    expect(wrapper.find('[data-testid="debounced"]').text()).toBe('initial');
  });

  it('cleans up timeout on unmount', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const query = ref('initial');
        const [debouncedQuery] = useDebounce(query, 200);

        const updateQuery = (newValue: string) => {
          query.value = newValue;
        };

        return () =>
          h('div', [
            h('input', {
              value: query.value,
              onInput: (e: any) => updateQuery(e.target.value),
              'data-testid': 'input',
            }),
            h('div', { 'data-testid': 'debounced' }, debouncedQuery.value),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // Update input to trigger timeout
    await wrapper.find('[data-testid="input"]').setValue('will unmount');
    await nextTick();

    // Unmount component
    wrapper.unmount();

    // Should have called clearTimeout
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('works with reactive refs as input', async () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const query = ref('initial');
        const [debouncedQuery, isPending] = useDebounce(query, 200);

        const updateQuery = (newValue: string) => {
          query.value = newValue;
        };

        return () =>
          h('div', [
            h(
              'button',
              {
                onClick: () => updateQuery('reactive'),
                'data-testid': 'button',
              },
              'Update',
            ),
            h('div', { 'data-testid': 'debounced' }, debouncedQuery.value),
            h('div', { 'data-testid': 'pending' }, isPending.value.toString()),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // Click to update
    await wrapper.find('[data-testid="button"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-testid="pending"]').text()).toBe('true');

    // Fast-forward time
    jest.advanceTimersByTime(200);
    await nextTick();

    expect(wrapper.find('[data-testid="debounced"]').text()).toBe('reactive');
    expect(wrapper.find('[data-testid="pending"]').text()).toBe('false');
  });
});
