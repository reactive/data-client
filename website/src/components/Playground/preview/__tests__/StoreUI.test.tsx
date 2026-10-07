/// <reference types="jest" />
import { act, render } from '@testing-library/react';
import React from 'react';

import type { EntityTable, StoreModel } from '../store/model';
import { groupId, StoreUIProvider, useStoreUI } from '../store/StoreUI';

const table = (key: string): EntityTable => ({
  key,
  kind: 'entity',
  rows: [],
  fields: [],
});
const model = (...keys: string[]) =>
  ({ endpoints: [], tables: keys.map(table) }) as unknown as StoreModel;

let ui: ReturnType<typeof useStoreUI>;
function Probe() {
  ui = useStoreUI();
  return null;
}
const mount = (m: StoreModel) => (
  <StoreUIProvider model={m} onReveal={() => {}}>
    <Probe />
  </StoreUIProvider>
);

describe('StoreUI', () => {
  it('keeps groups open or closed when tables arrive later', () => {
    const { rerender } = render(mount(model('User', 'Post', '[Comment]')));
    expect(ui.isOpen(groupId('[Comment]'))).toBe(true);
    act(() => ui.toggle(groupId('Post')));
    expect(ui.isOpen(groupId('Post'))).toBe(false);

    // a new Entity type sorts ahead of the Collection
    rerender(mount(model('User', 'Post', 'Comment', '[Comment]')));
    expect(ui.isOpen(groupId('Post'))).toBe(false);
    expect(ui.isOpen(groupId('[Comment]'))).toBe(true);
    expect(ui.isOpen(groupId('Comment'))).toBe(false);
  });
});
