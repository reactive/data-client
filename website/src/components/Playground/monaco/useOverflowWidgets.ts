import type * as Monaco from 'monaco-editor';
import { useCallback, useState } from 'react';

import styles from '../styles.module.css';

/**
 * Renders an editor's hovers, suggestions and parameter hints (Monaco's
 * overflow widgets) in a layer on <body>, so no playground stacking context
 * (tabs, Store, preview) paints over them and no clipping ancestor cuts them
 * off. One layer per editor: Monaco tracks focus inside it as the editor's.
 */
export default function useOverflowWidgets() {
  const [options] = useState(() => {
    const node = document.createElement('div');
    // `monaco-editor` scopes the theme's colors to it
    node.className = `monaco-editor ${styles.overflowWidgets}`;
    // fixed: Monaco then places them against the viewport, not the editor
    return { fixedOverflowWidgets: true, overflowWidgetsDomNode: node };
  });

  const handleMount = useCallback(
    (editor: Monaco.editor.ICodeEditor) => {
      const node = options.overflowWidgetsDomNode;
      document.body.append(node);
      // fixed widgets only move when the editor renders, so a page scroll
      // would leave an open suggest list or parameter hint behind its line
      // (hovers close on the mouse move that follows a scroll)
      const followScroll = () => {
        if (node.querySelector('.visible')) editor.render(true);
      };
      const listen = (on: boolean) =>
        window[on ? 'addEventListener' : 'removeEventListener'](
          'scroll',
          followScroll,
          { capture: true, passive: true },
        );
      editor.onDidFocusEditorWidget(() => listen(true));
      editor.onDidBlurEditorWidget(() => listen(false));
      // autoFocus focuses before this mount handler runs
      if (editor.hasWidgetFocus()) listen(true);
      editor.onDidDispose(() => {
        listen(false);
        node.remove();
      });
      // after mount: it creates widgets Monaco otherwise builds when idle
      setTimeout(() => measureInViewport(editor));
    },
    [options],
  );

  return { options, handleMount };
}

let patched = false;

/**
 * Monaco's hover and suggest list pick above or below the line by room
 * measured from the page's top (scroll included), so on a scrolled page they
 * pick above and, fixed, land on the line. Run them with scrollY 0 so they
 * measure in the viewport. Patches the classes every editor shares, found
 * through the first editor's widgets; if an upgrade renames these private
 * methods, they just keep preferring above.
 */
function measureInViewport(editor: Monaco.editor.ICodeEditor) {
  if (patched) return;
  const hover = (
    editor.getContribution('editor.contrib.contentHover') as any
  )?._getOrCreateContentWidget?.()?.widget;
  const suggest = (
    editor.getContribution('editor.contrib.suggestController') as any
  )?.widget?.value;
  // a disposed editor has none; the next one will
  if (!hover || !suggest) return;
  patched = true;
  patchMethod(hover, '_availableVerticalSpaceAbove');
  patchMethod(hover, '_availableVerticalSpaceBelow');
  patchMethod(suggest, '_layout');
}

function patchMethod(instance: object | undefined, name: string) {
  const proto = instance && Object.getPrototypeOf(instance);
  const original = proto?.[name];
  if (typeof original !== 'function') return;
  proto[name] = function (this: unknown, ...args: unknown[]) {
    // an own accessor in Chromium; a prototype one elsewhere
    const scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    try {
      return original.apply(this, args);
    } finally {
      if (scrollY) Object.defineProperty(window, 'scrollY', scrollY);
      else delete (window as { scrollY?: number }).scrollY;
    }
  };
}
