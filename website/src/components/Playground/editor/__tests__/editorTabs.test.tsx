/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { render, screen } from '@testing-library/react';
import React from 'react';

import type { CodeDocument } from '../codeModel';
import EditorSurface from '../EditorSurface';

jest.mock('../../PlaygroundEditor', () =>
  require('../../testing/playgroundEditor'),
);

const file = (title?: string, col = false): CodeDocument => ({
  value: 'const a = 1;',
  title,
  col,
  path: `${title ?? 'default'}.ts`,
  language: 'ts',
  collapsed: false,
});

const tabs = (documents: CodeDocument[]) => {
  render(
    <EditorSurface
      documents={documents}
      update={() => undefined}
      layout="row"
      variant="standalone"
    />,
  );
  return screen.queryAllByRole('tab').map(tab => tab.textContent);
};

describe('row file tabs', () => {
  test('a lone untitled file beside a column file has no tab bar', () => {
    expect(tabs([file(), file('Usage', true)])).toEqual([]);
  });

  test("a lone titled file's title is its tab, never a column file's", () => {
    expect(tabs([file('getFoo'), file('Usage', true)])).toEqual(['getFoo']);
  });
});
