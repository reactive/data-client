/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';

import WallClock from '../WallClock';

describe('WallClock', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: Date.parse('2026-10-26T15:04:05.500Z') });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows the reader’s time, ticking each second', () => {
    const { unmount } = render(<WallClock />);
    const time = () => screen.getByRole('timer').querySelector('time')!;
    expect(time().dateTime).toBe('2026-10-26T15:04:05.000Z');

    act(() => jest.advanceTimersByTime(500));
    expect(time().dateTime).toBe('2026-10-26T15:04:06.000Z');

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  test('holds no time in the server HTML', () => {
    const html = renderToString(<WallClock />);
    expect(html).toContain('role="timer"');
    expect(html).not.toContain('<time');
  });
});
