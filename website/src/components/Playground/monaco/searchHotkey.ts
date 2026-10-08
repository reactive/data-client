/**
 * Keeps DocSearch's "/" hotkey from firing while a Monaco editor has focus.
 *
 * DocSearch skips inputs, textareas and contentEditable, but Monaco types
 * through an EditContext div (role="textbox"), which it doesn't recognize.
 * Docusaurus doesn't forward DocSearch's `keyboardShortcuts` option, so we stop
 * the event at document: after Monaco's handlers, before DocSearch's on window.
 */
export function shieldEditorsFromSearchHotkey() {
  document.addEventListener('keydown', event => {
    if (
      event.key === '/' &&
      event.target instanceof Element &&
      event.target.closest('.monaco-editor')
    ) {
      event.stopPropagation();
    }
  });
}
