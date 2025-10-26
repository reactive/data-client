import { VueWrapper } from '@vue/test-utils';
import { computed, defineComponent, h, nextTick, reactive } from 'vue';

// Endpoints/entities from React subscriptions test
import { PollingArticleResource } from '../../../../__tests__/new';
import useSubscription from '../consumers/useSubscription';
import useSuspense from '../consumers/useSuspense';
import { renderDataCompose, mountDataClient } from '../test';

describe('vue useSubscription()', () => {
  async function flushUntilWithFakeTimers(
    wrapper: VueWrapper<any>,
    predicate: () => boolean,
    tries = 100,
  ) {
    for (let i = 0; i < tries; i++) {
      if (predicate()) return;
      await Promise.resolve();
      await nextTick();
      // Don't use setTimeout with fake timers
    }
  }

  const payload = {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('subscribes and re-renders on updates (simulated poll)', async () => {
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBe(5000);

    const responseMock = jest.fn(() => payload);
    const propsRef = reactive({ active: true });

    const { result, waitForNextUpdate, allSettled, cleanup } =
      await renderDataCompose(
        ({ active }: { active: boolean }) => {
          const args = computed(() => (active ? { id: payload.id } : null));
          useSubscription(PollingArticleResource.get, args);
          return useSuspense(PollingArticleResource.get, {
            id: payload.id,
          });
        },
        {
          props: propsRef,
          resolverFixtures: [
            {
              endpoint: PollingArticleResource.get,
              response: responseMock,
            },
          ],
        },
      );

    // Wait for initial render
    jest.advanceTimersByTime(frequency);
    await allSettled();
    await waitForNextUpdate();

    // Verify initial values
    const initialArticleRef = await result.value;
    expect(initialArticleRef!.value.title).toBe(payload.title);
    expect(initialArticleRef!.value.content).toBe(payload.content);

    // Change the mock response for the next poll
    responseMock.mockReturnValue({
      ...payload,
      title: 'updated title',
      content: 'updated content',
    });

    // Advance time to trigger another poll
    jest.advanceTimersByTime(frequency);
    await allSettled();
    await nextTick();

    // Verify the article was updated
    const updatedArticleRef = await result.value;
    expect(updatedArticleRef!.value.title).toBe('updated title');
    expect(updatedArticleRef!.value.content).toBe('updated content');

    jest.useRealTimers();
    cleanup();
  });

  it('should not receive updates after unsubscribing by setting active to null', async () => {
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBe(5000);

    const responseMock = jest.fn(() => payload);
    const propsRef = reactive({ active: true });

    const { result, waitForNextUpdate, allSettled, cleanup } =
      await renderDataCompose(
        (props: { active: boolean }) => {
          const args = computed(() =>
            props.active ? { id: payload.id } : null,
          );
          useSubscription(PollingArticleResource.get, args);
          return useSuspense(PollingArticleResource.get, {
            id: payload.id,
          });
        },
        {
          props: propsRef,
          resolverFixtures: [
            {
              endpoint: PollingArticleResource.get,
              response: responseMock,
            },
          ],
        },
      );

    // Wait for initial render
    jest.advanceTimersByTime(frequency);
    await allSettled();
    await waitForNextUpdate();

    // Verify initial values
    const initialArticleRef = await result.value;
    expect(initialArticleRef!.value!.title).toBe(payload.title);
    expect(responseMock).toHaveBeenCalledTimes(1);

    // Change the mock response
    responseMock.mockReturnValue({
      ...payload,
      title: 'after first poll',
    });

    // Advance time to trigger another poll
    jest.advanceTimersByTime(frequency);
    await allSettled();
    await nextTick();

    // Verify the article was updated
    const updatedArticleRef = await result.value;
    expect(updatedArticleRef!.value!.title).toBe('after first poll');
    expect(responseMock).toHaveBeenCalledTimes(2);

    // Now unsubscribe by setting active to false
    propsRef.active = false;
    await nextTick();

    // Change the mock response again
    responseMock.mockReturnValue({
      ...payload,
      title: 'should not see this',
    });

    // Advance time - subscription should not trigger
    jest.advanceTimersByTime(frequency);
    await allSettled();
    await nextTick();

    // Verify the article was NOT updated (still has old value)
    const finalArticleRef = await result.value;
    expect(finalArticleRef!.value!.title).toBe('after first poll');
    // Should still be 2 calls, no new poll happened
    expect(responseMock).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
    cleanup();
  });

  it('should unsubscribe when subscribed component unmounts', async () => {
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBe(5000);

    const responseMock = jest.fn(() => payload);

    // Subscriber component that only subscribes
    const SubscriberComponent = defineComponent({
      name: 'SubscriberComponent',
      setup() {
        useSubscription(PollingArticleResource.get, { id: payload.id });
        return () => h('div', 'Subscriber');
      },
    });

    // Reader component that reads data with useSuspense
    const ReaderComponent = defineComponent({
      name: 'ReaderComponent',
      async setup() {
        const article = await useSuspense(PollingArticleResource.get, {
          id: payload.id,
        });
        return () => h('div', [h('h3', article.value.title)]);
      },
    });

    // Parent component that conditionally renders the subscriber
    const ParentComponent = defineComponent({
      name: 'ParentComponent',
      props: {
        showSubscriber: {
          type: Boolean,
          default: true,
        },
      },
      setup(props) {
        return () =>
          h('div', [
            props.showSubscriber ? h(SubscriberComponent) : null,
            h(ReaderComponent),
          ]);
      },
    });

    const props = reactive({ showSubscriber: true });
    const { wrapper, allSettled, cleanup } = mountDataClient(ParentComponent, {
      props,
      resolverFixtures: [
        {
          endpoint: PollingArticleResource.get,
          response: responseMock,
        },
      ],
    });

    // Wait for initial render
    jest.advanceTimersByTime(frequency);
    await allSettled();
    await flushUntilWithFakeTimers(wrapper, () => wrapper.find('h3').exists());

    // Verify initial values
    expect(wrapper.find('h3').text()).toBe(payload.title);
    expect(responseMock).toHaveBeenCalledTimes(1);

    // Change the mock response
    responseMock.mockReturnValue({
      ...payload,
      title: 'first update',
    });

    // Advance time to trigger poll
    jest.advanceTimersByTime(frequency);
    await allSettled();
    await nextTick();

    // Verify the article was updated
    expect(wrapper.find('h3').text()).toBe('first update');
    expect(responseMock).toHaveBeenCalledTimes(2);

    // Now unmount the subscribing component by setting showSubscriber to false
    props.showSubscriber = false;
    await nextTick();

    // Change the mock response again
    responseMock.mockReturnValue({
      ...payload,
      title: 'should not see this',
    });

    // Advance time - subscription should not trigger
    jest.advanceTimersByTime(frequency);
    await allSettled();
    await nextTick();

    // The reading component should still show old data since no subscription is active
    expect(wrapper.find('h3').text()).toBe('first update');
    // Should still be 2 calls, no new poll happened
    expect(responseMock).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
    cleanup();
  });
});
