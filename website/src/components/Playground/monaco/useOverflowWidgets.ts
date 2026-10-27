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
  // `monaco-editor` scopes the theme's colors to it
  const [domNode] = useState(() => {
    const node = document.createElement('div');
    node.className = `monaco-editor ${styles.overflowWidgets}`;
    return node;
  });

  const handleMount = useCallback(
    (editor: Monaco.editor.ICodeEditor) => {
      document.body.append(domNode);
      // fixed widgets only move when the editor renders, so a page scroll
      // would leave an open suggest list behind its line (hovers close on
      // the mouse move that follows a scroll)
      const followScroll = () => {
        if (editor.hasTextFocus()) editor.render(true);
      };
      window.addEventListener('scroll', followScroll, {
        capture: true,
        passive: true,
      });
      editor.onDidDispose(() => {
        domNode.remove();
        window.removeEventListener('scroll', followScroll, { capture: true });
      });
      measureInViewport(editor);
    },
    [domNode],
  );

  return {
    // fixed: Monaco then places them against the viewport, not the editor
    options: { fixedOverflowWidgets: true, overflowWidgetsDomNode: domNode },
    handleMount,
  };
}

let patched = false;

/**
 * Monaco's hover and suggest list choose above or below the line by the room
 * they have there, but measure it from the page's top (scroll included)
 * against the window's height: on a scrolled page they always find room
 * above, and fixed, they clamp to the viewport's top, over the line itself.
 * So they measure as if the page weren't scrolled, which turns page
 * coordinates into viewport ones.
 *
 * Patches the private classes every editor shares, found through the first
 * editor; if a Monaco upgrade renames them, they just keep preferring above.
 */
function measureInViewport(editor: Monaco.editor.ICodeEditor) {
  if (patched) return;
  patched = true;
  const hover = (
    editor.getContribution('editor.contrib.contentHover') as any
  )?._getOrCreateContentWidget?.()?.widget;
  const suggest = (
    editor.getContribution('editor.contrib.suggestController') as any
  )?.widget?.value;
  patchMethod(hover, '_availableVerticalSpaceAbove');
  patchMethod(hover, '_availableVerticalSpaceBelow');
  patchMethod(suggest, '_layout');
}

function patchMethod(instance: object | undefined, name: string) {
  let proto = instance && Object.getPrototypeOf(instance);
  while (proto && !Object.hasOwn(proto, name))
    proto = Object.getPrototypeOf(proto);
  if (!proto) return;
  const original = proto[name];
  proto[name] = function (this: unknown, ...args: unknown[]) {
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
