import { actions } from '@data-client/core';
import { Endpoint } from '@data-client/endpoint';
import { act, render } from '@testing-library/react';
import React, { Activity, Suspense, startTransition } from 'react';

import { useCache } from '../../hooks';
import ClientStore from '../ClientStore';
import { LegacyReact } from '../LegacyReact';
import DataProvider from '../DataProvider';

const endpoint = new Endpoint((id: number) => Promise.resolve(id), {
  name: 'stored',
});

function Value({ id }: { id: number }) {
  const value = useCache(endpoint, id);
  return <span>{value === undefined ? `no ${id}` : `value ${value}`}</span>;
}

function Forever(): React.ReactNode {
  throw new Promise(() => {});
}

const text = (container: HTMLElement) => container.textContent;
// Activity is React 19.2+
const it19 = Activity !== undefined ? it : it.skip;
// legacy Suspense commits the siblings of what suspends
const it18 = LegacyReact ? it.skip : it;

describe('ClientStore', () => {
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    // a render React discards must not receive updates
    expect(
      errorSpy.mock.calls.filter(([msg]) => `${msg}`.includes('not mounted')),
    ).toEqual([]);
    errorSpy.mockRestore();
  });

  it('settles fetches before any provider renders, and the first provider shows them', async () => {
    const store = new ClientStore();
    await expect(store.controller.fetch(endpoint, 1)).resolves.toBe(1);
    expect(store.getState().endpoints[endpoint.key(1)]).toBe(1);
    const { container } = render(
      <DataProvider store={store} devButton={null}>
        <Value id={1} />
      </DataProvider>,
    );
    expect(text(container)).toBe('value 1');
  });

  it18(
    'keeps updating a mounted provider after another provider render is discarded',
    async () => {
      const store = new ClientStore();
      const { container } = render(
        <DataProvider store={store} devButton={null}>
          <Value id={2} />
        </DataProvider>,
      );
      // the second provider never commits; it must not take over the Controller
      const discarded = render(
        <Suspense fallback="loading">
          <DataProvider store={store} devButton={null}>
            <Value id={2} />
          </DataProvider>
          <Forever />
        </Suspense>,
      );
      expect(text(discarded.container)).toBe('loading');
      await act(async () => {
        void store.controller.setResponse(endpoint, 2, 2);
      });
      expect(text(container)).toBe('value 2');
      discarded.unmount();
    },
  );

  it('updates every committed provider, and the rest after one unmounts', async () => {
    const store = new ClientStore();
    const first = render(
      <DataProvider store={store} devButton={null}>
        <Value id={3} />
      </DataProvider>,
    );
    const second = render(
      <DataProvider store={store} devButton={null}>
        <Value id={3} />
      </DataProvider>,
    );
    await act(async () => {
      void store.controller.setResponse(endpoint, 3, 3);
    });
    expect(text(first.container)).toBe('value 3');
    expect(text(second.container)).toBe('value 3');

    first.unmount();
    await act(async () => {
      void store.controller.setResponse(endpoint, 3, 33);
    });
    expect(text(second.container)).toBe('value 33');
  });

  it('starts a remounted provider from the latest state', async () => {
    const store = new ClientStore();
    const tree = (
      <DataProvider store={store} devButton={null}>
        <Value id={4} />
      </DataProvider>
    );
    const first = render(tree);
    await act(async () => {
      void store.controller.setResponse(endpoint, 4, 4);
    });
    first.unmount();
    // nothing is committed, so the store reduces it
    await act(async () => {
      void store.controller.setResponse(endpoint, 4, 44);
    });
    expect(store.getState().endpoints[endpoint.key(4)]).toBe(44);
    const second = render(tree);
    expect(text(second.container)).toBe('value 44');
  });

  it('uses the store state when a mounted provider commits', async () => {
    const store = new ClientStore();
    const { container } = render(
      <DataProvider store={store} devButton={null}>
        <Value id={5} />
      </DataProvider>,
    );
    await act(async () => {
      void store.controller.setResponse(endpoint, 5, 5);
    });
    expect(store.getState().endpoints[endpoint.key(5)]).toBe(5);
    expect(text(container)).toBe('value 5');
  });

  it19(
    'catches up on actions that leave state unchanged, as well as results, while uncommitted',
    async () => {
      const store = new ClientStore();
      const tree = (mode: 'hidden' | 'visible') => (
        <Activity mode={mode}>
          <DataProvider store={store} devButton={null}>
            <Value id={6} />
          </DataProvider>
        </Activity>
      );
      const { container, rerender } = render(tree('hidden'));
      const before = store.getState();
      let settled = false;
      act(() => {
        // a fetch the reducer doesn't store returns the same state
        void store.controller.dispatch(
          actions.createFetch(endpoint, { args: [6] }),
        );
        void store.controller
          .setResponse(endpoint, 6, 6)
          .then(() => (settled = true));
      });
      expect(store.getState()).not.toBe(before);
      await act(() => Promise.resolve());
      // held until a provider commits, so a hidden reader reuses the fetch
      expect(settled).toBe(false);
      await act(async () => rerender(tree('visible')));
      expect(text(container)).toBe('value 6');
      expect(settled).toBe(true);
    },
  );

  it19('shows a transition dispatched before mount', async () => {
    const store = new ClientStore();
    const tree = (mode: 'hidden' | 'visible') => (
      <Activity mode={mode}>
        <DataProvider store={store} devButton={null}>
          <Value id={7} />
        </DataProvider>
      </Activity>
    );
    const { container, rerender } = render(tree('hidden'));
    act(() =>
      startTransition(() => {
        void store.controller.setResponse(endpoint, 7, 7);
      }),
    );
    // catching up runs in the commit's sync lane, not the transition's
    await act(async () => rerender(tree('visible')));
    expect(text(container)).toBe('value 7');
  });

  it18(
    'keeps updating the mounted tree while a transition remount never commits',
    async () => {
      const store = new ClientStore();
      const App = ({ k }: { k: number }) => (
        <Suspense fallback="loading">
          <DataProvider key={k} store={store} devButton={null}>
            <Value id={8} />
          </DataProvider>
          {k > 1 ?
            <Forever />
          : null}
        </Suspense>
      );
      const { container, rerender } = render(<App k={1} />);
      await act(async () => {
        void store.controller.setResponse(endpoint, 8, 5);
      });
      expect(text(container)).toBe('value 5');
      // the new key's provider renders but the transition never commits
      act(() => startTransition(() => rerender(<App k={2} />)));
      expect(text(container)).toBe('value 5');
      let settled = false;
      await act(async () => {
        void store.controller
          .setResponse(endpoint, 8, 6)
          .then(() => (settled = true));
      });
      expect(text(container)).toBe('value 6');
      expect(settled).toBe(true);
    },
  );

  it('drops a response that settles after a reset before mount', async () => {
    let release = (_value: number) => {};
    const slow = new Endpoint(
      () => new Promise<number>(resolve => (release = resolve)),
      { name: 'slow' },
    );
    const store = new ClientStore();
    const fetched = store.controller.fetch(slow);
    // a result fetched in the same millisecond as the reset counts as newer
    await new Promise(resolve => setTimeout(resolve, 2));
    await store.controller.resetEntireStore();
    release(9);
    // like a mounted provider: the reset aborts it, so the stale result is never stored
    await expect(fetched).rejects.toThrow('RESET');
    expect(store.getState().endpoints[slow.key()]).toBeUndefined();
    const { container } = render(
      <DataProvider store={store} devButton={null}>
        <Value id={9} />
      </DataProvider>,
    );
    expect(text(container)).toBe('no 9');
  });

  it('rejects provider props that the store owns', () => {
    const store = new ClientStore();
    // @ts-expect-error the store owns its managers
    <DataProvider store={store} managers={[]}>
      <div />
    </DataProvider>;
    // @ts-expect-error the store owns its state
    <DataProvider store={store} initialState={store.getState()}>
      <div />
    </DataProvider>;
  });
});
