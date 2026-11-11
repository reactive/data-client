jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const useSyncExternalStore = jest.fn((...args: any[]) =>
    actual.useSyncExternalStore(...args),
  );
  const wrapped = { ...actual, useSyncExternalStore };
  return { ...wrapped, default: wrapped };
});

import { render } from '@testing-library/react-native';
import React, { Suspense, useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';

import AsyncBoundary from '../AsyncBoundary';
import { BoundaryContext } from '../BoundaryContext';
import DataProvider from '../DataProvider';
import ErrorBoundary from '../ErrorBoundary';

// N1/tree-unchanged: React Native renders master's AsyncBoundary, whatever BoundaryContext holds
describe('<AsyncBoundary /> (React Native)', () => {
  const pending = new Map<string, Promise<void>>();
  function Suspends({ id }: { id: string }): React.ReactElement {
    if (!pending.has(id)) pending.set(id, new Promise<void>(() => {}));
    throw pending.get(id);
  }
  function Throws(): React.ReactElement {
    throw new Error('you failed');
  }
  const cases: [string, () => React.ReactElement][] = [
    ['content', () => <Text>hi</Text>],
    ['suspended child', () => <Suspends id={String(Math.random())} />],
    ['throwing child', () => <Throws />],
  ];
  let errorspy: jest.Spied<any>;
  beforeEach(() => {
    errorspy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (useSyncExternalStore as jest.Mock).mockClear();
  });
  afterEach(() => {
    errorspy.mockRestore();
  });

  /** AsyncBoundary's body on master */
  function MasterBoundary({ children }: { children: React.ReactNode }) {
    return (
      <Suspense fallback={<Text>loading</Text>}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </Suspense>
    );
  }

  for (const [name, child] of cases) {
    it(`renders master's tree: ${name}`, async () => {
      const wrap = jest.fn(() => <Text>wrapped</Text>);
      const { toJSON } = await render(
        <>
          <View testID="branch">
            <DataProvider devButton={null}>
              <BoundaryContext.Provider value={wrap}>
                <AsyncBoundary fallback={<Text>loading</Text>}>
                  {child()}
                </AsyncBoundary>
              </BoundaryContext.Provider>
            </DataProvider>
          </View>
          <View testID="master">
            <DataProvider devButton={null}>
              <MasterBoundary>{child()}</MasterBoundary>
            </DataProvider>
          </View>
        </>,
      );
      const [branch, master] = (toJSON() as any).children;
      expect(branch.children).not.toBeNull();
      expect(branch.children).toEqual(master.children);
      expect(wrap).not.toHaveBeenCalled();
      expect(useSyncExternalStore).not.toHaveBeenCalled();
    });
  }
});
