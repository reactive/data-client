/// <reference types="jest" />

import { act, renderHook } from '@testing-library/react';

import { usePreviewReset } from '../usePreviewReset';

const oldState = { entities: { Post: {} } } as any;

function setup() {
  const hook = renderHook(({ code }) => usePreviewReset(code), {
    initialProps: { code: 'v1' },
  });
  (hook.result.current.controller as any).current = {
    getState: () => oldState,
  };
  return hook;
}

it('retries an edit-caused render error once with a fresh store', () => {
  const { result, rerender } = setup();
  act(() => result.current.onHealthy());
  rerender({ code: 'v2' });
  act(() => result.current.onRenderError('v2'));
  expect(result.current.key).toBe(1);
  expect(result.current.initialState).toBeUndefined();
});

it('restores the old store when the fresh store errors too', () => {
  const { result, rerender } = setup();
  act(() => result.current.onHealthy());
  rerender({ code: 'v2' });
  act(() => result.current.onRenderError('v2'));
  act(() => result.current.onRenderError('v2'));
  expect(result.current.key).toBe(2);
  expect(result.current.initialState).toBe(oldState);

  // further typo keystrokes don't retry until the preview works again
  rerender({ code: 'v3' });
  act(() => result.current.onRenderError('v3'));
  expect(result.current.key).toBe(2);
  act(() => result.current.onHealthy());
  rerender({ code: 'v4' });
  act(() => result.current.onRenderError('v4'));
  expect(result.current.key).toBe(3);
});

it('never retries errors of the code the store was created with', () => {
  const { result } = setup();
  act(() => result.current.onHealthy());
  act(() => result.current.onRenderError('v1'));
  expect(result.current.key).toBe(0);
});

it('keeps the fresh store once the user interacts with it', () => {
  const { result, rerender } = setup();
  act(() => result.current.onHealthy());
  rerender({ code: 'v2' });
  act(() => result.current.onRenderError('v2'));
  act(() => result.current.onInteract());
  act(() => result.current.onRenderError('v2'));
  expect(result.current.key).toBe(1);
  expect(result.current.initialState).toBeUndefined();
});

it('reset remounts with a fresh store', () => {
  const { result } = setup();
  act(() => result.current.reset());
  expect(result.current.key).toBe(1);
});
