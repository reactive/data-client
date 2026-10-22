import { render } from '@testing-library/react';
import React from 'react';

import { plain } from '../store/refs';
import { Primitive } from '../store/Value';

/** What a Temporal value (built-in or polyfilled) exposes */
const temporal = (tag: string, iso: string, fields: object = {}) => ({
  ...fields,
  [Symbol.toStringTag]: tag,
  toString: () => iso,
  toLocaleString: () => `locale ${iso}`,
});

const shown = (value: unknown) => {
  const { container } = render(<Primitive value={value} />);
  return container.firstElementChild as HTMLElement;
};

describe('Store values', () => {
  it('writes a Date as a date and time, with its full form on hover', () => {
    const date = new Date(2026, 9, 8, 9, 56, 52);
    const el = shown(date);
    expect(el.textContent).toBe('Oct 8, 2026, 9:56:52 AM');
    expect(el.title).toBe(String(date));
    expect(shown(new Date('nope')).textContent).toBe('Invalid Date');
  });

  it('writes a Temporal.Instant like a Date, other Temporal values as the locale does', () => {
    const at = new Date(2026, 9, 8, 9, 56, 52).getTime();
    const instant = temporal('Temporal.Instant', '2026-10-08T13:56:52Z', {
      epochMilliseconds: at,
    });
    expect(plain(instant)).toEqual({ t: 'val', v: instant });
    const el = shown(instant);
    expect(el.textContent).toBe('Oct 8, 2026, 9:56:52 AM');
    expect(el.title).toBe('2026-10-08T13:56:52Z');
    expect(
      shown(temporal('Temporal.PlainDate', '2026-10-08')).textContent,
    ).toBe('locale 2026-10-08');
  });
});
