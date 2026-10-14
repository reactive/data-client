/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { CodeDocument } from '../codeModel';
import EditorSurface from '../EditorSurface';

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

function renderSurface(layout: 'row' | 'stacked', docs = documents) {
  return render(
    <EditorSurface
      documents={docs}
      update={() => {}}
      layout={layout}
      variant="playground"
      interactive={false}
      fixtureContent={<div>GET /article/1</div>}
      // as Playground passes in row (the Store's layer)
      cover={layout === 'row' ? <div /> : undefined}
    />,
  );
}

describe('EditorSurface fixtures', () => {
  test('row folds them behind a toggle beside the file tabs', () => {
    renderSurface('row');
    const toggle = screen.getByRole('button', { name: /Fixtures/ });
    expect(toggle.closest('[role="tablist"]')).toBeNull();
    const fixtures = screen.getByText('GET /article/1');
    expect(fixtures.closest('[inert]')).not.toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixtures.closest('[inert]')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixtures.closest('[inert]')).not.toBeNull();
  });

  test('stacked shows them open, with no toggle', () => {
    renderSurface('stacked');
    expect(screen.queryByRole('button', { name: /Fixtures/ })).toBeNull();
    expect(screen.getByText('GET /article/1').closest('[inert]')).toBeNull();
  });

  test('single-file row, with no file tabs, shows them as stacked does', () => {
    renderSurface('row', documents.slice(1));
    expect(screen.queryByRole('button', { name: /Fixtures/ })).toBeNull();
    expect(screen.getByText('GET /article/1').closest('[inert]')).toBeNull();
  });
});
