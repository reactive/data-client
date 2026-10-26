/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';

import PreviewWrapper from '../PreviewWrapper';

describe('PreviewWrapper fixtures', () => {
  test('float over the result from a header toggle', () => {
    render(
      <PreviewWrapper fixtures={<div>GET /article/1</div>}>
        <div>result</div>
      </PreviewWrapper>,
    );
    const toggle = screen.getByRole('button', { name: /Fixtures/ });
    const popover = document.getElementById(
      toggle.getAttribute('aria-controls')!,
    )!;
    expect(popover.textContent).toBe('GET /article/1');
    expect(popover.hasAttribute('data-open')).toBe(false);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(popover.hasAttribute('data-open')).toBe(true);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(popover.hasAttribute('data-open')).toBe(false);
  });

  test('no toggle without fixtures', () => {
    render(
      <PreviewWrapper>
        <div>result</div>
      </PreviewWrapper>,
    );
    expect(screen.queryByRole('button', { name: /Fixtures/ })).toBeNull();
  });
});

describe('PreviewWrapper label', () => {
  test("names the code in the label's place while it shows", () => {
    const { rerender } = render(
      <PreviewWrapper code={{ shown: false, toggle: () => {} }}>
        <div>result</div>
      </PreviewWrapper>,
    );
    // the toggle joins the header's controls
    expect(screen.getByRole('button', { name: 'Code' })).toBeTruthy();
    const live = screen.getByText('Live Preview');
    const editor = screen.getByText('Editor');
    expect(live.closest('[aria-hidden]')!.getAttribute('aria-hidden')).toBe(
      'false',
    );
    expect(editor.getAttribute('aria-hidden')).toBe('true');

    rerender(
      <PreviewWrapper code={{ shown: true, toggle: () => {} }}>
        <div>result</div>
      </PreviewWrapper>,
    );
    expect(live.closest('[aria-hidden]')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(editor.getAttribute('aria-hidden')).toBe('false');
  });

  test('is the label alone where the code never shows', () => {
    render(
      <PreviewWrapper>
        <div>result</div>
      </PreviewWrapper>,
    );
    expect(screen.queryByText('Editor')).toBeNull();
  });
});

describe('PreviewWrapper clock', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: Date.parse('2026-10-26T15:04:05.500Z') });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows the reader’s time only with `clock`, ticking each second', () => {
    const { rerender, unmount } = render(
      <PreviewWrapper>
        <div>result</div>
      </PreviewWrapper>,
    );
    expect(screen.queryByRole('timer')).toBeNull();

    rerender(
      <PreviewWrapper clock>
        <div>result</div>
      </PreviewWrapper>,
    );
    const time = () => screen.getByRole('timer').querySelector('time')!;
    expect(time().dateTime).toBe('2026-10-26T15:04:05.000Z');

    act(() => jest.advanceTimersByTime(500));
    expect(time().dateTime).toBe('2026-10-26T15:04:06.000Z');

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  test('holds no time in the server HTML', () => {
    const html = renderToString(
      <PreviewWrapper clock>
        <div>result</div>
      </PreviewWrapper>,
    );
    expect(html).toContain('role="timer"');
    expect(html).not.toContain('<time');
  });
});
