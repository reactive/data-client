/// <reference types="jest" />
import { act, fireEvent, render, screen } from '@testing-library/react';
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
  const [open, toggle] = useStoreOpen('store', defaultOpen);
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

/** Clicks the first Store toggle and waits for its tree */
async function openStore(container: HTMLElement) {
  const toggle = container.querySelector<HTMLElement>('[data-store-toggle]')!;
  await act(async () => {
    fireEvent.click(toggle);
  });
  await screen.findByTestId('tree');
  return toggle;
}

it('holds the clicked toggle through the commit that adds the tree', async () => {
  const { container } = render(<Playground defaultOpen="n" />);
  const toggle = await openStore(container);
  // once for the click, once for the tree a frame later
  expect(blocked).toEqual([toggle, toggle]);
});

it('holds nothing for a Store that mounts open', async () => {
  const page = (more: boolean) => (
    <>
      <Playground defaultOpen="n" />
      {more ?
        <Playground defaultOpen="y" />
      : null}
    </>
  );
  const { container, rerender } = render(page(false));
  const toggle = await openStore(container);
  blocked.length = 0;
  // the clicked toggle is still on the page as another Store mounts open
  rerender(page(true));
  expect(await screen.findAllByTestId('tree')).toHaveLength(2);
  expect(toggle.isConnected).toBe(true);
  expect(blocked).toEqual([]);
});
