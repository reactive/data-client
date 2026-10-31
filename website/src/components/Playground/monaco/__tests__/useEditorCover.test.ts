/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react';
import type * as Monaco from 'monaco-editor';

import useEditorCover from '../useEditorCover';
import { whenPainted } from '../whenPainted';

jest.mock('../whenPainted', () => ({ whenPainted: jest.fn(() => jest.fn()) }));

/** An editor whose `focus()` fires its focus listeners */
function fakeEditor() {
  const focusListeners: (() => void)[] = [];
  const editor = {
    onDidDispose: () => ({ dispose: jest.fn() }),
    onDidFocusEditorText: (listener: () => void) => {
      focusListeners.push(listener);
      return { dispose: jest.fn() };
    },
  } as unknown as Monaco.editor.ICodeEditor;
  return { editor, focus: () => focusListeners.forEach(l => l()) };
}

/** Calls `editor`'s whenPainted callback, as when it has painted */
function paint(editor: Monaco.editor.ICodeEditor) {
  const call = jest.mocked(whenPainted).mock.calls.find(([e]) => e === editor);
  act(() => call?.[1]());
}

describe('useEditorCover', () => {
  // jsdom has no Element.animate: the cover goes at once
  beforeEach(() => jest.mocked(whenPainted).mockClear());

  test('stays until every editor has painted', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor().editor, fakeEditor().editor];
    act(() => result.current.cover(panes));
    paint(panes[0]);
    expect(result.current.covered).toBe(true);
    paint(panes[1]);
    expect(result.current.covered).toBe(false);
  });

  test('goes at once when any editor gains focus', () => {
    const { result } = renderHook(() => useEditorCover());
    const [original, modified] = [fakeEditor(), fakeEditor()];
    act(() => result.current.cover([original.editor, modified.editor]));
    act(() => modified.focus());
    expect(result.current.covered).toBe(false);
  });
});
