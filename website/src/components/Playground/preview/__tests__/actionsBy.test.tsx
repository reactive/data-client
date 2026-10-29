/// <reference types="jest" />
import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { clearTabStorage } from '../../testing/tabStorage';
import { useActionsBy } from '../store/storeView';
import { ActionsByContext, type ActionsBy } from '../StoreToggle';

jest.mock('../../../../utils/tabStorage', () =>
  require('../../testing/tabStorage'),
);

function Shown({ id }: { id: string }) {
  const [by, setBy] = useActionsBy();
  return (
    <button data-testid={id} onClick={() => setBy('interaction')}>
      {by}
    </button>
  );
}

const mount = (id: string, groupId: string, defaultBy: ActionsBy) =>
  render(
    <ActionsByContext.Provider value={{ groupId, defaultBy }}>
      <Shown id={id} />
    </ActionsByContext.Provider>,
  );

describe('useActionsBy', () => {
  beforeEach(clearTabStorage);

  it("starts at the playground's default", () => {
    mount('a', 'docs', 'interaction');
    expect(screen.getByTestId('a').textContent).toBe('interaction');
  });

  it("keeps the reader's choice per group, over the default", () => {
    mount('a', 'docs', 'action');
    act(() => screen.getByTestId('a').click());
    expect(screen.getByTestId('a').textContent).toBe('interaction');
    // the same group, mounted again: the choice holds
    mount('b', 'docs', 'action');
    expect(screen.getByTestId('b').textContent).toBe('interaction');
    // another group keeps its own default
    mount('c', 'other', 'action');
    expect(screen.getByTestId('c').textContent).toBe('action');
  });
});
