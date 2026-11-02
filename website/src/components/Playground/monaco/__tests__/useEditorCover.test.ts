/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react';
import type * as Monaco from 'monaco-editor';

import useEditorCover from '../useEditorCover';
import { whenPainted } from '../whenPainted';

jest.mock('../whenPainted', () => ({ whenPainted: jest.fn(() => jest.fn()) }));

/** An editor the reader can `focus()`, `type()` in or `click()` */
function fakeEditor() {
  const listeners: Record<string, () => void> = {};
  const on = (event: string) => (listener: () => void) => {
    listeners[event] = listener;
    return { dispose: () => delete listeners[event] };
  };
  const editor = {
    onDidFocusEditorText: on('focus'),
    onKeyDown: on('type'),
    onMouseDown: on('click'),
    onDidDispose: () => ({ dispose: jest.fn() }),
  } as unknown as Monaco.editor.ICodeEditor;
  const fire = (event: string) => () => act(() => listeners[event]?.());
  return Object.assign(editor, {
    focus: fire('focus'),
    type: fire('type'),
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
  beforeEach(() => jest.mocked(whenPainted).mockClear());

  test('stays until every editor has painted', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor(), fakeEditor()];
    act(() => result.current.revealWhenPainted(panes));
    finish(panes[0]);
    expect(result.current.covered).toBe(true);
    finish(panes[1]);
    expect(result.current.covered).toBe(false);
  });

  test('goes at once when any editor gains focus, and stops the others waiting', () => {
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

  test('waits to start until `after` says, though focus reveals meanwhile', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor()];
    let start = () => {};
    act(() =>
      result.current.revealWhenPainted(panes, s => {
        start = s;
      }),
    );
    expect(whenPainted).not.toHaveBeenCalled();
    act(() => start());
    finish(panes[0]);
    expect(result.current.covered).toBe(false);

    const second = renderHook(() => useEditorCover());
    const late = [fakeEditor()];
    act(() =>
      second.result.current.revealWhenPainted(late, s => {
        start = s;
      }),
    );
    late[0].focus();
    expect(second.result.current.covered).toBe(false);
    act(() => start());
    expect(
      jest.mocked(whenPainted).mock.calls.some(([e]) => e === late[0]),
    ).toBe(false);
  });

  test.each(['type', 'click'] as const)(
    'goes at once when the reader uses an autoFocused editor (%s)',
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
