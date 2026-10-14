/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { CodeDocument } from '../codeModel';
import EditorSurface from '../EditorSurface';

jest.mock(
  '@docusaurus/useIsomorphicLayoutEffect',
  () => require('react').useLayoutEffect,
  { virtual: true },
);
// Monaco never mounts here (`interactive={false}`)
jest.mock('../../PlaygroundEditor', () => () => null);
jest.mock('../../monaco/models', () => ({ createMissingModels() {} }));

const documents: CodeDocument[] = [
  {
    value: 'export {}',
    path: 'a.ts',
    title: 'A',
    collapsed: true,
    language: 'ts',
  },
  {
    value: 'export {}',
    path: 'b.tsx',
    title: 'B',
    collapsed: false,
    language: 'tsx',
  },
];

function renderSurface(layout: 'row' | 'stacked') {
  return render(
    <EditorSurface
      documents={documents}
      update={() => {}}
      layout={layout}
      variant="playground"
      interactive={false}
      fixtureContent={<div>GET /article/1</div>}
    />,
  );
}

describe('EditorSurface fixtures', () => {
  test('row folds them under the file tabs, opened from the tab bar', () => {
    renderSurface('row');
    const toggle = screen.getByRole('button', { name: /Fixtures/ });
    expect(toggle.closest('[role="tablist"]')).toBeNull();
    const fixtures = screen.getByText('GET /article/1');
    expect(fixtures.closest('[inert]')).not.toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixtures.closest('[inert]')).toBeNull();
  });

  test('stacked shows them open, with no toggle', () => {
    renderSurface('stacked');
    expect(screen.queryByRole('button', { name: /Fixtures/ })).toBeNull();
    expect(screen.getByText('GET /article/1').closest('[inert]')).toBeNull();
  });
});
