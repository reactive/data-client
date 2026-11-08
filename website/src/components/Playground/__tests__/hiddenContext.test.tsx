/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react';

import { useHiddenUntilIdle } from '../hiddenContext';
import { whenIdle } from '../monaco/whenIdle';

jest.mock('../monaco/whenIdle', () => ({ whenIdle: jest.fn(() => jest.fn()) }));

const runIdle = () => act(() => jest.mocked(whenIdle).mock.calls[0][0]());
const cancelIdle = () => jest.mocked(whenIdle).mock.results[0].value;

describe('useHiddenUntilIdle', () => {
  beforeEach(() => jest.mocked(whenIdle).mockClear());

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

  it('shows at once when shown before the page is idle, and stops waiting', () => {
    const { result, rerender } = renderHook(
      ({ hidden }) => useHiddenUntilIdle(hidden),
      { initialProps: { hidden: true } },
    );
    rerender({ hidden: false });
    expect(result.current[0]).toBe(false);
    expect(cancelIdle()).toHaveBeenCalled();
  });

  it('stops waiting when unmounted', () => {
    const { unmount } = renderHook(() => useHiddenUntilIdle(true));
    unmount();
    expect(cancelIdle()).toHaveBeenCalled();
  });

  it('shows at once on reveal', () => {
    const { result } = renderHook(() => useHiddenUntilIdle(true));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it('shows everything waiting in one idle period', () => {
    const first = renderHook(() => useHiddenUntilIdle(true));
    const second = renderHook(() => useHiddenUntilIdle(true));
    expect(whenIdle).toHaveBeenCalledTimes(1);
    runIdle();
    expect(first.result.current[0]).toBe(false);
    expect(second.result.current[0]).toBe(false);
  });

  it('never waits for what is shown', () => {
    renderHook(() => useHiddenUntilIdle(false));
    expect(whenIdle).not.toHaveBeenCalled();
  });
});
