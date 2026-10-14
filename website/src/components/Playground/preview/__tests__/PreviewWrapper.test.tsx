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
