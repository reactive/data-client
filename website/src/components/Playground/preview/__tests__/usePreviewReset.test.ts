/// <reference types="jest" />

import { act, renderHook } from '@testing-library/react';

import { usePreviewReset } from '../usePreviewReset';

const oldSnapshot = {
  state: { entities: { Post: {} } },
  interceptorData: { votes: 1 },
} as any;

function setup() {
  return renderHook(({ code }) => usePreviewReset(code), {
    initialProps: { code: 'v1' },
  });
}

it('retries an edit-caused render error once with a fresh store', () => {
  const { result, rerender } = setup();
  act(() => result.current.onHealthy('v1'));
  rerender({ code: 'v2' });
  act(() => result.current.onRenderError('v2', oldSnapshot));
  expect(result.current.key).toBe(1);
  expect(result.current.restored).toBeUndefined();
});

it('restores the old store when the fresh store errors too', () => {
  const { result, rerender } = setup();
  act(() => result.current.onHealthy('v1'));
  rerender({ code: 'v2' });
  act(() => result.current.onRenderError('v2', oldSnapshot));
  act(() => result.current.onRenderError('v2', oldSnapshot));
  expect(result.current.key).toBe(2);
  expect(result.current.restored).toBe(oldSnapshot);

  // further typo keystrokes don't retry until the preview works again
  rerender({ code: 'v3' });
  act(() => result.current.onRenderError('v3', oldSnapshot));
  expect(result.current.key).toBe(2);
  act(() => result.current.onHealthy('v3fixed'));
  rerender({ code: 'v4' });
  act(() => result.current.onRenderError('v4', oldSnapshot));
  expect(result.current.key).toBe(3);
});

it('never retries errors of code that already rendered cleanly', () => {
  const { result, rerender } = setup();
  act(() => result.current.onHealthy('v1'));
  rerender({ code: 'v2' });
  act(() => result.current.onHealthy('v2'));
  act(() => result.current.onRenderError('v2', oldSnapshot));
  expect(result.current.key).toBe(0);
});

it('drops the old store once other code renders cleanly', () => {
  const { result, rerender } = setup();
  act(() => result.current.onHealthy('v1'));
  rerender({ code: 'v2' });
  act(() => result.current.onRenderError('v2', oldSnapshot));
  rerender({ code: 'v3' });
  act(() => result.current.onHealthy('v3'));
  act(() => result.current.onRenderError('v3', oldSnapshot));
  expect(result.current.key).toBe(1);
  expect(result.current.restored).toBeUndefined();
});

it('never retries errors of the code the store was created with', () => {
  const { result } = setup();
  act(() => result.current.onHealthy('v1'));
  act(() => result.current.onRenderError('v1', oldSnapshot));
  expect(result.current.key).toBe(0);
});

it('keeps the fresh store once the user interacts with it', () => {
  const { result, rerender } = setup();
  act(() => result.current.onHealthy('v1'));
  rerender({ code: 'v2' });
  act(() => result.current.onRenderError('v2', oldSnapshot));
  act(() => result.current.onInteract());
  act(() => result.current.onRenderError('v2', oldSnapshot));
  expect(result.current.key).toBe(1);
  expect(result.current.restored).toBeUndefined();
});

it('reset remounts with a fresh store', () => {
  const { result } = setup();
  act(() => result.current.reset());
  expect(result.current.key).toBe(1);
});

it('keeps state identity when nothing changes', () => {
  const { result } = setup();
  act(() => result.current.onHealthy('v1'));
  const before = result.current.onInteract;
  act(() => {
    result.current.onHealthy('v1');
    result.current.onInteract();
  });
  expect(result.current.key).toBe(0);
  expect(result.current.onInteract).toBe(before);
});
