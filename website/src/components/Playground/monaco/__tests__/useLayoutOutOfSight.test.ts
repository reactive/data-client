/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react';
import type * as Monaco from 'monaco-editor';

import useLayoutOutOfSight from '../useLayoutOutOfSight';
import { whenIdle } from '../whenIdle';
import { whenPainted } from '../whenPainted';

jest.mock('../whenIdle', () => ({ whenIdle: jest.fn(() => jest.fn()) }));
jest.mock('../whenPainted', () => ({ whenPainted: jest.fn(() => jest.fn()) }));

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
const paintedCallback = () => jest.mocked(whenPainted).mock.calls[0][1];

describe('useLayoutOutOfSight', () => {
  beforeEach(() => {
    jest.mocked(whenIdle).mockClear();
    jest.mocked(whenPainted).mockClear();
  });

  test('a hidden editor is out of sight from idle until it has painted', () => {
    const { result } = renderHook(() => useLayoutOutOfSight());
    act(() => result.current.handleMount(fakeEditor(0)));
    expect(result.current.outOfSight).toBe(false);
    act(() => idleTask()());
    expect(result.current.outOfSight).toBe(true);
    act(() => paintedCallback()());
    expect(result.current.outOfSight).toBe(false);
  });

  test('one shown before idle paints where it is, and is never out of sight', () => {
    const { result } = renderHook(() => useLayoutOutOfSight());
    act(() => result.current.handleMount(fakeEditor(0)));
    act(() => paintedCallback()());
    const cancelIdle = jest.mocked(whenIdle).mock.results[0].value;
    expect(cancelIdle).toHaveBeenCalled();
    expect(result.current.outOfSight).toBe(false);
  });

  test('a shown editor needs nothing', () => {
    const { result } = renderHook(() => useLayoutOutOfSight());
    act(() => result.current.handleMount(fakeEditor(600)));
    expect(whenIdle).not.toHaveBeenCalled();
    expect(whenPainted).not.toHaveBeenCalled();
  });

  test('stops both waits when the editor goes', () => {
    const { result } = renderHook(() => useLayoutOutOfSight());
    const editor = fakeEditor(0);
    act(() => result.current.handleMount(editor));
    editor.disposeNow();
    expect(jest.mocked(whenIdle).mock.results[0].value).toHaveBeenCalled();
    expect(jest.mocked(whenPainted).mock.results[0].value).toHaveBeenCalled();
  });
});
