// eslint-env jest
import { act, render } from '@testing-library/react';
import { CoolerArticleResource } from '__tests__/new';
import React, { Activity, Suspense } from 'react';

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
  const pending: ((value: any) => void)[] = [];
  const endpoint: E = base.extend({
    ...options,
    fetch() {
      return new Promise(resolve => pending.push(resolve));
    },
  });
  /** Resolves the nth fetch with an article titled `title` */
  const resolve = (n: number, title: string) =>
    act(async () => pending[n]({ id: 5, title, content: 'x' }));
  return { endpoint, pending, resolve };
}

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

describeIfActivity('<Activity> above <DataProvider>', () => {
  function renderTabs(children: React.ReactNode) {
    const managers = getManagers();
    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <DataProvider managers={managers} devButton={null}>
          <Suspense fallback="loading">{children}</Suspense>
        </DataProvider>
      </Activity>
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
  it('does not wait on a fetch from the unmounted store', async () => {
    const get = deferred(CoolerArticleResource.get);
    const managers = getManagers();
    const tree = (
      <DataProvider managers={managers} devButton={null}>
        <Suspense fallback="loading">
          <Article endpoint={get.endpoint} />
        </Suspense>
      </DataProvider>
    );
    const first = render(tree);
    await wait(0);
    first.unmount();
    await get.resolve(0, 'old');

    const { container } = render(tree);
    await wait(0);
    expect(get.pending).toHaveLength(2);
    await get.resolve(1, 'new');
    expect(container.textContent).toBe('new');
  });

  it('keeps a late response from the unmounted store out of the new one', async () => {
    const get = deferred(CoolerArticleResource.get);
    const managers = getManagers();
    const tree = (
      <DataProvider managers={managers} devButton={null}>
        <Suspense fallback="loading">
          <Article endpoint={get.endpoint} />
        </Suspense>
      </DataProvider>
    );
    const first = render(tree);
    await wait(0);
    first.unmount();

    const { container } = render(tree);
    await wait(0);
    expect(get.pending).toHaveLength(2);
    await get.resolve(0, 'old');
    expect(container.textContent).toBe('loading');
    await get.resolve(1, 'new');
    expect(container.textContent).toBe('new');
  });
});
