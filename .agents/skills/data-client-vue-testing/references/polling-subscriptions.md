# Testing Polling and Subscriptions (Vue)

Composables that subscribe over time — `useLive`, `useSubscription`, or any endpoint with `pollFrequency` — need fake timers so the test can deterministically advance through poll intervals without waiting in real time.

## Core Pattern

1. `jest.useFakeTimers()` **before** mounting/rendering, so the subscription interval is created under fake timers.
2. Mount/render and trigger the initial fetch by advancing time.
3. Mutate the mocked response (via `responseMock.mockReturnValue(...)` for `resolverFixtures`, or by reassigning a closure variable for nock).
4. `jest.advanceTimersByTime(frequency)` to trigger the next poll.
5. `await allSettled()` and `await nextTick()` so promises and reactivity flush.
6. Always restore real timers in `afterEach` to avoid bleeding into other tests.

```typescript
afterEach(() => {
  jest.useRealTimers();
});
```

## Polling With `useLive` and `resolverFixtures`

Best for testing data-flow without involving the network layer.

```typescript
import { computed, reactive, nextTick } from 'vue';
import { renderDataCompose } from '../test';

it('subscribes and re-renders on poll', async () => {
  jest.useFakeTimers();
  const frequency = PollingArticleResource.get.pollFrequency as number;

  const responseMock = jest.fn(() => payload);
  const propsRef = reactive({ active: true });

  const { result, waitForNextUpdate, allSettled, cleanup } =
    await renderDataCompose(
      ({ active }: { active: boolean }) => {
        const args = computed(() => (active ? { id: payload.id } : null));
        useSubscription(PollingArticleResource.get, args);
        return useSuspense(PollingArticleResource.get, { id: payload.id });
      },
      {
        props: propsRef,
        resolverFixtures: [
          { endpoint: PollingArticleResource.get, response: responseMock },
        ],
      },
    );

  // Initial fetch
  jest.advanceTimersByTime(frequency);
  await allSettled();
  await waitForNextUpdate();

  const articleRef = await result;
  expect(articleRef!.value.title).toBe(payload.title);

  // Simulate server-side update on the next poll
  responseMock.mockReturnValue({ ...payload, title: 'updated' });

  jest.advanceTimersByTime(frequency);
  await allSettled();
  await nextTick();

  expect(articleRef!.value.title).toBe('updated');

  jest.useRealTimers();
  cleanup();
});
```

Notes:

- `useSubscription` with `computed(() => active ? args : null)` lets you exercise unsubscribe by flipping a reactive prop.
- `useSuspense` returns a `Promise<ComputedRef>` — `await result` once, then assert on `articleRef.value`. The ref auto-updates as polls land.
- Use `responseMock.mockReturnValue(...)` between polls; each invocation of the resolver runs the latest mock implementation.

## Polling With `mountDataClient` (Component Tests)

When testing a component, use `flushUntil` adapted for fake timers — it must not call `setTimeout` (which would never fire under `jest.useFakeTimers`).

```typescript
async function flushUntilWithFakeTimers(
  wrapper: VueWrapper<any>,
  predicate: () => boolean,
  tries = 100,
) {
  for (let i = 0; i < tries; i++) {
    if (predicate()) return;
    await Promise.resolve();
    await nextTick();
    // intentionally no setTimeout — incompatible with fake timers
  }
}

it('unsubscribes when subscriber unmounts', async () => {
  jest.useFakeTimers();
  const frequency = PollingArticleResource.get.pollFrequency as number;
  const responseMock = jest.fn(() => payload);

  const props = reactive({ showSubscriber: true });
  const { wrapper, allSettled, cleanup } = mountDataClient(ParentComponent, {
    props,
    resolverFixtures: [
      { endpoint: PollingArticleResource.get, response: responseMock },
    ],
  });

  jest.advanceTimersByTime(frequency);
  await allSettled();
  await flushUntilWithFakeTimers(wrapper, () => wrapper.find('h3').exists());

  expect(responseMock).toHaveBeenCalledTimes(1);

  // Unmount the subscriber
  props.showSubscriber = false;
  await nextTick();

  // Advance past another poll interval — no new fetch should occur
  responseMock.mockReturnValue({ ...payload, title: 'should not see this' });
  jest.advanceTimersByTime(frequency);
  await allSettled();
  await nextTick();

  expect(responseMock).toHaveBeenCalledTimes(2 - 1); // still the same as before
  expect(wrapper.find('h3').text()).not.toBe('should not see this');

  jest.useRealTimers();
  cleanup();
});
```

## Polling With nock (End-to-End Style)

When you also want to verify request URLs/headers, drive the "server" through a mutable closure variable replied via nock. See [nock-http-mocking.md](nock-http-mocking.md) for the base setup, then poll using fake timers and a small `flushUntil` loop:

```typescript
let currentPollingPayload = { ...payload };

it('reflects server updates on poll', async () => {
  jest.useFakeTimers();
  const frequency = PollingArticleResource.get.pollFrequency as number;

  const wrapper = mount(ProvideWrapper, {
    slots: { default: () => h(PollingArticleComp) },
    global: { plugins: [[DataClientPlugin]] },
  });

  // Advance in small slices so promises can resolve between timer ticks
  for (let i = 0; i < 100 && !wrapper.find('h3').exists(); i++) {
    await jest.advanceTimersByTimeAsync(frequency / 10);
    await nextTick();
  }
  expect(wrapper.find('h3').text()).toBe(payload.title);

  // "Server" updates
  currentPollingPayload = { ...payload, title: 'updated' };

  for (let i = 0; i < 20 && wrapper.find('h3').text() !== 'updated'; i++) {
    await jest.advanceTimersByTimeAsync(frequency / 10);
    await nextTick();
  }
  expect(wrapper.find('h3').text()).toBe('updated');

  jest.useRealTimers();
});
```

Why slice the interval (`frequency / 10`)? `advanceTimersByTimeAsync` flushes microtasks between ticks; small slices give the fetch promise chain room to resolve before the next interval fires, which avoids racing past the render.

## Unsubscribe Patterns

There are two ways subscriptions stop:

1. **Reactive args become null** — `useSubscription(endpoint, computed(() => active ? args : null))`. Toggle the reactive flag; the next poll interval should not fire and `responseMock` call count should freeze.
2. **Subscriber component unmounts** — wrap `useSubscription` in a child component and v-if it out. Reading components (e.g. `useSuspense`) keep showing the last value, but no new polls happen.

Assert both the call count of the resolver mock and the rendered DOM to confirm the subscription is fully torn down.

## Common Pitfalls

- **`setTimeout` inside `flushUntil` while fake timers are active** → loop spins forever. Use `flushUntilWithFakeTimers` (no `setTimeout`).
- **Forgetting `jest.useRealTimers()` in `afterEach`** → other tests see fake timers and time-based behavior breaks unpredictably.
- **Calling `jest.useFakeTimers()` after mount** → the polling interval was scheduled with the real clock; advancing fake timers does nothing. Always set fake timers first.
- **No `await allSettled()` between `advanceTimersByTime` and assertions** → the fetch promise hasn't resolved yet, and the store/ref hasn't updated.
- **Polling with `initialFixtures` only** → static fixtures don't re-resolve. Use `resolverFixtures` (function response) or nock for anything that needs to change over time.
