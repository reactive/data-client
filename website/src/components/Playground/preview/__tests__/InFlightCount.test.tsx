/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { actionTypes } from '@data-client/react';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { useInFlightCount } from '../InFlightCount';

let manager: any;
function Harness({ mounted }: { mounted: boolean }) {
  const inFlight = useInFlightCount(true);
  manager = inFlight.manager;
  return mounted ? inFlight.badge : null;
}

/** A store: its own controller, dispatching through the manager */
function store() {
  const dispatch = manager.middleware({})((action: any) => action);
  return {
    fetch: (key: string) => dispatch({ type: actionTypes.FETCH, key }),
    respond: (key: string) => dispatch({ type: actionTypes.SET_RESPONSE, key }),
  };
}

describe('useInFlightCount', () => {
  test('stays hidden until a fetch', () => {
    render(<Harness mounted />);
    store();
    expect(screen.getByRole('status', { hidden: true }).hidden).toBe(true);
  });

  test('counts each key from its fetch until its response', () => {
    render(<Harness mounted />);
    const { fetch, respond } = store();
    fetch('a');
    fetch('b');
    expect(screen.getByRole('status').textContent).toBe('2 fetches in flight');
    respond('a');
    expect(screen.getByRole('status').textContent).toBe('1 fetch in flight');
  });

  test('shows fetches that ran before the badge mounted', () => {
    const { rerender } = render(<Harness mounted={false} />);
    store().fetch('a');
    rerender(<Harness mounted />);
    expect(screen.getByRole('status').textContent).toBe('1 fetch in flight');
  });

  test("a Reset's new store keeps its count after the old one's cleanup", () => {
    render(<Harness mounted />);
    const old = store();
    old.fetch('a');
    old.fetch('b');
    const next = store();
    next.fetch('c');
    manager.cleanup();
    expect(screen.getByRole('status').textContent).toBe('1 fetch in flight');
    // the old store's late responses don't touch the new count
    old.respond('a');
    expect(screen.getByRole('status').textContent).toBe('1 fetch in flight');
    next.respond('c');
    expect(screen.getByRole('status').textContent).toBe('0 fetches in flight');
  });
});
