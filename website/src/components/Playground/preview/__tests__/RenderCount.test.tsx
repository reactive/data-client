/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { Profiler, useState } from 'react';

import { useRenderCount } from '../RenderCount';

function Counter() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  return (
    <>
      <button onClick={() => (setA(a + 1), setB(b + 1))}>batched</button>
      <button
        onClick={() => {
          setTimeout(() => setA(n => n + 1), 10);
          setTimeout(() => setB(n => n + 1), 20);
        }}
      >
        separate
      </button>
    </>
  );
}

function Harness() {
  const { onCommit, badge } = useRenderCount(true);
  return (
    <>
      {badge}
      <Profiler id="test" onRender={onCommit!}>
        <Counter />
      </Profiler>
    </>
  );
}

describe('useRenderCount', () => {
  test('renders nothing when disabled', () => {
    function Disabled() {
      const { onCommit, badge } = useRenderCount(false);
      expect(onCommit).toBeUndefined();
      return badge ?? null;
    }
    const { container } = render(<Disabled />);
    expect(container.innerHTML).toBe('');
  });

  test('ignores commits before the badge mounts', () => {
    function Unmounted() {
      const { onCommit } = useRenderCount(true);
      return (
        <Profiler id="test" onRender={onCommit!}>
          <Counter />
        </Profiler>
      );
    }
    expect(() => render(<Unmounted />)).not.toThrow();
  });

  test('stays hidden until a commit is reported', () => {
    function NoCommits() {
      return useRenderCount(true).badge;
    }
    render(<NoCommits />);
    expect(screen.getByTitle(/React commits/).hidden).toBe(true);
  });

  test('counts commits of the profiled subtree and resets on click', () => {
    jest.useFakeTimers();
    render(<Harness />);
    const badge = screen.getByTitle(/React commits/);
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe('1 render');

    fireEvent.click(screen.getByText('batched'));
    expect(badge.textContent).toBe('2 renders');

    fireEvent.click(screen.getByText('separate'));
    act(() => jest.advanceTimersByTime(10));
    act(() => jest.advanceTimersByTime(10));
    expect(badge.textContent).toBe('4 renders');

    // Resetting doesn't render the profiled subtree, so it stays at zero.
    fireEvent.click(badge);
    expect(badge.textContent).toBe('0 renders');
    jest.useRealTimers();
  });
});
