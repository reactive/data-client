/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react';
import type * as Monaco from 'monaco-editor';

import useEditorCover from '../useEditorCover';
import { holdIdle } from '../whenIdle';
import { whenPainted } from '../whenPainted';

jest.mock('../whenPainted', () => ({ whenPainted: jest.fn(() => jest.fn()) }));
jest.mock('../whenIdle', () => ({ holdIdle: jest.fn(() => jest.fn()) }));

/** An editor the reader can `focus()`, `key()` in or `click()` */
function fakeEditor(width = 600) {
  const listeners: Record<string, () => void> = {};
  const on = (event: string) => (listener: () => void) => {
    listeners[event] = listener;
    return { dispose: () => delete listeners[event] };
  };
  const editor = {
    onDidFocusEditorText: on('focus'),
    onKeyDown: on('key'),
    onMouseDown: on('click'),
    onDidDispose: () => ({ dispose() {} }),
    getLayoutInfo: () => ({ width }),
  } as unknown as Monaco.editor.ICodeEditor;
  const fire = (event: string) => () => act(() => listeners[event]?.());
  return Object.assign(editor, {
    focus: fire('focus'),
    key: fire('key'),
    click: fire('click'),
  });
}

/** Ends `editor`'s whenPainted wait, as when it has painted */
function finish(editor: Monaco.editor.ICodeEditor) {
  const call = jest.mocked(whenPainted).mock.calls.find(([e]) => e === editor);
  expect(call).toBeDefined();
  act(() => call?.[1]());
}

describe('useEditorCover', () => {
  // jsdom has no Element.animate: the cover goes at once
  beforeEach(() => {
    jest.mocked(whenPainted).mockClear();
    jest.mocked(holdIdle).mockClear();
  });

  /** the release of the deferred-work hold the last call took */
  const lastRelease = () =>
    jest.mocked(holdIdle).mock.results.at(-1)?.value as jest.Mock;

  test('holds deferred work until the shown editor paints', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor()];
    act(() => result.current.revealWhenPainted(panes));
    expect(holdIdle).toHaveBeenCalledTimes(1);
    expect(lastRelease()).not.toHaveBeenCalled();
    finish(panes[0]);
    expect(lastRelease()).toHaveBeenCalled();
  });

  test("a hidden editor doesn't hold deferred work", () => {
    const { result } = renderHook(() => useEditorCover());
    act(() => result.current.revealWhenPainted([fakeEditor(0)]));
    expect(holdIdle).not.toHaveBeenCalled();
  });

  test('stays until every editor has painted', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor(), fakeEditor()];
    act(() => result.current.revealWhenPainted(panes));
    finish(panes[0]);
    expect(result.current.covered).toBe(true);
    finish(panes[1]);
    expect(result.current.covered).toBe(false);
  });

  test('goes at once when a painted editor gains focus, and stops the others waiting', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor(), fakeEditor()];
    act(() => result.current.revealWhenPainted(panes));
    finish(panes[0]);
    // the painted pane still reveals on focus
    panes[0].focus();
    expect(result.current.covered).toBe(false);
    const { mock } = jest.mocked(whenPainted);
    const stopModified =
      mock.results[mock.calls.findIndex(([e]) => e === panes[1])].value;
    expect(stopModified).toHaveBeenCalled();
  });

  test('starts the paint wait when `after` says', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor()];
    let start = () => {};
    act(() => result.current.revealWhenPainted(panes, s => (start = s)));
    expect(whenPainted).not.toHaveBeenCalled();
    act(() => start());
    finish(panes[0]);
    expect(result.current.covered).toBe(false);
  });

  test('goes at once on focus before `after` says, and never starts', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor()];
    let start = () => {};
    act(() => result.current.revealWhenPainted(panes, s => (start = s)));
    panes[0].focus();
    expect(result.current.covered).toBe(false);
    act(() => start());
    expect(whenPainted).not.toHaveBeenCalled();
  });

  test.each(['key', 'click'] as const)(
    'goes at once on a %s, which an autoFocused editor gets with no focus event',
    action => {
      const { result } = renderHook(() => useEditorCover());
      const panes = [fakeEditor()];
      act(() => result.current.revealWhenPainted(panes));
      expect(result.current.covered).toBe(true);
      panes[0][action]();
      expect(result.current.covered).toBe(false);
    },
  );
});
