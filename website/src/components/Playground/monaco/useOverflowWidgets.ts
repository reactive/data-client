import type * as Monaco from 'monaco-editor';
import { useCallback, useState } from 'react';

import styles from '../styles.module.css';

/**
 * Renders an editor's hovers, suggestions, parameter hints and context menu
 * (Monaco's overflow widgets) in a layer on <body>, so no playground stacking
 * context (tabs, Store, preview) paints over them and no clipping ancestor
 * cuts them off. One layer per editor: Monaco tracks focus inside it as the
 * editor's.
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
      editor.onDidDispose(() => node.remove());
      followPageScroll(editor, node);
      // after mount: it creates widgets Monaco otherwise builds when idle
      setTimeout(() => measureInViewport(editor));
      menuInLayer(editor);
    },
    [options],
  );

  return { options, handleMount };
}

/**
 * Fixed widgets only move when the editor renders, so a page scroll would
 * leave an open suggest list or parameter hint behind its line (hovers close
 * on the mouse move that follows a scroll). Listens only while focus is in
 * the editor or its widgets.
 */
function followPageScroll(editor: Monaco.editor.ICodeEditor, node: Element) {
  const onScroll = () => {
    // set by Monaco on every content widget it is showing
    if (node.querySelector('[monaco-visible-content-widget]'))
      editor.render(true);
  };
  const options = { capture: true, passive: true };
  const start = () => window.addEventListener('scroll', onScroll, options);
  const stop = () => window.removeEventListener('scroll', onScroll, options);
  editor.onDidFocusEditorWidget(start);
  editor.onDidBlurEditorWidget(stop);
  editor.onDidDispose(stop);
  // autoFocus focuses before the mount handler runs
  if (editor.hasWidgetFocus()) start();
}

let viewportPatched = false;

/**
 * Monaco's hover and suggest list pick above or below the line by room
 * measured from the page's top (scroll included) against the window's
 * height, so on a scrolled page they pick above; fixed, they land on the
 * line. Run them with scrollY 0 so they measure in the viewport. Patches the
 * classes every editor shares, found through the first editor's widgets; if
 * an upgrade renames these private methods, they just keep preferring above.
 */
function measureInViewport(editor: Monaco.editor.ICodeEditor) {
  if (viewportPatched) return;
  const hover = (
    editor.getContribution('editor.contrib.contentHover') as any
  )?._getOrCreateContentWidget?.()?.widget;
  const suggest = (
    editor.getContribution('editor.contrib.suggestController') as any
  )?.widget?.value;
  // a disposed editor has none; the next one will
  if (!hover || !suggest) return;
  viewportPatched = true;
  patchMethod(hover, '_availableVerticalSpaceAbove', withScrollY0);
  patchMethod(hover, '_availableVerticalSpaceBelow', withScrollY0);
  patchMethod(suggest, '_layout', withScrollY0);
}

let menuPatched = false;

/**
 * With fixed overflow widgets, Monaco puts the context menu's shadow root in
 * the editor's container, outside `.monaco-editor`, so the theme's colors
 * (CSS variables) don't reach it and the menu has no background. Keep it in
 * the layer the editor hands it. Patches the context view service every
 * editor shares; if an upgrade renames it, the menu loses its colors again.
 */
function menuInLayer(editor: Monaco.editor.ICodeEditor) {
  if (menuPatched) return;
  const service = (editor.getContribution('editor.contrib.contextmenu') as any)
    ?._contextViewService;
  if (!service) return;
  menuPatched = true;
  patchMethod(
    service,
    'showContextView',
    (
      original,
      [delegate, container, shadowRoot, useWindowContainer, ...rest],
    ) =>
      original(
        delegate,
        container,
        shadowRoot,
        useWindowContainer &&
          !(container as Element | undefined)?.classList.contains(
            styles.overflowWidgets,
          ),
        ...rest,
      ),
  );
}

function withScrollY0(
  original: (...args: unknown[]) => unknown,
  args: unknown[],
) {
  // an own accessor in Chromium; a prototype one elsewhere
  const scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  try {
    return original(...args);
  } finally {
    if (scrollY) Object.defineProperty(window, 'scrollY', scrollY);
    else delete (window as { scrollY?: number }).scrollY;
  }
}

/** Wraps a method on `instance`'s prototype; skips it if it's gone */
function patchMethod(
  instance: object,
  name: string,
  wrap: (original: (...args: unknown[]) => unknown, args: unknown[]) => unknown,
) {
  const proto = Object.getPrototypeOf(instance);
  const original = proto[name];
  if (typeof original !== 'function') return;
  proto[name] = function (this: unknown, ...args: unknown[]) {
    return wrap((...a) => original.apply(this, a), args);
  };
}
