import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';

import useLoading from '../consumers/useLoading';

describe('vue useLoading()', () => {
  async function flushUntil(
    wrapper: any,
    predicate: () => boolean,
    tries = 100,
  ) {
    for (let i = 0; i < tries; i++) {
      if (predicate()) return;
      await Promise.resolve();
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  it('tracks loading state for async functions', async () => {
    let resolvePromise: (value: string) => void;
    const mockAsyncFunction = jest.fn(
      () =>
        new Promise<string>(resolve => {
          resolvePromise = resolve;
        }),
    );

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const [wrappedFunction, loading, error] = useLoading(mockAsyncFunction);

        const handleClick = async () => {
          await wrappedFunction();
        };

        return () =>
          h('div', [
            h(
              'button',
              {
                onClick: handleClick,
                'data-testid': 'test-button',
              },
              loading.value ? 'Loading...' : 'Click me',
            ),
            h('div', { 'data-testid': 'error' }, error.value?.message || ''),
            h('div', { 'data-testid': 'loading' }, loading.value.toString()),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // Initially not loading
    expect(wrapper.find('[data-testid="loading"]').text()).toBe('false');
    expect(wrapper.find('[data-testid="test-button"]').text()).toBe('Click me');

    // Click to trigger loading
    await wrapper.find('[data-testid="test-button"]').trigger('click');
    await nextTick();

    // Should be loading
    expect(wrapper.find('[data-testid="loading"]').text()).toBe('true');
    expect(wrapper.find('[data-testid="test-button"]').text()).toBe(
      'Loading...',
    );

    // Resolve the promise
    resolvePromise!('success');
    await flushUntil(
      wrapper,
      () => wrapper.find('[data-testid="loading"]').text() === 'false',
    );

    // Should not be loading anymore
    expect(wrapper.find('[data-testid="loading"]').text()).toBe('false');
    expect(wrapper.find('[data-testid="test-button"]').text()).toBe('Click me');
    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
  });

  it('handles errors from async functions', async () => {
    const testError = new Error('Test error');
    const mockAsyncFunction = jest.fn(() => Promise.reject(testError));

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const [wrappedFunction, loading, error] = useLoading(mockAsyncFunction);

        const handleClick = async () => {
          await wrappedFunction();
        };

        return () =>
          h('div', [
            h(
              'button',
              {
                onClick: handleClick,
                'data-testid': 'test-button',
              },
              'Click me',
            ),
            h('div', { 'data-testid': 'error' }, error.value?.message || ''),
            h('div', { 'data-testid': 'loading' }, loading.value.toString()),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // Click to trigger error
    await wrapper.find('[data-testid="test-button"]').trigger('click');
    await flushUntil(
      wrapper,
      () => wrapper.find('[data-testid="error"]').text() === 'Test error',
    );

    // Should capture the error
    expect(wrapper.find('[data-testid="error"]').text()).toBe('Test error');
    expect(wrapper.find('[data-testid="loading"]').text()).toBe('false');
    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
  });

  it('does not update loading state after component unmount', async () => {
    let resolvePromise: (value: string) => void;
    const mockAsyncFunction = jest.fn(
      () =>
        new Promise<string>(resolve => {
          resolvePromise = resolve;
        }),
    );

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const [wrappedFunction, loading] = useLoading(mockAsyncFunction);

        const handleClick = async () => {
          await wrappedFunction();
        };

        return () =>
          h('div', [
            h(
              'button',
              {
                onClick: handleClick,
                'data-testid': 'test-button',
              },
              'Click me',
            ),
            h('div', { 'data-testid': 'loading' }, loading.value.toString()),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // Click to trigger loading
    await wrapper.find('[data-testid="test-button"]').trigger('click');
    await nextTick();

    // Should be loading
    expect(wrapper.find('[data-testid="loading"]').text()).toBe('true');

    // Unmount component before resolving
    wrapper.unmount();

    // Resolve the promise after unmount
    resolvePromise!('success');
    await new Promise(resolve => setTimeout(resolve, 0));

    // Component should be unmounted, no errors should occur
    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
  });

  it('clears error on subsequent calls', async () => {
    const testError = new Error('Test error');
    let shouldError = true;
    const mockAsyncFunction = jest.fn(() => {
      if (shouldError) {
        return Promise.reject(testError);
      }
      return Promise.resolve('success');
    });

    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        const [wrappedFunction, loading, error] = useLoading(mockAsyncFunction);

        const handleClick = async () => {
          await wrappedFunction();
        };

        return () =>
          h('div', [
            h(
              'button',
              {
                onClick: handleClick,
                'data-testid': 'test-button',
              },
              'Click me',
            ),
            h('div', { 'data-testid': 'error' }, error.value?.message || ''),
            h('div', { 'data-testid': 'loading' }, loading.value.toString()),
          ]);
      },
    });

    const wrapper = mount(TestComponent);

    // First call - should error
    await wrapper.find('[data-testid="test-button"]').trigger('click');
    await flushUntil(
      wrapper,
      () => wrapper.find('[data-testid="error"]').text() === 'Test error',
    );

    expect(wrapper.find('[data-testid="error"]').text()).toBe('Test error');

    // Second call - should succeed and clear error
    shouldError = false;
    await wrapper.find('[data-testid="test-button"]').trigger('click');
    await flushUntil(
      wrapper,
      () => wrapper.find('[data-testid="error"]').text() === '',
    );

    expect(wrapper.find('[data-testid="error"]').text()).toBe('');
    expect(wrapper.find('[data-testid="loading"]').text()).toBe('false');
    expect(mockAsyncFunction).toHaveBeenCalledTimes(2);
  });
});
