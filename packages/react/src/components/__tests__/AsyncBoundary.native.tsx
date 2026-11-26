jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const useSyncExternalStore = jest.fn((...args: any[]) =>
    actual.useSyncExternalStore(...args),
  );
  const wrapped = { ...actual, useSyncExternalStore };
  return { ...wrapped, default: wrapped };
});

import { render } from '@testing-library/react-native';
import React, { useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';

import AsyncBoundary from '../AsyncBoundary';
import { BoundaryContext } from '../BoundaryContext';
import DataProvider from '../DataProvider';

/** The web build's AsyncBoundary; this project resolves `../AsyncBoundary` to the native file */
const WebAsyncBoundary: typeof AsyncBoundary = jest.requireActual(
  '../AsyncBoundary.tsx',
).default;

// N1/tree-unchanged: React Native renders the web tree without an adapter, whatever BoundaryContext holds
describe('<AsyncBoundary /> (React Native)', () => {
  const pending = new Map<string, Promise<void>>();
  function Suspends({ id }: { id: string }): React.ReactElement {
    if (!pending.has(id)) pending.set(id, new Promise<void>(() => {}));
    throw pending.get(id);
  }
  function Throws(): React.ReactElement {
    throw new Error('you failed');
  }
  function ErrorShown({ error }: { error: Error }) {
    return <Text>caught: {error.message}</Text>;
  }
  const children: [string, () => React.ReactElement][] = [
    ['content', () => <Text>hi</Text>],
    ['suspended child', () => <Suspends id={String(Math.random())} />],
    ['throwing child', () => <Throws />],
  ];
  const fallbacks: [string, React.ReactNode][] = [
    ['fallback set', <Text key="f">loading</Text>],
    ['fallback unset', undefined],
  ];
  const errorComponents: [string, typeof ErrorShown | undefined][] = [
    ['errorComponent set', ErrorShown],
    ['errorComponent unset', undefined],
  ];
  let errorspy: jest.Spied<any>;
  beforeEach(() => {
    errorspy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (useSyncExternalStore as jest.Mock).mockClear();
  });
  afterEach(() => {
    errorspy.mockRestore();
  });

  it('is not the web build', () => {
    expect(WebAsyncBoundary).not.toBe(AsyncBoundary);
  });

  for (const [childName, child] of children)
    for (const [fallbackName, fallback] of fallbacks)
      for (const [errorName, errorComponent] of errorComponents)
        it(`renders the web tree without an adapter: ${childName}, ${fallbackName}, ${errorName}`, async () => {
          const wrap = jest.fn(() => <Text>wrapped</Text>);
          const { toJSON } = await render(
            <>
              <View testID="native">
                <DataProvider devButton={null}>
                  <BoundaryContext.Provider value={wrap}>
                    <AsyncBoundary
                      fallback={fallback}
                      errorComponent={errorComponent}
                    >
                      {child()}
                    </AsyncBoundary>
                  </BoundaryContext.Provider>
                </DataProvider>
              </View>
              <View testID="web">
                <DataProvider devButton={null}>
                  <WebAsyncBoundary
                    fallback={fallback}
                    errorComponent={errorComponent}
                  >
                    {child()}
                  </WebAsyncBoundary>
                </DataProvider>
              </View>
            </>,
          );
          const [native, web] = (toJSON() as any).children;
          if (childName !== 'suspended child' || fallback !== undefined)
            expect(native.children).not.toBeNull();
          expect(native.children).toEqual(web.children);
          expect(wrap).not.toHaveBeenCalled();
          expect(useSyncExternalStore).not.toHaveBeenCalled();
        });
});
