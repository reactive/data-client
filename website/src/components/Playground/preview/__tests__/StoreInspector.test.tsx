/// <reference types="jest" />
import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';

import { blocked } from '../../testing/docusaurusThemeCommonInternal';
import type SchemaRegistry from '../store/schemaRegistry';
import StoreInspector from '../StoreInspector';
import { useStoreOpen } from '../StoreToggle';

jest.mock('../../../../utils/tabStorage', () => ({
  useTabStorage: () => require('react').useState(null),
}));
jest.mock(
  '../store/StorePanel',
  () => () => require('react').createElement('div', { 'data-testid': 'tree' }),
);

function Playground({ defaultOpen }: { defaultOpen: 'y' | 'n' }) {
  const [open, toggle] = useStoreOpen('store-inspector-test', defaultOpen);
  return (
    <StoreInspector
      open={open}
      toggle={toggle}
      registry={{} as SchemaRegistry}
      history={0}
      row={false}
      host={null}
    />
  );
}

beforeEach(() => {
  blocked.length = 0;
});

it('holds the clicked toggle through the render that adds the tree', async () => {
  const { container, findByTestId } = render(<Playground defaultOpen="n" />);
  const toggle = container.querySelector<HTMLElement>('[data-store-toggle]')!;
  await act(async () => {
    fireEvent.click(toggle);
  });
  await findByTestId('tree');
  // once for the click, once for the tree a frame later
  expect(blocked).toEqual([toggle, toggle]);
});

it('holds nothing for a Store that mounts open', async () => {
  const { findByTestId } = render(<Playground defaultOpen="y" />);
  await findByTestId('tree');
  expect(blocked).toEqual([]);
});
