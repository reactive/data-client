// eslint-env jest
import type { Manager } from '@data-client/core';
import { Controller, initialState } from '@data-client/core';
import { act, render } from '@testing-library/react';
import { CoolerArticleResource } from '__tests__/new';
import React, { StrictMode, Suspense } from 'react';

import { useSuspense } from '../../hooks';
import TestExternalDataProvider from '../../server/redux/DataProvider';
import DataProvider from '../DataProvider';
import { getDefaultManagers } from '../getDefaultManagers';

const endpoint = CoolerArticleResource.get.extend({
  fetch: () => Promise.resolve({ id: 5, title: 'loaded', content: 'x' }),
});
function Article() {
  return <div>{useSuspense(endpoint, { id: 5 }).title}</div>;
}
const wait = () => act(() => new Promise(r => setTimeout(r, 20)));

describe('<DataProvider managers={() => [...]} />', () => {
  /** A factory that records each set of Managers it makes */
  function recordingFactory() {
    const sets: Manager[][] = [];
    const factory = () => {
      const managers = getDefaultManagers({ devToolsManager: null });
      sets.push(managers);
      return managers;
    };
    return { factory, sets };
  }
  const tree = (managers: () => Manager[], key = 'a') => (
    <DataProvider key={key} managers={managers} devButton={null}>
      <Suspense fallback="loading">
        <Article />
      </Suspense>
    </DataProvider>
  );

  it('makes Managers once for a store', async () => {
    const { factory, sets } = recordingFactory();
    const { container, rerender } = render(tree(factory));
    rerender(tree(factory));
    await wait();
    expect(container.textContent).toBe('loaded');
    expect(sets).toHaveLength(1);
  });

  it('gives a remounted store new Managers', async () => {
    const { factory, sets } = recordingFactory();
    const { container, rerender } = render(tree(factory));
    await wait();
    rerender(tree(factory, 'b'));
    await wait();
    expect(container.textContent).toBe('loaded');
    expect(sets).toHaveLength(2);
    expect(sets[1][0]).not.toBe(sets[0][0]);
  });

  it('fetches in StrictMode', async () => {
    const { factory } = recordingFactory();
    const { container } = render(<StrictMode>{tree(factory)}</StrictMode>);
    await wait();
    expect(container.textContent).toBe('loaded');
  });
});

describe('<TestExternalDataProvider />', () => {
  it('fetches in StrictMode', async () => {
    const { container } = render(
      <StrictMode>
        <TestExternalDataProvider
          managers={() => getDefaultManagers({ devToolsManager: null })}
          initialState={initialState}
          Controller={Controller}
          devButton={null}
        >
          <Suspense fallback="loading">
            <Article />
          </Suspense>
        </TestExternalDataProvider>
      </StrictMode>,
    );
    await wait();
    expect(container.textContent).toBe('loaded');
  });
});
