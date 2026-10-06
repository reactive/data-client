---
title: Unit testing components
---

import PkgTabs from '@site/src/components/PkgTabs';

:::warning

Be careful when using [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) on modules like Reactive Data Client. Eliminating expected
exports can lead to hard-to trace
errors like `TypeError: Class extends value undefined is not a function or null`.

Instead, load responses with [Fixtures](../api/Fixtures.md).

:::

`@data-client/vue/test` mounts components with [DataClientPlugin](../api/DataClientPlugin.md),
a `<Suspense>` boundary and [Fixtures](../api/Fixtures.md), so tests can check what a component
renders without a network fetch cycle. For composables on their own, see
[Unit testing composables](./unit-testing-composables.md).

## Setup

The test utilities are built on [Vue Test Utils](https://test-utils.vuejs.org/), so install it
alongside your test runner. Jest needs the [jsdom environment](https://jestjs.io/docs/configuration#testenvironment-string).

<PkgTabs pkgs="@vue/test-utils jest-environment-jsdom" dev />

## mountDataClient()

[initialFixtures](#options)
fill the store before the first render, so a component that `await`s
[useSuspense()](../api/useSuspense.md) renders its data right away.

```typescript
import { mountDataClient } from '@data-client/vue/test';
import { useSuspense } from '@data-client/vue';
import { defineComponent, h } from 'vue';
import { ArticleResource } from './resources';
import { flushUntil } from './flushUntil';

const ArticleDetail = defineComponent({
  props: { id: { type: Number, required: true } },
  async setup(props) {
    // a getter so the fetch follows props.id
    const article = await useSuspense(ArticleResource.get, () => ({
      id: props.id,
    }));
    return () => h('h3', article.value.title);
  },
});

it('renders the article', async () => {
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('hi ho');

  cleanup();
});
```

Always call `cleanup()` at the end of a test; it unmounts the app and its managers.

### Waiting for renders

Async `setup()` and Suspense resolve over several microtasks and ticks, so wait for what the
test expects rather than for a fixed number of ticks:

```typescript title="flushUntil.ts"
import { nextTick } from 'vue';

export async function flushUntil(predicate: () => boolean, tries = 100) {
  for (let i = 0; i < tries; i++) {
    if (predicate()) return;
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  throw new Error('flushUntil: condition never became true');
}
```

### Loading state

While a component is suspended, `mountDataClient()` renders an element with
`data-testid="suspense-fallback"`. Use [resolverFixtures](#options) to answer fetches the store
doesn't have yet:

```typescript
it('shows the fallback until the fetch resolves', async () => {
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    resolverFixtures: [
      {
        endpoint: ArticleResource.get,
        response: ({ id }) => ({ id, title: `Article ${id}`, content: '' }),
      },
    ],
  });

  expect(wrapper.find('[data-testid="suspense-fallback"]').exists()).toBe(true);

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('Article 5');

  cleanup();
});
```

An interceptor's `response` receives the endpoint's arguments, so one fixture can answer every
`id`. Add `error: true` to a fixture to make it reject; see [Fixtures](../api/Fixtures.md) for every
fixture shape.

### Changing props

Pass a `reactive()` object as `props`, then set its members to change the component's props:

```typescript
import { reactive } from 'vue';

it('fetches the new article when id changes', async () => {
  const props = reactive({ id: 1 });
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props,
    resolverFixtures: [
      {
        endpoint: ArticleResource.get,
        response: ({ id }) => ({ id, title: `Article ${id}`, content: '' }),
      },
    ],
  });

  await flushUntil(() => wrapper.text() === 'Article 1');

  props.id = 2;
  await flushUntil(() => wrapper.text() === 'Article 2');

  cleanup();
});
```

An async `setup()` runs once per component instance, so pass prop-derived arguments as a getter
(`() => ({ id: props.id })`) or `computed()`. A plain `{ id: props.id }` is read once and won't
follow prop changes.

### Mutations

The returned `controller` is the app's [Controller](../api/Controller.md). Run mutations or
[setResponse()](../api/Controller.md#setResponse) with it, then wait for the component to update:

```typescript
it('re-renders when the store changes', async () => {
  const { wrapper, controller, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });
  await flushUntil(() => wrapper.find('h3').exists());

  controller.setResponse(
    ArticleResource.get,
    { id: 5 },
    { id: 5, title: 'updated', content: 'whatever' },
  );

  await flushUntil(() => wrapper.find('h3').text() === 'updated');
  cleanup();
});
```

## API

### mountDataClient(component, options?) {#mountdataclient-api}

Returns

| Member         | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `wrapper`      | Vue Test Utils [VueWrapper](https://test-utils.vuejs.org/api/#wrapper-methods) of the mounted tree |
| `controller`   | The app's [Controller](../api/Controller.md)                 |
| `app`          | The Vue app instance                                         |
| `cleanup()`    | Unmounts and stops the managers                              |
| `allSettled()` | Resolves once every in-flight fetch settles, including fetches a prop change just started, and the component has re-rendered |

### Options

`mountDataClient()` and [renderDataCompose()](./unit-testing-composables.md) take the same options.

```typescript
interface RenderDataClientOptions<P = any> {
  /** Props for the component; pass a reactive() object to change them */
  props?: Reactive<P>;
  /** Responses in the store before the first render */
  initialFixtures?: readonly Fixture[];
  /** Answer fetches made during the test */
  resolverFixtures?: readonly (Fixture | Interceptor)[];
  /** Initial `this` for interceptors */
  getInitialInterceptorData?: () => any;
  /** Replace the default NetworkManager and SubscriptionManager */
  managers?: Manager[];
  /** Replace the state built from initialFixtures */
  initialState?: State<unknown>;
  gcPolicy?: GCInterface;
  /** Component rendered around the tested component (receives the same props) */
  wrapper?: Component;
}
```

[mockInitialState()](../api/mockInitialState.md) builds `initialState` from fixtures, for
mounting with your own `DataClientPlugin` setup.
