/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react';

import { useHiddenUntilIdle } from '../hiddenContext';
import { whenIdle } from '../monaco/whenIdle';

jest.mock('../monaco/whenIdle', () => ({ whenIdle: jest.fn(() => jest.fn()) }));

const runIdle = () => act(() => (whenIdle as jest.Mock).mock.calls.at(-1)[0]());

describe('useHiddenUntilIdle', () => {
  beforeEach(() => (whenIdle as jest.Mock).mockClear());

  it('stays hidden until the page is idle, then stays shown', () => {
    const { result, rerender } = renderHook(
      ({ hidden }) => useHiddenUntilIdle(hidden),
      { initialProps: { hidden: true } },
    );
    expect(result.current[0]).toBe(true);
    runIdle();
    expect(result.current[0]).toBe(false);
    rerender({ hidden: true });
    expect(result.current[0]).toBe(false);
  });

  it('shows at once when shown before the page is idle', () => {
    const { result, rerender } = renderHook(
      ({ hidden }) => useHiddenUntilIdle(hidden),
      { initialProps: { hidden: true } },
    );
    rerender({ hidden: false });
    expect(result.current[0]).toBe(false);
  });

  it('shows at once on reveal', () => {
    const { result } = renderHook(() => useHiddenUntilIdle(true));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it('never waits for what is shown', () => {
    renderHook(() => useHiddenUntilIdle(false));
    expect(whenIdle).not.toHaveBeenCalled();
  });
});
