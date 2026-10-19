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

function Playground({
  groupId,
  defaultOpen,
}: {
  groupId: string;
  defaultOpen: 'y' | 'n';
}) {
  const [open, toggle] = useStoreOpen(groupId, defaultOpen);
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

it('holds the clicked toggle through the commit that adds the tree', async () => {
  const { container, findByTestId } = render(
    <Playground groupId="a" defaultOpen="n" />,
  );
  const toggle = container.querySelector<HTMLElement>('[data-store-toggle]')!;
  await act(async () => {
    fireEvent.click(toggle);
  });
  await findByTestId('tree');
  // once for the click, once for the tree a frame later
  expect(blocked).toEqual([toggle, toggle]);
});

it('holds nothing for a Store that mounts open', async () => {
  const page = (more: boolean) => (
    <>
      <Playground groupId="a" defaultOpen="n" />
      {more ?
        <Playground groupId="b" defaultOpen="y" />
      : null}
    </>
  );
  const { container, findByTestId, findAllByTestId, rerender } = render(
    page(false),
  );
  const toggle = container.querySelector<HTMLElement>('[data-store-toggle]')!;
  await act(async () => {
    fireEvent.click(toggle);
  });
  await findByTestId('tree');
  blocked.length = 0;
  // the clicked toggle is still on the page as another Store mounts open
  rerender(page(true));
  expect(await findAllByTestId('tree')).toHaveLength(2);
  expect(toggle.isConnected).toBe(true);
  expect(blocked).toEqual([]);
});
