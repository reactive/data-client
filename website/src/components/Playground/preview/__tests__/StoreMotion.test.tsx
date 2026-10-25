/// <reference types="jest" />
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { useStoreMotion, useStoreOpen } from '../StoreToggle';

// one stored choice for the group, as the page's storage slot is
let mockStored: string | null = null;
const mockListeners = new Set<() => void>();
const mockSetStored = (value: string) => {
  mockStored = value;
  mockListeners.forEach(listener => listener());
};
jest.mock('../../../../utils/tabStorage', () => ({
  useTabStorage: () => {
    const { useSyncExternalStore } = require('react');
    const value = useSyncExternalStore(
      (listener: () => void) => {
        mockListeners.add(listener);
        return () => mockListeners.delete(listener);
      },
      () => mockStored,
    );
    return [value, mockSetStored];
  },
}));

let showStore: ReturnType<typeof useStoreOpen>[2] = () => {};
function Store() {
  const [open, toggle, show, , moves] = useStoreOpen('test', 'n');
  showStore = show;
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const moving = useStoreMotion(container, moves, open);
  return (
    <div ref={setContainer} data-store-moving={moving || undefined}>
      <button onClick={toggle}>{open ? 'open' : 'shut'}</button>
    </div>
  );
}
const button = () => screen.getByRole('button');
const moving = () => button().parentElement!.hasAttribute('data-store-moving');

beforeEach(() => {
  mockStored = null;
});

it('moves only for the reader or a demo', async () => {
  render(<Store />);
  // the stored choice arriving, or another Store in the group, just lands
  act(() => mockSetStored('y'));
  expect(button().textContent).toBe('open');
  expect(moving()).toBe(false);

  fireEvent.click(button());
  expect(button().textContent).toBe('shut');
  expect(moving()).toBe(true);
  // at rest by the next frame with nothing running (no Web Animations here)
  await act(() => new Promise(requestAnimationFrame));
  expect(moving()).toBe(false);

  // a demo step that changes nothing doesn't move it
  act(() => showStore(false));
  expect(moving()).toBe(false);
  act(() => showStore(true));
  expect(button().textContent).toBe('open');
  expect(moving()).toBe(true);
});

it("moves for each of a demo's steps through the showStore it started with", async () => {
  render(<Store />);
  // a demo's run holds the showStore it started with (../autorun/stage.ts)
  const held = showStore;
  act(() => held(true));
  expect(moving()).toBe(true);
  await act(() => new Promise(requestAnimationFrame));
  expect(moving()).toBe(false);
  act(() => held(false));
  expect(button().textContent).toBe('shut');
  expect(moving()).toBe(true);
});
