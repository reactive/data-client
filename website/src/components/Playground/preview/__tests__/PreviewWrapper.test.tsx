/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

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
      <PreviewWrapper code={{ shown: false, toggle: <button>Code</button> }}>
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
      <PreviewWrapper code={{ shown: true, toggle: <button>Code</button> }}>
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
