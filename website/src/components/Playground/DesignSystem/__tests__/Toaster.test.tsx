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

  it('shows toasts sent before it mounted', () => {
    toast.success('Early');
    render(<Toaster />);
    expect(screen.queryByText('Early')).not.toBeNull();
    act(() => jest.advanceTimersByTime(SHOW_MS));
  });
});
