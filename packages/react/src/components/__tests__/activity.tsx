// eslint-env jest
import { Manager, Middleware, actionTypes } from '@data-client/core';
import { act, render } from '@testing-library/react';
import { CoolerArticleResource } from '__tests__/new';
import React, { Suspense } from 'react';

import { useController, useSubscription, useSuspense } from '../../hooks';
import DataProvider from '../DataProvider';
import { getDefaultManagers } from '../getDefaultManagers';

// <Activity> is React 19.2+
const Activity: React.ComponentType<{
  mode: 'visible' | 'hidden';
  children: React.ReactNode;
}> = (React as any).Activity;
const describeIfActivity = Activity ? describe : describe.skip;

/** Records which actions reach the managers */
class ActionLog implements Manager {
  types: string[] = [];
  middleware: Middleware = () => next => action => {
    this.types.push(action.type);
    return next(action);
  };

  cleanup() {}
}

/** An endpoint whose fetches resolve only when the test says so */
function deferredGet() {
  const pending: ((value: any) => void)[] = [];
  const endpoint = CoolerArticleResource.get.extend({
    fetch() {
      return new Promise(resolve => pending.push(resolve));
    },
  });
  return { endpoint, pending };
}

const wait = (ms: number) => act(() => new Promise(r => setTimeout(r, ms)));

describeIfActivity('<Activity> above <DataProvider>', () => {
  function renderTabs(children: React.ReactNode, managers = getManagers()) {
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
  const getManagers = () => getDefaultManagers({ devToolsManager: null });

  it('keeps a response that lands while hidden', async () => {
    const { endpoint, pending } = deferredGet();
    function Article() {
      const article = useSuspense(endpoint, { id: 5 });
      return <div>{article.title}</div>;
    }
    const { container, hide, show } = renderTabs(<Article />);
    expect(container.textContent).toBe('loading');

    await hide();
    await act(async () => pending[0]({ id: 5, title: 'hi', content: 'x' }));
    await show();

    expect(container.textContent).toBe('hi');
    // nothing was refetched
    expect(pending).toHaveLength(1);
  });

  it('settles a fetch of the same key after showing', async () => {
    const { endpoint, pending } = deferredGet();
    let ctrl: ReturnType<typeof useController> | undefined;
    function Fetcher() {
      ctrl = useController();
      return null;
    }
    const { hide, show } = renderTabs(<Fetcher />);
    const first = ctrl!.fetch(endpoint, { id: 5 });

    await hide();
    await act(async () => pending[0]({ id: 5, title: 'first', content: 'x' }));
    await show();
    await expect(first).resolves.toMatchObject({ title: 'first' });

    // a fresh fetch of the same key starts and settles
    const second = ctrl!.fetch(endpoint, { id: 5 });
    await wait(0);
    expect(pending).toHaveLength(2);
    await act(async () => pending[1]({ id: 5, title: 'second', content: 'x' }));
    await expect(second).resolves.toMatchObject({ title: 'second' });
  });

  it('runs a fetch started while hidden', async () => {
    const { endpoint, pending } = deferredGet();
    let ctrl: ReturnType<typeof useController> | undefined;
    function Fetcher() {
      ctrl = useController();
      return null;
    }
    const { hide, show } = renderTabs(<Fetcher />);

    await hide();
    const promise = ctrl!.fetch(endpoint, { id: 5 });
    await wait(0);
    expect(pending).toHaveLength(1);
    await act(async () => pending[0]({ id: 5, title: 'hi', content: 'x' }));
    await show();

    await expect(promise).resolves.toMatchObject({ title: 'hi' });
  });

  it('reconciles an optimistic update whose response lands while hidden', async () => {
    const pending: ((value: any) => void)[] = [];
    const update = CoolerArticleResource.partialUpdate.extend({
      fetch() {
        return new Promise(resolve => pending.push(resolve));
      },
      getOptimisticResponse(snap: any, params: any, body: any) {
        return { id: params.id, ...body };
      },
    });
    const { endpoint, pending: gets } = deferredGet();
    let ctrl: ReturnType<typeof useController> | undefined;
    function Article() {
      ctrl = useController();
      const article = useSuspense(endpoint, { id: 5 });
      return <div>{article.title}</div>;
    }
    const { container, hide, show } = renderTabs(<Article />);
    await wait(0);
    await act(async () => gets[0]({ id: 5, title: 'start', content: 'x' }));
    expect(container.textContent).toBe('start');

    act(() => {
      ctrl!.fetch(update, { id: 5 }, { title: 'optimistic' });
    });
    expect(container.textContent).toBe('optimistic');

    await hide();
    await act(async () => pending[0]({ id: 5, title: 'saved', content: 'x' }));
    await show();

    expect(container.textContent).toBe('saved');
    expect(ctrl!.getState().optimistic).toHaveLength(0);
  });

  it('resumes polling after showing', async () => {
    let calls = 0;
    const endpoint = CoolerArticleResource.get.extend({
      pollFrequency: 50,
      fetch() {
        calls++;
        return Promise.resolve({ id: 5, title: `poll ${calls}`, content: 'x' });
      },
    });
    function Article() {
      const article = useSuspense(endpoint, { id: 5 });
      useSubscription(endpoint, { id: 5 });
      return <div>{article.title}</div>;
    }
    const log = new ActionLog();
    const { hide, show } = renderTabs(<Article />, [log, ...getManagers()]);
    await wait(10);

    await hide();
    const hiddenAt = calls;
    await wait(150);
    // hidden Effects unsubscribe, so polling stops
    expect(calls).toBe(hiddenAt);

    await show();
    expect(log.types.filter(t => t === actionTypes.SUBSCRIBE)).toHaveLength(2);
    await wait(150);
    expect(calls).toBeGreaterThan(hiddenAt);
  });
});

describe('<DataProvider> remounted with the same managers', () => {
  it('does not wait on a fetch from the unmounted store', async () => {
    const { endpoint, pending } = deferredGet();
    const managers = getDefaultManagers({ devToolsManager: null });
    function Article() {
      const article = useSuspense(endpoint, { id: 5 });
      return <div>{article.title}</div>;
    }
    const tree = (
      <DataProvider managers={managers} devButton={null}>
        <Suspense fallback="loading">
          <Article />
        </Suspense>
      </DataProvider>
    );
    const first = render(tree);
    await wait(0);
    first.unmount();
    await act(async () => pending[0]({ id: 5, title: 'old', content: 'x' }));

    const { container } = render(tree);
    await wait(0);
    expect(pending).toHaveLength(2);
    await act(async () => pending[1]({ id: 5, title: 'new', content: 'x' }));
    expect(container.textContent).toBe('new');
  });
});
