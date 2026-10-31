/// <reference types="jest" />
import { fireEvent, render } from '@testing-library/react';
import React, { useRef, useState } from 'react';

import { useMouseBack } from '../store/mouseBack';

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

const press = (el: Element, button: number) => {
  const event = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    button,
  });
  fireEvent(el, event);
  return event;
};

describe('useMouseBack', () => {
  it('takes the back button for itself while it has somewhere to go', () => {
    const { getByTestId } = render(<Panel start={1} />);
    const panel = getByTestId('panel');
    expect(press(panel, 3).defaultPrevented).toBe(true);
    expect(panel.textContent).toBe('0');
    // nothing left: the page goes back
    expect(press(panel, 3).defaultPrevented).toBe(false);
  });

  it('leaves other buttons alone', () => {
    const { getByTestId } = render(<Panel start={1} />);
    const panel = getByTestId('panel');
    expect(press(panel, 4).defaultPrevented).toBe(false);
    expect(press(panel, 0).defaultPrevented).toBe(false);
    expect(panel.textContent).toBe('1');
  });
});
