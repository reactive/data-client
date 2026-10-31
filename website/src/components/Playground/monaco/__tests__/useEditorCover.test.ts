/// <reference types="jest" />
import { act, renderHook } from '@testing-library/react';
import type * as Monaco from 'monaco-editor';

import useEditorCover from '../useEditorCover';
import { whenPainted } from '../whenPainted';

jest.mock('../whenPainted', () => ({ whenPainted: jest.fn(() => jest.fn()) }));

/** An editor that has text focus while `focused` is set */
function fakeEditor() {
  const state = { focused: false };
  const editor = {
    hasTextFocus: () => state.focused,
    onDidDispose: () => ({ dispose: jest.fn() }),
  } as unknown as Monaco.editor.ICodeEditor;
  return Object.assign(editor, { state });
}

/** Ends `editor`'s whenPainted wait, as when it has painted or gained focus */
function finish(editor: Monaco.editor.ICodeEditor) {
  const call = jest.mocked(whenPainted).mock.calls.find(([e]) => e === editor);
  act(() => call?.[1]());
}

describe('useEditorCover', () => {
  // jsdom has no Element.animate: the cover goes at once
  beforeEach(() => jest.mocked(whenPainted).mockClear());

  test('stays until every editor has painted', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor(), fakeEditor()];
    act(() => result.current.cover(panes));
    finish(panes[0]);
    expect(result.current.covered).toBe(true);
    finish(panes[1]);
    expect(result.current.covered).toBe(false);
  });

  test('goes at once when any editor gains focus, and stops the others waiting', () => {
    const { result } = renderHook(() => useEditorCover());
    const panes = [fakeEditor(), fakeEditor()];
    act(() => result.current.cover(panes));
    panes[1].state.focused = true;
    finish(panes[1]);
    expect(result.current.covered).toBe(false);
    const stopOriginal = jest.mocked(whenPainted).mock.results[0].value;
    expect(stopOriginal).toHaveBeenCalled();
  });
});
