/// <reference types="jest" />
import type * as Monaco from 'monaco-editor';

import { whenPainted } from '../whenPainted';

/** An editor `width` wide; `draw(lines)` renders its view lines, each a
 * list of token classes */
function fakeEditor(width: number) {
  const dom = document.createElement('div');
  let onFocus = () => {};
  let onLayout = () => {};
  const editor = {
    getLayoutInfo: () => ({ width }),
    getDomNode: () => dom,
    onDidFocusEditorText: (listener: () => void) => {
      onFocus = listener;
      return { dispose: () => (onFocus = () => {}) };
    },
    onDidLayoutChange: (listener: () => void) => {
      onLayout = listener;
      return { dispose: () => (onLayout = () => {}) };
    },
  } as unknown as Monaco.editor.ICodeEditor;
  const resize = (to: number) => {
    width = to;
    onLayout();
  };
  const draw = (lines: string[][]) => {
    dom.innerHTML = '';
    // Monaco places lines by `top`, not in DOM order
    [...lines].reverse().forEach((tokens, i) => {
      const line = document.createElement('div');
      line.className = 'view-line';
      line.style.top = `${(lines.length - 1 - i) * 19}px`;
      for (const token of tokens) {
        const span = document.createElement('span');
        span.className = token;
        span.textContent = token === 'space' ? ' ' : 'x';
        line.append(span);
      }
      dom.append(line);
    });
  };
  return { editor, draw, resize, focus: () => onFocus() };
}

describe('whenPainted', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const frames = (n: number) => jest.advanceTimersByTime(n * 16);

  test('once every line is highlighted, for two frames', () => {
    const { editor, draw } = fakeEditor(600);
    const done = jest.fn();
    whenPainted(editor, done);
    // the top line only: the rest are yet to be reached
    draw([['mtk5'], ['mtk1'], ['space']]);
    frames(4);
    expect(done).not.toHaveBeenCalled();

    draw([['mtk5'], ['mtk1', 'mtk6 mtki'], ['space']]);
    frames(1);
    expect(done).not.toHaveBeenCalled();
    frames(1);
    expect(done).toHaveBeenCalledTimes(1);
    frames(4);
    expect(done).toHaveBeenCalledTimes(1);
  });

  test('waits, however long, while it has no width to lay out in', () => {
    const { editor, draw, resize } = fakeEditor(0);
    const done = jest.fn();
    whenPainted(editor, done);
    draw([['mtk5']]);
    jest.advanceTimersByTime(10000);
    expect(done).not.toHaveBeenCalled();

    resize(600);
    frames(2);
    expect(done).toHaveBeenCalledTimes(1);
  });

  test('at once when it gains focus', () => {
    const { editor, focus } = fakeEditor(600);
    const done = jest.fn();
    whenPainted(editor, done);
    focus();
    expect(done).toHaveBeenCalledTimes(1);
    frames(4);
    expect(done).toHaveBeenCalledTimes(1);
  });

  test('regardless, after a while', () => {
    const { editor, draw } = fakeEditor(600);
    draw([['mtk1']]);
    const done = jest.fn();
    whenPainted(editor, done);
    jest.advanceTimersByTime(5900);
    expect(done).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200);
    expect(done).toHaveBeenCalledTimes(1);
  });

  test('never once cancelled', () => {
    const { editor, draw, focus } = fakeEditor(600);
    draw([['mtk5']]);
    const done = jest.fn();
    whenPainted(editor, done)();
    frames(4);
    focus();
    expect(done).not.toHaveBeenCalled();
  });
});
