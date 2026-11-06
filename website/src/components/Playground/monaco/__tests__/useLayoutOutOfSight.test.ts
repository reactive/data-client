/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react';
import type * as Monaco from 'monaco-editor';

import useLayoutOutOfSight from '../useLayoutOutOfSight';
import { whenIdle } from '../whenIdle';

jest.mock('../whenIdle', () => ({ whenIdle: jest.fn(() => jest.fn()) }));

function fakeEditor(width: number) {
  const onDidDispose = jest.fn();
  const editor = {
    getLayoutInfo: () => ({ width }),
    onDidDispose,
  } as unknown as Monaco.editor.ICodeEditor;
  return Object.assign(editor, {
    disposeNow: () => onDidDispose.mock.calls[0][0](),
  });
}

const idleTask = () => jest.mocked(whenIdle).mock.calls[0][0];
const cancelIdle = () => jest.mocked(whenIdle).mock.results[0].value;

describe('useLayoutOutOfSight', () => {
  beforeEach(() => jest.mocked(whenIdle).mockClear());

  test('a hidden editor is out of sight from idle until it has painted', () => {
    const { result } = renderHook(() => useLayoutOutOfSight());
    act(() => result.current.handleMount(fakeEditor(0)));
    expect(result.current.outOfSight).toBe(false);
    act(() => idleTask()());
    expect(result.current.outOfSight).toBe(true);
    act(() => result.current.handlePainted());
    expect(result.current.outOfSight).toBe(false);
  });

  test('one shown before idle paints where it is, and is never out of sight', () => {
    const { result } = renderHook(() => useLayoutOutOfSight());
    act(() => result.current.handleMount(fakeEditor(0)));
    act(() => result.current.handlePainted());
    expect(cancelIdle()).toHaveBeenCalled();
    expect(result.current.outOfSight).toBe(false);
  });

  test('a shown editor needs nothing', () => {
    const { result } = renderHook(() => useLayoutOutOfSight());
    act(() => result.current.handleMount(fakeEditor(600)));
    expect(whenIdle).not.toHaveBeenCalled();
  });

  test('stops waiting for idle when the editor goes', () => {
    const { result } = renderHook(() => useLayoutOutOfSight());
    const editor = fakeEditor(0);
    act(() => result.current.handleMount(editor));
    editor.disposeNow();
    expect(cancelIdle()).toHaveBeenCalled();
  });
});
