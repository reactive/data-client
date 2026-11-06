// eslint-env jest
import type { Manager } from '@data-client/core';
import { act, render } from '@testing-library/react';
import { CoolerArticleResource } from '__tests__/new';
import React, { Activity, StrictMode, Suspense } from 'react';

import { useController, useSubscription, useSuspense } from '../../hooks';
import DataProvider from '../DataProvider';
import { getDefaultManagers } from '../getDefaultManagers';

// <Activity> is React 19.2+
const describeIfActivity = 'Activity' in React ? describe : describe.skip;

const getManagers = () => getDefaultManagers({ devToolsManager: null });
const wait = (ms: number) => act(() => new Promise(r => setTimeout(r, ms)));

/** An endpoint whose fetches resolve only when the test says so */
function deferred<E extends { extend: (options: any) => any }>(
  base: E,
  options: object = {},
) {
  const pending: {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }[] = [];
  const endpoint: E = base.extend({
    ...options,
    fetch() {
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    },
  });
  /** Resolves the nth fetch with an article titled `title` */
  const resolve = (n: number, title: string) =>
    act(async () => pending[n].resolve({ id: 5, title, content: 'x' }));
  /** Rejects the nth fetch */
  const reject = (n: number) =>
    act(async () => pending[n].reject(new Error('old store')));
  return { endpoint, pending, resolve, reject };
}

type Deferred = ReturnType<typeof deferred>;

let ctrl: ReturnType<typeof useController>;
function Article({ endpoint }: { endpoint: typeof CoolerArticleResource.get }) {
  ctrl = useController();
  const article = useSuspense(endpoint, { id: 5 });
  return <div>{article.title}</div>;
}
function Fetcher() {
  ctrl = useController();
  return null;
}

/** A DataProvider with a Suspense boundary around `children` */
function provider(managers: Manager[], children: React.ReactNode) {
  return (
    <DataProvider managers={managers} devButton={null}>
      <Suspense fallback="loading">{children}</Suspense>
    </DataProvider>
  );
}

describeIfActivity('<Activity> above <DataProvider>', () => {
  function renderTabs(children: React.ReactNode) {
    const managers = getManagers();
    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>{provider(managers, children)}</Activity>
    );
    const result = render(tree('visible'));
    return {
      ...result,
      hide: () => act(async () => result.rerender(tree('hidden'))),
      show: () => act(async () => result.rerender(tree('visible'))),
    };
  }

  it('keeps a response that lands while hidden', async () => {
    const get = deferred(CoolerArticleResource.get);
    const { container, hide, show } = renderTabs(
      <Article endpoint={get.endpoint} />,
    );
    expect(container.textContent).toBe('loading');

    await hide();
    await get.resolve(0, 'hi');
    await show();

    expect(container.textContent).toBe('hi');
    // nothing was refetched
    expect(get.pending).toHaveLength(1);
  });

  it('settles a fetch of the same key after showing', async () => {
    const get = deferred(CoolerArticleResource.get);
    const { hide, show } = renderTabs(<Fetcher />);
    const first = ctrl.fetch(get.endpoint, { id: 5 });

    await hide();
    await get.resolve(0, 'first');
    await show();
    await expect(first).resolves.toMatchObject({ title: 'first' });

    // a fresh fetch of the same key starts and settles
    const second = ctrl.fetch(get.endpoint, { id: 5 });
    await wait(0);
    expect(get.pending).toHaveLength(2);
    await get.resolve(1, 'second');
    await expect(second).resolves.toMatchObject({ title: 'second' });
  });

  it('runs a fetch started while hidden', async () => {
    const get = deferred(CoolerArticleResource.get);
    const { hide, show } = renderTabs(<Fetcher />);

    await hide();
    const promise = ctrl.fetch(get.endpoint, { id: 5 });
    await wait(0);
    expect(get.pending).toHaveLength(1);
    await get.resolve(0, 'hi');
    await show();

    await expect(promise).resolves.toMatchObject({ title: 'hi' });
  });

  it('reconciles an optimistic update whose response lands while hidden', async () => {
    const get = deferred(CoolerArticleResource.get);
    const update = deferred(CoolerArticleResource.partialUpdate, {
      getOptimisticResponse(snap: any, params: any, body: any) {
        return { id: params.id, ...body };
      },
    });
    const { container, hide, show } = renderTabs(
      <Article endpoint={get.endpoint} />,
    );
    await wait(0);
    await get.resolve(0, 'start');

    act(() => {
      ctrl.fetch(update.endpoint, { id: 5 }, { title: 'optimistic' });
    });
    expect(container.textContent).toBe('optimistic');

    await hide();
    await update.resolve(0, 'saved');
    await show();

    expect(container.textContent).toBe('saved');
    expect(ctrl.getState().optimistic).toHaveLength(0);
  });

  it('keeps a response that lands after a reset while hidden out of the store', async () => {
    const get = deferred(CoolerArticleResource.get);
    const { container, hide, show } = renderTabs(
      <Article endpoint={get.endpoint} />,
    );
    // the reset must come at least 1 ms after the fetch started
    await wait(2);

    await hide();
    act(() => {
      ctrl.resetEntireStore();
    });
    await get.resolve(0, 'old');
    await show();

    // the reset cleared the store, so it fetches again instead of showing the old response
    expect(container.textContent).toBe('loading');
    expect(get.pending.length).toBeGreaterThan(1);
    for (let n = 1; n < get.pending.length; n++) await get.resolve(n, 'new');
    expect(container.textContent).toBe('new');
  });

  it('resumes polling after showing', async () => {
    let calls = 0;
    const endpoint = CoolerArticleResource.get.extend({
      pollFrequency: 20,
      fetch() {
        calls++;
        return Promise.resolve({ id: 5, title: `poll ${calls}`, content: 'x' });
      },
    });
    function Polled() {
      useSubscription(endpoint, { id: 5 });
      return <Article endpoint={endpoint} />;
    }
    const { hide, show } = renderTabs(<Polled />);
    await wait(10);

    await hide();
    const hiddenAt = calls;
    await wait(60);
    // hidden Effects unsubscribe, so polling stops
    expect(calls).toBe(hiddenAt);

    await show();
    await wait(60);
    expect(calls).toBeGreaterThan(hiddenAt);
  });
});

describe('<DataProvider> remounted with the same managers', () => {
  /** Returns a function that renders `children` (an Article by default) in a new
   * DataProvider each call, all sharing one set of managers */
  function renderWithSharedManagers(
    endpoint: typeof CoolerArticleResource.get,
    Wrapper: React.ElementType = React.Fragment,
  ) {
    const managers = getManagers();
    return (children: React.ReactNode = <Article endpoint={endpoint} />) =>
      render(<Wrapper>{provider(managers, children)}</Wrapper>);
  }

  it('does not wait on a fetch from the unmounted store', async () => {
    const get = deferred(CoolerArticleResource.get);
    const mount = renderWithSharedManagers(get.endpoint);
    const first = mount();
    await wait(0);
    first.unmount();
    await get.resolve(0, 'old');

    const { container } = mount();
    await wait(0);
    expect(get.pending).toHaveLength(2);
    await get.resolve(1, 'new');
    expect(container.textContent).toBe('new');
  });

  it.each([
    ['response', (get: Deferred) => get.resolve(0, 'old')],
    ['error', (get: Deferred) => get.reject(0)],
  ])(
    'keeps a late %s from the unmounted store out of the new one',
    async (_, settleOld) => {
      const get = deferred(CoolerArticleResource.get);
      const mount = renderWithSharedManagers(get.endpoint);
      const first = mount();
      await wait(0);
      first.unmount();

      const { container } = mount();
      await wait(0);
      expect(get.pending).toHaveLength(2);
      await settleOld(get);
      expect(container.textContent).toBe('loading');
      // the old fetch neither settles the new store's fetch nor triggers a refetch
      await wait(0);
      expect(container.textContent).toBe('loading');
      expect(get.pending).toHaveLength(2);
      await get.resolve(1, 'new');
      expect(container.textContent).toBe('new');
    },
  );

  it('ignores a fetch from the unmounted store', async () => {
    const get = deferred(CoolerArticleResource.get);
    const mount = renderWithSharedManagers(get.endpoint);
    const first = mount(<Fetcher />);
    const oldCtrl = ctrl;
    first.unmount();

    const { container } = mount();
    await wait(0);
    oldCtrl.fetch(get.endpoint, { id: 5 });
    await wait(0);
    // the old store is gone, so its fetch is never sent
    expect(get.pending).toHaveLength(1);
    expect(container.textContent).toBe('loading');
    await get.resolve(0, 'new');
    expect(container.textContent).toBe('new');
  });

  it('settles fetches in StrictMode, where render and Effects run twice', async () => {
    const get = deferred(CoolerArticleResource.get);
    const mount = renderWithSharedManagers(get.endpoint, StrictMode);
    const first = mount();
    await wait(0);
    await get.resolve(get.pending.length - 1, 'first');
    expect(first.container.textContent).toBe('first');
    first.unmount();

    const { container } = mount();
    await wait(0);
    await get.resolve(get.pending.length - 1, 'second');
    expect(container.textContent).toBe('second');
  });
});

describe('<DataProvider> unmounted with a fetch in flight', () => {
  it('drops the late response without errors', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const get = deferred(CoolerArticleResource.get);
      const { unmount } = render(
        provider(getManagers(), <Article endpoint={get.endpoint} />),
      );
      await wait(0);
      unmount();
      await get.resolve(0, 'late');
      await wait(0);
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
