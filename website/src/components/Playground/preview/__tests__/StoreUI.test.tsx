/// <reference types="jest" />
import { act, render } from '@testing-library/react';
import React from 'react';

import type { EntityTable, StoreModel } from '../store/model';
import { endpointId, entityId } from '../store/model';
import {
  groupId,
  ROW_LIMIT,
  sectionId,
  showAllId,
  StoreUIProvider,
  useStoreUI,
} from '../store/StoreUI';

const table = (key: string): EntityTable => ({
  key,
  kind: 'entity',
  rows: [],
  fields: [],
  get: () => undefined,
});
const model = (...keys: string[]) =>
  ({ endpoints: [], tables: keys.map(table) }) as unknown as StoreModel;

let ui: ReturnType<typeof useStoreUI>;
function Probe() {
  ui = useStoreUI();
  return null;
}
const onReveal = jest.fn();
const mount = (m: StoreModel) => (
  <StoreUIProvider model={m} onReveal={onReveal}>
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

  it('reveal opens everything leading to a row', () => {
    const rows = Array.from({ length: ROW_LIMIT + 1 }, (_, i) => ({
      id: entityId('Late', `${i}`),
    })) as unknown as EntityTable['rows'];
    const m = {
      endpoints: [{ id: endpointId('GET /x') }],
      tables: ['A', 'B', 'C'].map(table).concat({ ...table('Late'), rows }),
    } as unknown as StoreModel;
    render(mount(m));
    act(() => ui.toggle(sectionId('entities')));
    const target = entityId('Late', `${ROW_LIMIT}`);
    act(() => ui.reveal(target));
    expect(ui.selected).toBe(target);
    expect(onReveal).toHaveBeenCalledWith(target);
    for (const id of [
      target,
      sectionId('entities'),
      groupId('Late'),
      showAllId(groupId('Late')),
    ])
      expect(ui.isOpen(id)).toBe(true);

    act(() => ui.reveal(endpointId('GET /x')));
    expect(ui.isOpen(sectionId('endpoints'))).toBe(true);
  });
});
