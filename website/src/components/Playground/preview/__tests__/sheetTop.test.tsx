/// <reference types="jest" />
import { act, render } from '@testing-library/react';
import React, { useRef } from 'react';

import { useSheetTop } from '../store/dom';

// what each observer was handed, so a test can report a resize
let callbacks: (() => void)[] = [];
let disconnected = 0;
class Observer {
  constructor(private cb: () => void) {
    callbacks.push(cb);
  }

  observe() {
    this.cb();
  }

  disconnect() {
    disconnected++;
  }
}

/** Places `el`'s top `top` px down the page */
const at = (el: HTMLElement, top: number) =>
  (el.getBoundingClientRect = () => ({ top }) as DOMRect);

function Sheet({ layer }: { layer: HTMLElement | null }) {
  const sheet = useRef<HTMLDivElement>(null);
  useSheetTop(layer, sheet);
  return <div ref={sheet} data-testid="sheet" />;
}

describe('useSheetTop', () => {
  let layer: HTMLElement;
  beforeEach(() => {
    callbacks = [];
    disconnected = 0;
    (globalThis as any).ResizeObserver = Observer;
    layer = document.createElement('div');
    at(layer, 100);
    jest
      .spyOn(HTMLDivElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 170 } as DOMRect);
  });
  afterEach(() => {
    delete (globalThis as any).ResizeObserver;
    jest.restoreAllMocks();
  });

  it('puts the sheet top on the layer, following it as the header grows', () => {
    const { getByTestId } = render(<Sheet layer={layer} />);
    expect(layer.style.getPropertyValue('--store-sheet-top')).toBe('70px');
    // the expanded timeline pushes the sheet down
    at(getByTestId('sheet'), 230);
    act(() => callbacks.forEach(cb => cb()));
    expect(layer.style.getPropertyValue('--store-sheet-top')).toBe('130px');
  });

  it('takes it off the layer as the Store leaves', () => {
    const { unmount } = render(<Sheet layer={layer} />);
    unmount();
    expect(disconnected).toBe(1);
    expect(layer.style.getPropertyValue('--store-sheet-top')).toBe('');
  });

  it('measures nothing off the folder', () => {
    render(<Sheet layer={null} />);
    expect(callbacks).toHaveLength(0);
  });
});
