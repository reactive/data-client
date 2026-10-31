/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import Playground from '..';

jest.mock('../userAgent', () => ({ isBot: false, isMobileOrBot: () => true }));
jest.mock('../PlaygroundEditor', () => require('../testing/playgroundEditor'));
// The real chunk pulls in the whole preview scope (ESM-only packages jest
// can't load)
jest.mock('../preview/LivePreview', () => {
  const { createElement } = require('react');
  const PreviewWrapper = require('../preview/PreviewWrapper').default;
  return {
    __esModule: true,
    default: () =>
      createElement(PreviewWrapper, { layout: 'stacked' }, 'the app'),
  };
});

const fence = (title: string, meta = '') =>
  React.createElement(
    'code',
    {
      key: title,
      className: 'language-tsx',
      metastring: `title="${title}" ${meta}`,
    },
    `export default function ${title}() { return null; }`,
  );

describe('stacked layout: the files', () => {
  test('several open at once are a card each, named by its file, folding on its own', () => {
    render(
      <Playground>
        {[fence('Types', 'collapsed'), fence('Api'), fence('App')]}
      </Playground>,
    );
    expect(screen.queryByRole('tab')).toBeNull();
    const types = screen.getByRole('button', { name: 'Types' });
    const api = screen.getByRole('button', { name: 'Api' });
    expect(types.getAttribute('aria-expanded')).toBe('false');
    expect(api.getAttribute('aria-expanded')).toBe('true');

    // opening one leaves the others as they are
    fireEvent.click(types);
    expect(types.getAttribute('aria-expanded')).toBe('true');
    expect(api.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(api);
    expect(api.getAttribute('aria-expanded')).toBe('false');
    expect(
      screen.getByRole('button', { name: 'App' }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  test('with one open, the files are tabs, as in a row', () => {
    render(
      <Playground>{[fence('Api', 'collapsed'), fence('App')]}</Playground>,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(tab => tab.textContent)).toEqual(['Api', 'App']);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Api' })).toBeNull();
  });
});
