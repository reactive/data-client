/// <reference types="jest" />
import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { SHOW_MS, toast, Toaster } from '../Toaster';

describe('Toaster', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows what toast sends, then removes it', () => {
    render(<Toaster />);
    act(() => {
      toast.success('Saved');
      toast.error('Failed');
    });
    expect(screen.getByText('Saved').dataset.kind).toBe('success');
    expect(screen.getByText('Failed').dataset.kind).toBe('error');

    act(() => jest.advanceTimersByTime(SHOW_MS));
    expect(screen.queryByText('Saved')).toBeNull();
    expect(screen.queryByText('Failed')).toBeNull();
  });

  it("keeps a toast with an action until it's pressed, then runs it", () => {
    const onClick = jest.fn();
    render(<Toaster />);
    act(() => toast.info('Mug removed', { label: 'Undo', onClick }));
    expect(screen.getByText('Mug removed').dataset.kind).toBe('info');

    act(() => jest.advanceTimersByTime(SHOW_MS));
    act(() => screen.getByRole('button', { name: 'Undo' }).click());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Mug removed')).toBeNull();
  });

  it('replaces a toast with an action by a newer one, and drops it on unmount', () => {
    const { unmount } = render(<Toaster />);
    const onClick = jest.fn();
    act(() => {
      toast.info('Mug removed', { label: 'Undo', onClick });
      toast.info('Filters removed', { label: 'Undo', onClick });
    });
    expect(screen.queryByText('Mug removed')).toBeNull();
    expect(screen.queryByText('Filters removed')).not.toBeNull();

    unmount();
    render(<Toaster />);
    expect(screen.queryByText('Filters removed')).toBeNull();
  });

  it('shows toasts sent before it mounted', () => {
    toast.success('Early');
    render(<Toaster />);
    expect(screen.queryByText('Early')).not.toBeNull();
    act(() => jest.advanceTimersByTime(SHOW_MS));
  });
});
