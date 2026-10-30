/// <reference types="jest" />
import { act, fireEvent, render } from '@testing-library/react';
import React, { useRef, useState } from 'react';

import { useMouseBack } from '../store/mouseBack';

let mockGecko = false;
jest.mock('../../userAgent', () => ({ isGecko: () => mockGecko }));

/** A panel `depth` levels deep, each Back taking one off */
function Panel({ start }: { start: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(start);
  useMouseBack(ref, depth > 0, () => setDepth(d => d - 1));
  return (
    <div ref={ref} data-testid="panel">
      {depth}
    </div>
  );
}

const backButton = (el: Element) => {
  const event = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    button: 3,
  });
  fireEvent(el, event);
  return event;
};
const hover = (el: Element, inside: boolean) => {
  const event = new MouseEvent(inside ? 'pointerenter' : 'pointerleave');
  Object.assign(event, { pointerType: 'mouse' });
  fireEvent(el, event);
};
/** Lets history traverse (async in jsdom, as in browsers) */
const settle = () => act(() => new Promise(resolve => setTimeout(resolve, 20)));
/** The browser's Back (`delta` -1), once it has landed */
const go = (delta: number) => {
  window.history.go(delta);
  return settle();
};

describe('useMouseBack', () => {
  afterEach(() => {
    mockGecko = false;
  });

  it('takes the back button for itself while it has somewhere to go', () => {
    const { getByTestId } = render(<Panel start={1} />);
    const panel = getByTestId('panel');
    expect(backButton(panel).defaultPrevented).toBe(true);
    expect(panel.textContent).toBe('0');
    // nothing left: the page goes back
    expect(backButton(panel).defaultPrevented).toBe(false);
  });

  describe('in Firefox', () => {
    let routerSaw: jest.Mock;
    beforeEach(() => {
      mockGecko = true;
      window.history.pushState({ page: 1 }, '');
      routerSaw = jest.fn();
      window.addEventListener('popstate', routerSaw);
    });
    afterEach(() => window.removeEventListener('popstate', routerSaw));

    it('goes back a level for each Back while the mouse is over it', async () => {
      const { getByTestId } = render(<Panel start={2} />);
      const panel = getByTestId('panel');
      const length = window.history.length;
      hover(panel, true);
      expect(window.history.length).toBe(length + 1);
      await go(-1);
      expect(panel.textContent).toBe('1');
      expect(routerSaw).not.toHaveBeenCalled();
      await go(-1);
      expect(panel.textContent).toBe('0');
      await settle();
      expect(routerSaw).not.toHaveBeenCalled();
      // none left: Back leaves the page
      expect(window.history.state.page).toBe(1);
      await go(-1);
      expect(routerSaw).toHaveBeenCalledTimes(1);
    });

    it('takes its entry away as the mouse leaves', async () => {
      const { getByTestId } = render(<Panel start={1} />);
      const panel = getByTestId('panel');
      hover(panel, true);
      expect(window.history.state.__storeBack).toBeTruthy();
      hover(panel, false);
      await settle();
      expect(window.history.state.__storeBack).toBeUndefined();
      expect(panel.textContent).toBe('1');
      expect(routerSaw).not.toHaveBeenCalled();
    });

    it('leaves Back to anywhere else to the page', async () => {
      const { getByTestId } = render(<Panel start={1} />);
      const panel = getByTestId('panel');
      hover(panel, true);
      await go(-2);
      expect(routerSaw).toHaveBeenCalledTimes(1);
      expect(panel.textContent).toBe('1');
    });

    it('adds nothing with nowhere to go back to', () => {
      const { getByTestId } = render(<Panel start={0} />);
      const length = window.history.length;
      hover(getByTestId('panel'), true);
      expect(window.history.length).toBe(length);
    });
  });
});
